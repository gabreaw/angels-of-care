import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  X,
  Save,
  Calculator,
  User,
  Calendar,
  DollarSign,
  Clock,
  MessageCircle,
  CheckCircle, // Icone para status
} from "lucide-react";

export default function NovoOrcamentoModal({
  onClose,
  onSuccess,
  orcamentoParaEditar,
}) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);

  const [clienteInput, setClienteInput] = useState("");
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState(null);

  const [incluirTecnica, setIncluirTecnica] = useState(true);
  const [incluirCuidadora, setIncluirCuidadora] = useState(true);

  const [etapaContato, setEtapaContato] = useState("1º Contato");

  const [valores, setValores] = useState({
    tec12: 290.0,
    cuid12: 275.0,
    tec24: 560.0,
    cuid24: 550.0,
  });

  const [formData, setFormData] = useState({
    data_emissao: new Date().toISOString().split("T")[0],
    validade_dias: 5,
    previsao_inicio: "",
    numero_orcamento: "",
    status: "pendente", // Status oficial do sistema
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  // LÓGICA INTELIGENTE: Atualiza o status baseado na etapa escolhida
  const handleEtapaChange = (novaEtapa) => {
    setEtapaContato(novaEtapa);

    // Se marcou Fechado ou Assinatura, já muda para Aprovado automaticamente
    if (novaEtapa === "Fechado" || novaEtapa === "Aguardando Assinatura") {
      setFormData((prev) => ({ ...prev, status: "aprovado" }));
    } else {
      // Se voltou para negociação, volta para pendente (opcional)
      setFormData((prev) => ({ ...prev, status: "pendente" }));
    }
  };

  useEffect(() => {
    if (orcamentoParaEditar) {
      const buscarValor = (nome) => {
        const item = orcamentoParaEditar.itens?.find((i) =>
          i.descricao.includes(nome),
        );
        return item ? item.valor : 0;
      };

      setFormData({
        data_emissao: orcamentoParaEditar.data_emissao
          ? orcamentoParaEditar.data_emissao.split("T")[0]
          : "",
        validade_dias: orcamentoParaEditar.validade_dias || 5,
        previsao_inicio: orcamentoParaEditar.previsao_inicio || "",
        numero_orcamento: orcamentoParaEditar.numero_orcamento || "---",
        status: orcamentoParaEditar.status || "pendente",
      });

      if (orcamentoParaEditar.entidade_id) {
        setClienteSelecionadoId(orcamentoParaEditar.entidade_id);
        const cli = clientes.find(
          (c) => c.id === orcamentoParaEditar.entidade_id,
        );
        if (cli) setClienteInput(cli.nome);
        else if (orcamentoParaEditar.financeiro_entidades?.nome)
          setClienteInput(orcamentoParaEditar.financeiro_entidades.nome);
      } else if (
        orcamentoParaEditar.observacoes &&
        orcamentoParaEditar.observacoes.includes("Cliente Avulso:")
      ) {
        const nomeAvulso = orcamentoParaEditar.observacoes
          .split("Cliente Avulso:")[1]
          ?.split("[")[0]
          ?.trim();
        setClienteInput(nomeAvulso || "");
        setClienteSelecionadoId(null);
      }

      // Recuperar Etapa
      if (
        orcamentoParaEditar.observacoes &&
        orcamentoParaEditar.observacoes.includes("[ETAPA:")
      ) {
        const match = orcamentoParaEditar.observacoes.match(/\[ETAPA: (.*?)\]/);
        if (match && match[1]) {
          setEtapaContato(match[1]);
        }
      }

      if (orcamentoParaEditar.itens && orcamentoParaEditar.itens.length > 0) {
        const temTecnica = orcamentoParaEditar.itens.some((i) =>
          i.descricao.includes("Técnica"),
        );
        const temCuidadora = orcamentoParaEditar.itens.some((i) =>
          i.descricao.includes("Cuidadora"),
        );
        setIncluirTecnica(temTecnica);
        setIncluirCuidadora(temCuidadora);
      }

      setValores({
        tec12: buscarValor("Técnica 12h") || 290,
        cuid12: buscarValor("Cuidadora 12h") || 275,
        tec24: buscarValor("Técnica 24h") || 560,
        cuid24: buscarValor("Cuidadora 24h") || 550,
      });
    } else {
      gerarNumeroOrcamento();
    }
  }, [orcamentoParaEditar, clientes]);

  async function fetchClientes() {
    const { data } = await supabase
      .from("financeiro_entidades")
      .select("*")
      .order("nome");
    setClientes(data || []);
  }

  async function gerarNumeroOrcamento() {
    const anoAtual = new Date().getFullYear();
    const NUMERO_INICIAL = 26;
    const { data } = await supabase
      .from("financeiro_orcamentos")
      .select("numero_orcamento")
      .ilike("numero_orcamento", `%/${anoAtual}`);
    let maiorNumero = NUMERO_INICIAL;
    if (data && data.length > 0) {
      data.forEach((orc) => {
        if (orc.numero_orcamento) {
          const numero = parseInt(orc.numero_orcamento.split("/")[0]);
          if (!isNaN(numero) && numero > maiorNumero) maiorNumero = numero;
        }
      });
    }
    setFormData((prev) => ({
      ...prev,
      numero_orcamento: `${maiorNumero + 1}/${anoAtual}`,
    }));
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClienteChange = (e) => {
    const val = e.target.value;
    setClienteInput(val);
    const found = clientes.find(
      (c) => c.nome.toLowerCase() === val.toLowerCase(),
    );
    if (found) setClienteSelecionadoId(found.id);
    else setClienteSelecionadoId(null);
  };

  const handleValorChange = (e) => {
    setValores({
      ...valores,
      [e.target.name]: parseFloat(e.target.value) || 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!incluirTecnica && !incluirCuidadora)
      return alert("Selecione ao menos um serviço.");
    if (!clienteInput) return alert("Informe o nome do cliente.");

    setLoading(true);

    const itensEstruturados = [];
    if (incluirTecnica) {
      itensEstruturados.push({
        id: crypto.randomUUID(),
        descricao: "Diária Técnica 12h",
        qtd: 1,
        valor: valores.tec12,
        total: valores.tec12,
      });
      itensEstruturados.push({
        id: crypto.randomUUID(),
        descricao: "Diária Técnica 24h",
        qtd: 1,
        valor: valores.tec24,
        total: valores.tec24,
      });
    }
    if (incluirCuidadora) {
      itensEstruturados.push({
        id: crypto.randomUUID(),
        descricao: "Diária Cuidadora 12h",
        qtd: 1,
        valor: valores.cuid12,
        total: valores.cuid12,
      });
      itensEstruturados.push({
        id: crypto.randomUUID(),
        descricao: "Diária Cuidadora 24h",
        qtd: 1,
        valor: valores.cuid24,
        total: valores.cuid24,
      });
    }

    let templateName = "proposta_v6";
    if (incluirTecnica && !incluirCuidadora) templateName = "proposta_v6_tec";
    else if (!incluirTecnica && incluirCuidadora)
      templateName = "proposta_v6_cuid";

    let obsFinal = "";
    if (!clienteSelecionadoId) obsFinal += `Cliente Avulso: ${clienteInput} `;
    obsFinal += `[ETAPA: ${etapaContato}]`;

    if (orcamentoParaEditar?.observacoes) {
      const obsLimpa = orcamentoParaEditar.observacoes
        .replace(/Cliente Avulso:.*?(?=\[|$)/, "")
        .replace(/\[ETAPA:.*?\]/, "")
        .trim();
      if (obsLimpa) obsFinal += ` - ${obsLimpa}`;
    }

    const payload = {
      entidade_id: clienteSelecionadoId || null,
      data_emissao: formData.data_emissao,
      descricao: `Proposta Comercial ${formData.numero_orcamento} - ${clienteInput}`,
      status: formData.status, // Agora o status estará correto (aprovado se fechado)
      numero_orcamento: formData.numero_orcamento,
      validade_dias: formData.validade_dias,
      previsao_inicio: formData.previsao_inicio || null,
      itens: itensEstruturados,
      valor_total: 0,
      template: templateName,
      observacoes: obsFinal,
    };

    try {
      if (orcamentoParaEditar) {
        const { error } = await supabase
          .from("financeiro_orcamentos")
          .update(payload)
          .eq("id", orcamentoParaEditar.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("financeiro_orcamentos")
          .insert([payload]);
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calculator size={24} className="text-primary" />
            {orcamentoParaEditar ? "Editar Proposta" : "Nova Proposta"}{" "}
            {formData.numero_orcamento}
          </h2>
          <button onClick={onClose}>
            <X size={24} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form
            id="form-orcamento"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* ETAPA DO FUNIL E STATUS */}
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex-1">
                <label className="text-xs font-bold text-orange-700 uppercase mb-2 flex items-center gap-2">
                  <MessageCircle size={14} /> Status do Contato
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "1º Contato",
                    "2º Contato",
                    "Em Negociação",
                    "Aguardando Assinatura",
                    "Fechado",
                  ].map((etapa) => (
                    <button
                      key={etapa}
                      type="button"
                      onClick={() => handleEtapaChange(etapa)} // Usando a nova função
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        etapaContato === etapa
                          ? "bg-orange-500 text-white border-orange-600 shadow-md transform scale-105"
                          : "bg-white text-gray-600 border-orange-200 hover:bg-orange-100"
                      }`}
                    >
                      {etapa}
                    </button>
                  ))}
                </div>
              </div>

              {/* SELETOR MANUAL DE STATUS (Para controle total) */}
              <div className="min-w-[150px]">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                  <CheckCircle size={14} /> Situação Oficial
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full p-2 rounded-lg border text-sm font-bold outline-none ${
                    formData.status === "aprovado"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : formData.status === "rejeitado"
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                  }`}
                >
                  <option value="pendente">Pendente</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="rejeitado">Rejeitado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* CLIENTE */}
              <div className="md:col-span-6">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Cliente (Selecione ou Digite)
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                  <input
                    list="clientes-list"
                    className="w-full pl-10 p-2 border rounded-lg bg-white h-10 outline-none focus:border-primary placeholder:text-sm"
                    placeholder="Selecione ou digite o nome..."
                    value={clienteInput}
                    onChange={handleClienteChange}
                    required
                  />
                  <datalist id="clientes-list">
                    {clientes.map((c) => (
                      <option key={c.id} value={c.nome} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* DATA EMISSÃO */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Data Emissão
                </label>
                <input
                  type="date"
                  name="data_emissao"
                  value={formData.data_emissao}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg h-10 outline-none focus:border-primary"
                />
              </div>

              {/* VALIDADE */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Validade (Dias)
                </label>
                <div className="relative">
                  <Clock
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                  <input
                    type="number"
                    name="validade_dias"
                    value={formData.validade_dias}
                    onChange={handleChange}
                    className="w-full pl-10 p-2 border rounded-lg h-10 outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-blue-700 uppercase mb-1 block">
                  Previsão de Início
                </label>
                <input
                  type="date"
                  name="previsao_inicio"
                  value={formData.previsao_inicio}
                  onChange={handleChange}
                  className="w-full p-2 border border-blue-200 rounded-lg h-10 outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-blue-700 uppercase mb-1 block">
                  Número
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.numero_orcamento}
                  className="w-full p-2 bg-blue-100 border border-blue-200 rounded-lg h-10 text-blue-800 font-bold"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* SELEÇÃO DE SERVIÇOS */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                Tipos de Serviço (Define o Template)
              </label>
              <div className="flex gap-4">
                <label
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${incluirTecnica ? "bg-orange-50 border-orange-200 ring-1 ring-orange-100" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={incluirTecnica}
                    onChange={(e) => setIncluirTecnica(e.target.checked)}
                    className="w-4 h-4 accent-orange-600"
                  />
                  <span
                    className={`text-sm font-bold ${incluirTecnica ? "text-orange-700" : "text-gray-600"}`}
                  >
                    Técnica de Enfermagem
                  </span>
                </label>
                <label
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${incluirCuidadora ? "bg-purple-50 border-purple-200 ring-1 ring-purple-100" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={incluirCuidadora}
                    onChange={(e) => setIncluirCuidadora(e.target.checked)}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <span
                    className={`text-sm font-bold ${incluirCuidadora ? "text-purple-700" : "text-gray-600"}`}
                  >
                    Cuidadora
                  </span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 transition-all">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase flex items-center gap-2">
                <DollarSign size={16} /> Valores das Diárias
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 12 HORAS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <h4 className="font-bold text-gray-800 text-sm">
                      Plantão 12 Horas
                    </h4>
                  </div>
                  {incluirTecnica && (
                    <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                      <span className="text-xs font-bold text-gray-500">
                        Técnica Enf.
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          name="tec12"
                          value={valores.tec12}
                          onChange={handleValorChange}
                          className="w-24 text-right font-bold text-gray-700 outline-none border-b border-transparent focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                  {incluirCuidadora && (
                    <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                      <span className="text-xs font-bold text-gray-500">
                        Cuidadora
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          name="cuid12"
                          value={valores.cuid12}
                          onChange={handleValorChange}
                          className="w-24 text-right font-bold text-gray-700 outline-none border-b border-transparent focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {/* 24 HORAS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <h4 className="font-bold text-gray-800 text-sm">
                      Plantão 24 Horas
                    </h4>
                  </div>
                  {incluirTecnica && (
                    <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                      <span className="text-xs font-bold text-gray-500">
                        Técnica Enf.
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          name="tec24"
                          value={valores.tec24}
                          onChange={handleValorChange}
                          className="w-24 text-right font-bold text-gray-700 outline-none border-b border-transparent focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                  {incluirCuidadora && (
                    <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                      <span className="text-xs font-bold text-gray-500">
                        Cuidadora
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          name="cuid24"
                          value={valores.cuid24}
                          onChange={handleValorChange}
                          className="w-24 text-right font-bold text-gray-700 outline-none border-b border-transparent focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded text-gray-600 font-bold text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            form="form-orcamento"
            disabled={loading || (!incluirTecnica && !incluirCuidadora)}
            className="px-6 py-2 bg-primary text-white rounded font-bold hover:bg-[#3A4A3E] flex items-center gap-2 text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Salvar Proposta"} <Save size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
