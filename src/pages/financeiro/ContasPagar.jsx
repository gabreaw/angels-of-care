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
} from "lucide-react";

export default function ContasPagar() {
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

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
      .select(
        `
        *,
        financeiro_categorias (nome)
      `
      )
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

  const formatMoney = (val) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-gray-700">Contas a Pagar</h2>
        <button
          onClick={() => setModalOpen(true)}
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
            placeholder="Pesquisar descrição..."
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

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <th className="p-4">Vencimento</th>
              <th className="p-4">Pagamento</th>
              <th className="p-4 w-1/3">Descrição</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4 text-center">Situação</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-400">
                  Carregando...
                </td>
              </tr>
            ) : transacoes.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="p-8 text-center text-gray-400 border-dashed border-2 border-gray-100 rounded-lg"
                >
                  Nenhuma conta a pagar encontrada.
                </td>
              </tr>
            ) : (
              transacoes.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors group"
                >
                  <td className="p-4 font-mono text-gray-600">
                    {formatDate(item.data_vencimento)}
                    {item.status !== "pago" &&
                      item.data_vencimento <
                        new Date().toISOString().split("T")[0] && (
                        <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">
                          !
                        </span>
                      )}
                  </td>
                  <td className="p-4 text-gray-500">
                    {item.data_pagamento
                      ? formatDate(item.data_pagamento)
                      : "-"}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{item.descricao}</p>
                    <p className="text-xs text-gray-400">
                      {item.financeiro_categorias?.nome}
                    </p>
                  </td>
                  <td className="p-4 text-right font-medium text-gray-700">
                    {formatMoney(item.valor)}
                  </td>
                  <td className="p-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md transition-colors">
                      <Edit size={16} />
                    </button>
                    <button className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors">
                      <Trash2 size={16} />
                    </button>
                    {item.anexo_url && (
                      <button className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-md">
                        <Paperclip size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <NovaDespesaModal
          onClose={() => setModalOpen(false)}
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
    atrasado: "bg-red-100 text-red-700 border-red-200",
  };
  const labels = {
    pago: "Pago",
    pendente: "Em Aberto",
    atrasado: "Vencido",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
        styles[status] || styles.pendente
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
