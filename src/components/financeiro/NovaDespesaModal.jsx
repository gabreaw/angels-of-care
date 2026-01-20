import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import {
  X,
  Save,
  PlusCircle,
  Paperclip,
  CheckCircle,
  Loader2,
  Calendar,
  Settings,
  Repeat,
  Trash2,
  AlertTriangle, // Ícone para o aviso de recorrência
} from "lucide-react";
import NovoFornecedorModal from "./NovoFornecedorModal";
import GerenciarCategoriasModal from "./GerenciarCategoriasModal";
import NovaContaModal from "./NovaContaModal";

export default function NovaDespesaModal({
  onClose,
  onSuccess,
  despesaParaEditar = null,
}) {
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Modais auxiliares
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Modal de confirmação de recorrência
  const [showRecorrenciaOptions, setShowRecorrenciaOptions] = useState(false);

  const fileInputRef = useRef(null);

  const [fornecedores, setFornecedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);

  const [formData, setFormData] = useState({
    entidade_id: "",
    data_competencia: new Date().toISOString().split("T")[0],
    descricao: "",
    valor: "",
    categoria_id: "",
    centro_custo: "",
    codigo_referencia: "",
    parcelamento: "avista",
    numero_parcelas: 1,
    frequencia_recorrencia: "mensal",
    data_vencimento: new Date().toISOString().split("T")[0],
    forma_pagamento: "boleto",
    conta_id: "",
    status: "pendente",
    observacoes: "",
    anexo_urls: [], // Array de objetos {name, url}
  });

  useEffect(() => {
    fetchData();

    if (despesaParaEditar) {
      let existingUrls = [];
      try {
        if (despesaParaEditar.anexo_url) {
          if (despesaParaEditar.anexo_url.trim().startsWith("[")) {
            existingUrls = JSON.parse(despesaParaEditar.anexo_url);
          } else {
            // Compatibilidade com arquivos antigos (string única)
            existingUrls = [despesaParaEditar.anexo_url];
          }
        }
      } catch (e) {
        existingUrls = despesaParaEditar.anexo_url
          ? [despesaParaEditar.anexo_url]
          : [];
      }

      setFormData({
        entidade_id: despesaParaEditar.entidade_id || "",
        data_competencia:
          despesaParaEditar.data_competencia ||
          new Date().toISOString().split("T")[0],
        descricao: despesaParaEditar.descricao,
        valor: despesaParaEditar.valor
          ? formatCurrencyInput(despesaParaEditar.valor)
          : "",
        categoria_id: despesaParaEditar.categoria_id || "",
        centro_custo: despesaParaEditar.centro_custo || "",
        codigo_referencia: despesaParaEditar.codigo_referencia || "",
        // Se tem recorrencia_id, tratamos como recorrente na lógica, mas visualmente pode mostrar o tipo original
        parcelamento: despesaParaEditar.recorrencia_id
          ? "recorrente"
          : "avista",
        numero_parcelas: 1,
        frequencia_recorrencia: "mensal",
        data_vencimento: despesaParaEditar.data_vencimento,
        forma_pagamento: despesaParaEditar.forma_pagamento || "boleto",
        conta_id: despesaParaEditar.conta_id || "",
        status: despesaParaEditar.status,
        observacoes: despesaParaEditar.observacoes || "",
        anexo_urls: existingUrls,
      });
    }
  }, [despesaParaEditar]);

  const formatCurrencyInput = (val) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  async function fetchData() {
    const [entRes, catRes, accRes] = await Promise.all([
      supabase.from("financeiro_entidades").select("*").order("nome"),
      supabase
        .from("financeiro_categorias")
        .select("*")
        .eq("tipo", "despesa")
        .order("nome"),
      supabase.from("financeiro_contas").select("*").order("nome"),
    ]);
    setFornecedores(entRes.data || []);
    setCategorias(catRes.data || []);
    setContas(accRes.data || []);
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFile(true);
    const newAttachments = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop().toLowerCase().trim();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `private/despesas/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("financeiro")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("financeiro")
          .getPublicUrl(filePath);

        // Salva objeto com NOME e URL
        newAttachments.push({
          name: file.name,
          url: data.publicUrl,
        });
      }

      setFormData((prev) => ({
        ...prev,
        anexo_urls: [...prev.anexo_urls, ...newAttachments],
      }));

      alert(`${files.length} arquivo(s) anexado(s) com sucesso!`);
    } catch (error) {
      alert("Erro ao enviar arquivo: " + error.message);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      anexo_urls: prev.anexo_urls.filter((_, index) => index !== indexToRemove),
    }));
  };

  // Intercepta o submit para verificar recorrência
  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (despesaParaEditar && despesaParaEditar.recorrencia_id) {
      setShowRecorrenciaOptions(true);
    } else {
      handleSubmit("unico");
    }
  };

  const handleSubmit = async (modoEdicao = "unico") => {
    setLoading(true);

    // Padroniza anexos para salvar nomes corretamente
    const anexosPadronizados = formData.anexo_urls.map((item) => {
      if (typeof item === "string") {
        const nomeExtraido = decodeURIComponent(
          item.split("/").pop().split("?")[0],
        );
        return { name: nomeExtraido, url: item };
      }
      return item;
    });
    const anexoUrlString = JSON.stringify(anexosPadronizados);

    const valorTotal = formData.valor
      ? parseFloat(
          String(formData.valor)
            .replace(/[^\d,]/g, "")
            .replace(",", "."),
        )
      : 0;

    const payloadBase = {
      tipo: "despesa",
      descricao: formData.descricao,
      status: formData.status,
      data_competencia: formData.data_competencia,
      categoria_id: formData.categoria_id || null,
      entidade_id: formData.entidade_id || null,
      conta_id: formData.conta_id || null,
      centro_custo: formData.centro_custo,
      forma_pagamento: formData.forma_pagamento,
      data_pagamento: formData.status === "pago" ? new Date() : null,
      observacoes: formData.observacoes,
      anexo_url: anexoUrlString,
    };

    try {
      if (despesaParaEditar) {
        // --- CENÁRIO: ATUALIZAR APENAS UM ---
        if (modoEdicao === "unico") {
          const { error } = await supabase
            .from("financeiro_transacoes")
            .update({
              ...payloadBase,
              valor: valorTotal,
              data_vencimento: formData.data_vencimento,
            })
            .eq("id", despesaParaEditar.id);

          if (error) throw error;

          // --- CENÁRIO: ATUALIZAR ESTE E FUTUROS ---
        } else if (modoEdicao === "futuros") {
          // 1. Atualiza o atual
          await supabase
            .from("financeiro_transacoes")
            .update({
              ...payloadBase,
              valor: valorTotal,
              data_vencimento: formData.data_vencimento,
            })
            .eq("id", despesaParaEditar.id);

          // 2. Atualiza os próximos da mesma série (pelo recorrencia_id)
          // Nota: Não alteramos a data de vencimento dos próximos para não bagunçar os meses
          const { error } = await supabase
            .from("financeiro_transacoes")
            .update({
              ...payloadBase, // Atualiza desc, categoria, obs, anexos
              valor: valorTotal, // Atualiza valor
            })
            .eq("recorrencia_id", despesaParaEditar.recorrencia_id)
            .gt("data_vencimento", despesaParaEditar.data_vencimento) // Apenas datas futuras
            .neq("status", "pago"); // Opcional: não mexe no que já foi pago

          if (error) throw error;
        }

        alert("Despesa atualizada!");
      } else {
        // --- CRIAÇÃO ---
        let lancamentos = [];
        // Gera um ID para vincular as parcelas
        const recorrenciaId = crypto.randomUUID();

        if (
          formData.parcelamento === "parcelado" &&
          formData.numero_parcelas > 1
        ) {
          const valorParcela = valorTotal / formData.numero_parcelas;
          for (let i = 0; i < formData.numero_parcelas; i++) {
            const dataBase = new Date(formData.data_vencimento);
            dataBase.setMonth(dataBase.getMonth() + i);

            lancamentos.push({
              ...payloadBase,
              recorrencia_id: recorrenciaId, // Vínculo
              descricao: `${formData.descricao} (${i + 1}/${formData.numero_parcelas})`,
              valor: valorParcela,
              data_vencimento: dataBase.toISOString().split("T")[0],
              status: "pendente",
              parcela_atual: i + 1,
              parcelas_total: formData.numero_parcelas,
            });
          }
        } else if (
          formData.parcelamento === "recorrente" &&
          formData.numero_parcelas > 1
        ) {
          for (let i = 0; i < formData.numero_parcelas; i++) {
            const dataBase = new Date(formData.data_vencimento);
            if (formData.frequencia_recorrencia === "semanal")
              dataBase.setDate(dataBase.getDate() + i * 7);
            else if (formData.frequencia_recorrencia === "anual")
              dataBase.setFullYear(dataBase.getFullYear() + i);
            else dataBase.setMonth(dataBase.getMonth() + i);

            lancamentos.push({
              ...payloadBase,
              recorrencia_id: recorrenciaId, // Vínculo
              descricao: `${formData.descricao} (Recorrente ${i + 1}/${formData.numero_parcelas})`,
              valor: valorTotal,
              data_vencimento: dataBase.toISOString().split("T")[0],
              status: "pendente",
              parcela_atual: i + 1,
              parcelas_total: formData.numero_parcelas,
            });
          }
        } else {
          lancamentos.push({
            ...payloadBase,
            valor: valorTotal,
            data_vencimento: formData.data_vencimento,
            parcela_atual: 1,
            parcelas_total: 1,
          });
        }

        const { error } = await supabase
          .from("financeiro_transacoes")
          .insert(lancamentos);
        if (error) throw error;
        alert("Despesa salva!");
      }

      onSuccess();
      onClose();
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
      setShowRecorrenciaOptions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const mascaraMoeda = (valor) => {
    const apenasNumeros = String(valor).replace(/\D/g, "");
    const numero = Number(apenasNumeros) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numero);
  };

  const handleValorChange = (e) => {
    const valorDigitado = e.target.value;
    const valorComMascara = mascaraMoeda(valorDigitado);
    setFormData((prev) => ({ ...prev, valor: valorComMascara }));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-7xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
              {despesaParaEditar ? "Editar Despesa" : "Nova Despesa"}
            </h2>
            <button onClick={onClose}>
              <X size={24} className="text-gray-400 hover:text-red-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            {/* O formulário chama handlePreSubmit para verificar a recorrência antes */}
            <form
              id="form-despesa"
              onSubmit={handlePreSubmit}
              className="space-y-6"
            >
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">
                  Informações do lançamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 relative">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Fornecedor
                    </label>
                    <select
                      name="entidade_id"
                      value={formData.entidade_id}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      <option value="">Selecione...</option>
                      {fornecedores.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowSupplierModal(true)}
                      className="absolute right-0 top-0 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1 mr-1"
                    >
                      <PlusCircle size={12} /> Novo Fornecedor
                    </button>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Data competência
                    </label>
                    <input
                      type="date"
                      name="data_competencia"
                      value={formData.data_competencia}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Descrição *
                    </label>
                    <input
                      type="text"
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Valor (R$) *
                    </label>
                    <input
                      type="text"
                      name="valor"
                      value={formData.valor}
                      onChange={handleValorChange}
                      className="w-full p-2 border rounded-lg text-right font-bold"
                      required
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="md:col-span-4 relative">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Categoria
                    </label>
                    <select
                      name="categoria_id"
                      value={formData.categoria_id}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      <option value="">Selecione...</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="absolute right-0 top-0 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1 mr-1"
                    >
                      <Settings size={12} /> Gerenciar
                    </button>
                  </div>
                  <div className="md:col-span-4">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Centro de custo
                    </label>
                    <select
                      name="centro_custo"
                      value={formData.centro_custo}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      <option value="">Selecione...</option>
                      <option value="administrativo">Administrativo</option>
                      <option value="operacional">Operacional</option>
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Código referência
                    </label>
                    <input
                      type="text"
                      name="codigo_referencia"
                      value={formData.codigo_referencia}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </section>
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                  <h3 className="text-sm font-bold text-gray-800">
                    Condição de pagamento
                  </h3>
                  {formData.parcelamento === "recorrente" && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 rounded-full font-bold flex items-center gap-1">
                      <Repeat size={10} /> Modo Recorrente
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Tipo de Lançamento
                    </label>
                    <select
                      name="parcelamento"
                      value={formData.parcelamento}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg bg-gray-50"
                      disabled={!!despesaParaEditar}
                    >
                      <option value="avista">À vista (Único)</option>
                      <option value="parcelado">
                        Parcelado (Dividir Valor)
                      </option>
                      <option value="recorrente">
                        Recorrente (Repetir Valor)
                      </option>
                    </select>
                  </div>
                  {(formData.parcelamento === "parcelado" ||
                    formData.parcelamento === "recorrente") &&
                    !despesaParaEditar && (
                      <>
                        <div className="md:col-span-1">
                          <label className="text-xs font-bold text-gray-500 mb-1 block">
                            {formData.parcelamento === "recorrente"
                              ? "Repetir por (meses)"
                              : "Nº Parcelas"}
                          </label>
                          <input
                            type="number"
                            name="numero_parcelas"
                            min="2"
                            max="360"
                            value={formData.numero_parcelas}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-white"
                          />
                        </div>
                        {formData.parcelamento === "recorrente" && (
                          <div className="md:col-span-1">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">
                              Frequência
                            </label>
                            <select
                              name="frequencia_recorrencia"
                              value={
                                formData.frequencia_recorrencia || "mensal"
                              }
                              onChange={handleChange}
                              className="w-full p-2 border rounded-lg bg-white"
                            >
                              <option value="mensal">Mensal</option>
                              <option value="semanal">Semanal</option>
                              <option value="anual">Anual</option>
                            </select>
                          </div>
                        )}
                      </>
                    )}

                  <div
                    className={
                      formData.parcelamento === "recorrente" &&
                      !despesaParaEditar
                        ? "md:col-span-1"
                        : "md:col-span-1"
                    }
                  >
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      {formData.parcelamento !== "avista" && !despesaParaEditar
                        ? "1º Vencimento *"
                        : "Vencimento *"}
                    </label>
                    <input
                      type="date"
                      name="data_vencimento"
                      value={formData.data_vencimento}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div className="relative md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Conta de saída
                    </label>
                    <select
                      name="conta_id"
                      value={formData.conta_id}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      <option value="">Selecione...</option>
                      {contas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAccountModal(true)}
                      className="absolute right-0 top-0 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1 mr-1"
                    >
                      <PlusCircle size={12} /> Nova Conta
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Forma de Pagamento
                    </label>
                    <select
                      name="forma_pagamento"
                      value={formData.forma_pagamento}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      <option value="boleto">Boleto</option>
                      <option value="pix">Pix</option>
                      <option value="transferencia">Transferência</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao">Cartão de Crédito</option>
                      <option value="cartao">Cartão de Débito</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-6 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.status === "pago"}
                        disabled={
                          formData.parcelamento !== "avista" &&
                          !despesaParaEditar
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: e.target.checked ? "pago" : "pendente",
                          }))
                        }
                        className="w-4 h-4 accent-green-600"
                      />
                      <span
                        className={`text-sm font-bold ${
                          formData.status === "pago"
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {formData.parcelamento !== "avista" &&
                        !despesaParaEditar
                          ? "Lançar como Pendentes"
                          : "Já está pago?"}
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Seção de Anexos VISUAL (Melhorada) */}
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">
                    Observações
                  </label>
                  <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg h-20 resize-none"
                  />
                </div>

                {formData.anexo_urls.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <label className="text-xs font-bold text-gray-500 block">
                      Arquivos Anexados ({formData.anexo_urls.length})
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {formData.anexo_urls.map((anexo, index) => {
                        const fileUrl =
                          typeof anexo === "string" ? anexo : anexo.url;
                        const fileName =
                          typeof anexo === "string"
                            ? decodeURIComponent(
                                anexo.split("/").pop().split("?")[0],
                              )
                            : anexo.name;

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 border rounded-lg text-xs"
                          >
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:underline truncate max-w-[85%]"
                              title={fileName}
                            >
                              <Paperclip size={14} className="flex-shrink-0" />
                              <span className="truncate">{fileName}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div
                  className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                    uploadingFile ? "opacity-50 pointer-events-none" : ""
                  }`}
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="flex flex-col items-center text-gray-400">
                    {uploadingFile ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        <span className="text-xs font-bold mt-1">
                          Enviando...
                        </span>
                      </>
                    ) : (
                      <>
                        <PlusCircle size={24} className="text-blue-500" />
                        <span className="text-xs font-bold mt-1 text-gray-600">
                          Adicionar Anexos (PDF/Imagem)
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="application/pdf, image/*"
                    multiple
                  />
                </div>
              </section>
            </form>
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-xl">
            <button
              onClick={onClose}
              className="px-6 py-2 border rounded text-gray-600 font-bold text-sm"
            >
              Cancelar
            </button>
            <button
              form="form-despesa"
              disabled={loading || uploadingFile}
              className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2 text-sm shadow-md"
            >
              {loading ? "Salvando..." : "Salvar Despesa"}
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL DE OPÇÕES DE RECORRÊNCIA --- */}
      {showRecorrenciaOptions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 border-t-4 border-orange-500 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-orange-600">
              <AlertTriangle size={28} />
              <h3 className="text-lg font-bold text-gray-800">
                Alterar repetição
              </h3>
            </div>

            <p className="text-gray-600 mb-6 text-sm">
              Este é um lançamento recorrente. Você deseja aplicar as alterações
              apenas neste item ou em todos os futuros?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleSubmit("unico")}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-3 group"
              >
                <div className="w-4 h-4 rounded-full border border-gray-400 group-hover:border-blue-500 group-hover:bg-blue-500"></div>
                <div>
                  <span className="block font-bold text-gray-700 group-hover:text-blue-700">
                    Apenas este lançamento
                  </span>
                  <span className="block text-xs text-gray-500">
                    Outras parcelas não serão afetadas.
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleSubmit("futuros")}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-3 group"
              >
                <div className="w-4 h-4 rounded-full border border-gray-400 group-hover:border-blue-500 group-hover:bg-blue-500"></div>
                <div>
                  <span className="block font-bold text-gray-700 group-hover:text-blue-700">
                    Este e os próximos
                  </span>
                  <span className="block text-xs text-gray-500">
                    Atualiza valor e dados de todos os lançamentos pendentes
                    desta série.
                  </span>
                </div>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRecorrenciaOptions(false)}
                className="text-gray-500 font-bold text-sm hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais Aninhados */}
      {showSupplierModal && (
        <NovoFornecedorModal
          onClose={() => setShowSupplierModal(false)}
          onSuccess={() => fetchData()}
        />
      )}
      {showCategoryModal && (
        <GerenciarCategoriasModal
          onClose={() => setShowCategoryModal(false)}
          onSuccess={() => fetchData()}
        />
      )}
      {showAccountModal && (
        <NovaContaModal
          onClose={() => setShowAccountModal(false)}
          onSuccess={() => fetchData()}
        />
      )}
    </>
  );
}
