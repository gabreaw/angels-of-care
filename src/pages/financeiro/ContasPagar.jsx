import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import NovaDespesaModal from "../../components/financeiro/NovaDespesaModal";

import {
  Plus,
  Search,
  Filter,
  Paperclip,
  Trash2,
  Edit,
  Calendar as CalIcon,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

export default function ContasPagar() {
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState(null);

  const [expandedRows, setExpandedRows] = useState({});

  const [resumo, setResumo] = useState({
    vencidos: 0,
    hoje: 0,
    aVencer: 0,
    pago: 0,
    total: 0,
  });

  useEffect(() => {
    fetchTransacoes();
  }, []);

  async function fetchTransacoes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("financeiro_transacoes")
      .select(`*, financeiro_categorias (nome), financeiro_entidades (nome)`)
      .eq("tipo", "despesa")
      .order("data_vencimento", { ascending: true });

    if (error) console.error(error);
    else {
      setTransacoes(data || []);
      calcularResumo(data || []);
    }
    setLoading(false);
  }

  function calcularResumo(dados) {
    const hoje = new Date().toISOString().split("T")[0];
    let v = 0,
      h = 0,
      av = 0,
      p = 0,
      t = 0;

    dados.forEach((item) => {
      const valor = parseFloat(item.valor);
      t += valor;
      if (item.status === "pago") {
        p += valor;
      } else {
        if (item.data_vencimento < hoje) v += valor;
        else if (item.data_vencimento === hoje) h += valor;
        else av += valor;
      }
    });
    setResumo({ vencidos: v, hoje: h, aVencer: av, pago: p, total: t });
  }

  const handleNovaDespesa = () => {
    setItemParaEditar(null);
    setModalOpen(true);
  };

  const handleEditar = (item, e) => {
    e.stopPropagation();
    setItemParaEditar(item);
    setModalOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Tem certeza que deseja excluir esta conta?")) return;
    const { error } = await supabase
      .from("financeiro_transacoes")
      .delete()
      .eq("id", id);
    if (error) alert("Erro ao excluir: " + error.message);
    else fetchTransacoes();
  };

  const handleToggleStatus = async (item, e) => {
    e.stopPropagation();
    const novoStatus = item.status === "pago" ? "pendente" : "pago";
    const dataPagamento =
      novoStatus === "pago" ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("financeiro_transacoes")
      .update({ status: novoStatus, data_pagamento: dataPagamento })
      .eq("id", item.id);

    if (error) alert("Erro ao atualizar status: " + error.message);
    else fetchTransacoes();
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatMoney = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-gray-700">Contas a Pagar</h2>
        <button
          onClick={handleNovaDespesa}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all text-sm"
        >
          <Plus size={18} /> Nova Despesa
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <SummaryCard
          label="Vencidos"
          value={resumo.vencidos}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <SummaryCard
          label="Vencem Hoje"
          value={resumo.hoje}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <SummaryCard
          label="A Vencer"
          value={resumo.aVencer}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <SummaryCard
          label="Pagos"
          value={resumo.pago}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-center">
          <span className="text-xs text-gray-500 font-bold uppercase mb-1">
            Total do Período
          </span>
          <span className="text-lg font-bold text-gray-800">
            {formatMoney(resumo.total)}
          </span>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-gray-50 rounded-lg flex items-center px-4 border border-gray-200">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="bg-transparent w-full py-2 outline-none text-sm text-gray-700"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
          <CalIcon size={16} /> Este Mês
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
          <Filter size={16} /> Filtros
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-4 w-32">Vencimento</th>
              <th className="p-4 w-32">Pagamento</th>
              <th className="p-4">Descrição / Fornecedor</th>
              <th className="p-4 w-40">Categoria</th>
              <th className="p-4 text-right w-32">Valor</th>
              <th className="p-4 text-center w-32">Situação</th>
              <th className="p-4 text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-400">
                  Carregando...
                </td>
              </tr>
            ) : transacoes.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="p-12 text-center text-gray-400 border-dashed border-2 border-gray-100 rounded-lg"
                >
                  Nenhuma conta encontrada.
                </td>
              </tr>
            ) : (
              transacoes.map((item) => (
                <React.Fragment key={item.id}>
                  <tr
                    onClick={() => toggleRow(item.id)}
                    className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors group cursor-pointer ${
                      expandedRows[item.id] ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <td className="p-4 font-mono text-gray-600 text-xs">
                      {formatDate(item.data_vencimento)}
                      {item.status !== "pago" &&
                        item.data_vencimento <
                          new Date().toISOString().split("T")[0] && (
                          <span
                            className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold"
                            title="Vencido"
                          >
                            !
                          </span>
                        )}
                    </td>
                    <td className="p-4 text-xs">
                      {item.status === "pago" && item.data_pagamento ? (
                        <span className="text-green-600 font-bold">
                          {formatDate(item.data_pagamento.split("T")[0])}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {expandedRows[item.id] ? (
                          <ChevronUp size={14} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={14} className="text-gray-400" />
                        )}
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {item.descricao}
                          </p>
                          {item.financeiro_entidades && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.financeiro_entidades.nome}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {item.financeiro_categorias ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium border border-gray-200">
                          {item.financeiro_categorias.nome}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-700">
                      {formatMoney(item.valor)}
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="p-4">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={(e) => handleToggleStatus(item, e)}
                          className={`p-1.5 rounded-md border transition-all ${
                            item.status === "pago"
                              ? "bg-white text-gray-400 border-gray-200 hover:text-orange-500"
                              : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                          }`}
                          title={item.status === "pago" ? "Reabrir" : "Pagar"}
                        >
                          {item.status === "pago" ? (
                            <XCircle size={16} />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                        </button>
                        <button
                          onClick={(e) => handleEditar(item, e)}
                          className="p-1.5 bg-white border border-gray-200 text-blue-600 rounded-md hover:bg-blue-50 transition-all"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 bg-white border border-gray-200 text-red-500 rounded-md hover:bg-red-50 transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedRows[item.id] && (
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td colSpan="7" className="p-4 px-8">
                        <div className="grid grid-cols-4 gap-6 text-sm">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">
                              Centro de Custo
                            </p>
                            <p className="text-gray-700 capitalize">
                              {item.centro_custo || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">
                              Competência
                            </p>
                            <p className="text-gray-700">
                              {formatDate(item.data_competencia)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">
                              Forma Pagto
                            </p>
                            <p className="text-gray-700 capitalize">
                              {item.forma_pagamento || "-"}
                            </p>
                          </div>
                          <div className="col-span-1">
                            {item.anexo_url ? (
                              <a
                                href={item.anexo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline mt-2"
                              >
                                <Paperclip size={14} /> Ver Comprovante/Anexo
                              </a>
                            ) : (
                              <p className="text-xs text-gray-400 italic mt-2">
                                Sem anexo.
                              </p>
                            )}
                          </div>
                          {item.observacoes && (
                            <div className="col-span-4 mt-2 p-3 bg-white border border-gray-200 rounded-lg">
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                                Observações
                              </p>
                              <p className="text-gray-600 italic">
                                {item.observacoes}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <NovaDespesaModal
          onClose={() => setModalOpen(false)}
          despesaParaEditar={itemParaEditar}
          onSuccess={() => {
            fetchTransacoes();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, bgColor }) {
  const formatMoney = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  return (
    <div
      className={`p-4 rounded-xl border border-gray-100 ${bgColor} flex flex-col justify-center`}
    >
      <span className={`text-xs font-bold uppercase mb-1 opacity-70 ${color}`}>
        {label}
      </span>
      <span className={`text-lg font-bold ${color}`}>{formatMoney(value)}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pago: "bg-green-100 text-green-700 border-green-200",
    pendente: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  const labels = { pago: "Pago", pendente: "Aberto" };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
        styles[status] || styles.pendente
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
