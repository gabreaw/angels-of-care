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
} from "lucide-react";

export default function NovoOrcamentoModal({
  onClose,
  onSuccess,
  orcamentoParaEditar,
}) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);

  const [valores, setValores] = useState({
    tec12: 290.0,
    cuid12: 275.0,
    tec24: 560.0,
    cuid24: 550.0,
  });

  const [formData, setFormData] = useState({
    entidade_id: "",
    data_emissao: new Date().toISOString().split("T")[0],
    validade_dias: 5,
    previsao_inicio: "",
    numero_orcamento: "",
    status: "pendente",
  });

  useEffect(() => {
    fetchClientes();

    if (orcamentoParaEditar) {
      const buscarValor = (nome) => {
        const item = orcamentoParaEditar.itens?.find(
          (i) => i.descricao === nome,
        );
        return item ? item.valor : 0;
      };

      setFormData({
        entidade_id: orcamentoParaEditar.entidade_id || "",
        data_emissao: orcamentoParaEditar.data_emissao
          ? orcamentoParaEditar.data_emissao.split("T")[0]
          : "",
        validade_dias: orcamentoParaEditar.validade_dias || 5,
        previsao_inicio: orcamentoParaEditar.previsao_inicio || "",
        numero_orcamento: orcamentoParaEditar.numero_orcamento || "---",
        status: orcamentoParaEditar.status || "pendente",
      });

      if (orcamentoParaEditar.itens && orcamentoParaEditar.itens.length > 0) {
        setValores({
          tec12: buscarValor("Diária Técnica 12h") || 290,
          cuid12: buscarValor("Diária Cuidadora 12h") || 275,
          tec24: buscarValor("Diária Técnica 24h") || 560,
          cuid24: buscarValor("Diária Cuidadora 24h") || 550,
        });
      }
    } else {
      gerarNumeroOrcamento();
    }
  }, [orcamentoParaEditar]);

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
          if (!isNaN(numero) && numero > maiorNumero) {
            maiorNumero = numero;
          }
        }
      });
    }

    // O próximo é o maior encontrado + 1 (Se o maior for 26, gera 27)
    const proximo = maiorNumero + 1;
    setFormData((prev) => ({
      ...prev,
      numero_orcamento: `${proximo}/${anoAtual}`,
    }));
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleValorChange = (e) => {
    setValores({
      ...valores,
      [e.target.name]: parseFloat(e.target.value) || 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const itensEstruturados = [
      {
        id: crypto.randomUUID(),
        descricao: "Diária Técnica 12h",
        qtd: 1,
        valor: valores.tec12,
        total: valores.tec12,
      },
      {
        id: crypto.randomUUID(),
        descricao: "Diária Cuidadora 12h",
        qtd: 1,
        valor: valores.cuid12,
        total: valores.cuid12,
      },
      {
        id: crypto.randomUUID(),
        descricao: "Diária Técnica 24h",
        qtd: 1,
        valor: valores.tec24,
        total: valores.tec24,
      },
      {
        id: crypto.randomUUID(),
        descricao: "Diária Cuidadora 24h",
        qtd: 1,
        valor: valores.cuid24,
        total: valores.cuid24,
      },
    ];

    const payload = {
      entidade_id: formData.entidade_id || null,
      data_emissao: formData.data_emissao,
      descricao: `Proposta Comercial ${formData.numero_orcamento}`,
      status: formData.status,
      numero_orcamento: formData.numero_orcamento,
      validade_dias: formData.validade_dias,
      previsao_inicio: formData.previsao_inicio || null,
      itens: itensEstruturados,
      valor_total: 0,
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
            {orcamentoParaEditar
              ? `Editar Proposta ${formData.numero_orcamento}`
              : `Nova Proposta ${formData.numero_orcamento}`}
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Cliente
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                  <select
                    name="entidade_id"
                    value={formData.entidade_id}
                    onChange={handleChange}
                    className="w-full pl-10 p-2 border rounded-lg bg-white h-10 outline-none focus:border-primary"
                    required
                  >
                    <option value="">Selecione o Cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  Número (Automático)
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

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase flex items-center gap-2">
                <DollarSign size={16} /> Valores das Diárias
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    <h4 className="font-bold text-gray-800 text-sm">
                      Plantão 12 Horas
                    </h4>
                  </div>
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
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <h4 className="font-bold text-gray-800 text-sm">
                      Plantão 24 Horas
                    </h4>
                  </div>
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
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded font-bold hover:bg-[#3A4A3E] flex items-center gap-2 text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar Proposta"} <Save size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
