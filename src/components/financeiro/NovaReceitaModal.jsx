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
  TrendingUp, // Icone diferente para receita
} from "lucide-react";
import NovoFornecedorModal from "./NovoFornecedorModal"; // Usamos o mesmo para criar Clientes
import GerenciarCategoriasModal from "./GerenciarCategoriasModal";
import NovaContaModal from "./NovaContaModal";

export default function NovaReceitaModal({
  onClose,
  onSuccess,
  receitaParaEditar = null,
}) {
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Modais auxiliares
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const fileInputRef = useRef(null);

  const [clientes, setClientes] = useState([]);
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
    anexo_urls: [],
  });

  useEffect(() => {
    fetchData();

    if (receitaParaEditar) {
      let existingUrls = [];
      try {
        if (receitaParaEditar.anexo_url) {
          if (receitaParaEditar.anexo_url.trim().startsWith("[")) {
            existingUrls = JSON.parse(receitaParaEditar.anexo_url);
          } else {
            existingUrls = [receitaParaEditar.anexo_url];
          }
        }
      } catch (e) {
        existingUrls = receitaParaEditar.anexo_url
          ? [receitaParaEditar.anexo_url]
          : [];
      }

      setFormData({
        entidade_id: receitaParaEditar.entidade_id || "",
        data_competencia:
          receitaParaEditar.created_at?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        descricao: receitaParaEditar.descricao,
        valor: formatCurrencyInput(receitaParaEditar.valor),
        categoria_id: receitaParaEditar.categoria_id || "",
        centro_custo: receitaParaEditar.centro_custo || "",
        codigo_referencia: receitaParaEditar.codigo_referencia || "",
        parcelamento: "avista", 
        numero_parcelas: 1,
        frequencia_recorrencia: "mensal",
        data_vencimento: receitaParaEditar.data_vencimento,
        forma_pagamento: receitaParaEditar.forma_pagamento || "boleto",
        conta_id: receitaParaEditar.conta_id || "",
        status: receitaParaEditar.status,
        observacoes: receitaParaEditar.observacoes || "",
        anexo_urls: existingUrls,
      });
    }
  }, [receitaParaEditar]);

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
        .eq("tipo", "receita")
        .order("nome"),
      supabase.from("financeiro_contas").select("*").order("nome"),
    ]);
    setClientes(entRes.data || []);
    setCategorias(catRes.data || []);
    setContas(accRes.data || []);
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFile(true);
    const newUrls = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `receitas/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("financeiro")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("financeiro")
          .getPublicUrl(fileName);
        newUrls.push(data.publicUrl);
      }

      setFormData((prev) => ({
        ...prev,
        anexo_urls: [...prev.anexo_urls, ...newUrls],
      }));
    } catch (error) {
      alert("Erro ao enviar: " + error.message);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      anexo_urls: prev.anexo_urls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const valorTotal = formData.valor
      ? parseFloat(
          String(formData.valor)
            .replace(/[^\d,]/g, "")
            .replace(",", ".")
        )
      : 0;

    const payloadBase = {
      tipo: "receita",
      descricao: formData.descricao,
      status: formData.status,
      categoria_id: formData.categoria_id || null,
      entidade_id: formData.entidade_id || null,
      conta_id: formData.conta_id || null,
      centro_custo: formData.centro_custo,
      forma_pagamento: formData.forma_pagamento,
      data_pagamento: formData.status === "pago" ? new Date() : null,
      observacoes: formData.observacoes,
      anexo_url: JSON.stringify(formData.anexo_urls),
    };

    try {
      if (receitaParaEditar) {
        const { error } = await supabase
          .from("financeiro_transacoes")
          .update({
            ...payloadBase,
            valor: valorTotal,
            data_vencimento: formData.data_vencimento,
          })
          .eq("id", receitaParaEditar.id);
        if (error) throw error;
        alert("Receita atualizada!");
      } else {
        let lancamentos = [];

        // Lógica de Parcelamento/Recorrência (Idêntica ao Despesa)
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
              descricao: `${formData.descricao} (${i + 1}/${
                formData.numero_parcelas
              })`,
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
              descricao: `${formData.descricao} (Recorrente ${i + 1}/${
                formData.numero_parcelas
              })`,
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
        alert("Receita salva!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleValorChange = (e) => {
    const valorDigitado = e.target.value;
    const apenasNumeros = String(valorDigitado).replace(/\D/g, "");
    const numero = Number(apenasNumeros) / 100;
    const valorFormatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numero);
    setFormData((prev) => ({ ...prev, valor: valorFormatado }));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-7xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-green-50 rounded-t-xl">
            <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">
              <TrendingUp size={24} />{" "}
              {receitaParaEditar ? "Editar Receita" : "Nova Receita"}
            </h2>
            <button onClick={onClose}>
              <X size={24} className="text-green-700 hover:text-green-900" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            <form
              id="form-receita"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 relative">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Cliente
                    </label>
                    <select
                      name="entidade_id"
                      value={formData.entidade_id}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      <option value="">Selecione...</option>
                      {clientes.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowClientModal(true)}
                      className="absolute right-0 top-0 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1 mr-1"
                    >
                      <PlusCircle size={12} /> Novo Cliente
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
                      className="w-full p-2 border rounded-lg text-right font-bold text-green-700"
                      required
                      placeholder="R$ 0,00"
                    />
                  </div>

                  <div className="md:col-span-4 relative">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Categoria (Receita)
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
                    {/* Nota: GerenciarCategoriasModal precisaria de um prop 'tipo' para ser perfeito, mas aqui abre o padrao */}
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
                    Condição de Recebimento
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
                      Tipo
                    </label>
                    <select
                      name="parcelamento"
                      value={formData.parcelamento}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg bg-gray-50"
                      disabled={!!receitaParaEditar}
                    >
                      <option value="avista">À vista (Único)</option>
                      <option value="parcelado">Parcelado</option>
                      <option value="recorrente">Recorrente</option>
                    </select>
                  </div>

                  {(formData.parcelamento === "parcelado" ||
                    formData.parcelamento === "recorrente") &&
                    !receitaParaEditar && (
                      <>
                        <div className="md:col-span-1">
                          <label className="text-xs font-bold text-gray-500 mb-1 block">
                            {formData.parcelamento === "recorrente"
                              ? "Repetir por"
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
                              value={formData.frequencia_recorrencia}
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

                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Vencimento *
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
                      Conta de entrada
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
                      Forma de Recebimento
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
                    </select>
                  </div>

                  <div className="flex items-center pt-6 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.status === "pago"}
                        disabled={
                          formData.parcelamento !== "avista" &&
                          !receitaParaEditar
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
                        !receitaParaEditar
                          ? "Lançar como Pendentes"
                          : "Já está recebido?"}
                      </span>
                    </label>
                  </div>
                </div>
              </section>

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
                      {formData.anexo_urls.map((url, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 border rounded-lg text-xs"
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline truncate"
                          >
                            <Paperclip size={14} /> Anexo {index + 1}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
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
                        <PlusCircle size={24} className="text-green-500" />
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
              form="form-receita"
              disabled={loading || uploadingFile}
              className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2 text-sm shadow-md"
            >
              {loading ? "Salvando..." : "Salvar Receita"}
            </button>
          </div>
        </div>
      </div>

      {showClientModal && (
        <NovoFornecedorModal
          onClose={() => setShowClientModal(false)}
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
