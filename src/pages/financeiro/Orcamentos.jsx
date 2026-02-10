import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Search,
  Printer,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle, // Novo ícone para etapa
} from "lucide-react";
import NovoOrcamentoModal from "../../components/financeiro/NovoOrcamentoModal";
import { gerarPropostaDocx } from "../../utils/gerarPropostaDocx";

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState(null);

  useEffect(() => {
    fetchOrcamentos();
  }, []);

  async function fetchOrcamentos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("financeiro_orcamentos")
      .select(`*, financeiro_entidades (nome)`)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setOrcamentos(data || []);
    setLoading(false);
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este orçamento?"))
      return;
    const { error } = await supabase
      .from("financeiro_orcamentos")
      .delete()
      .eq("id", id);
    if (error) alert("Erro ao excluir");
    else fetchOrcamentos();
  };

  const handleEdit = (item) => {
    setItemParaEditar(item);
    setModalOpen(true);
  };

  const handleNovo = () => {
    setItemParaEditar(null);
    setModalOpen(true);
  };

  const handlePrint = (item) => {
    gerarPropostaDocx(item);
  };

  const getNomeClienteDisplay = (item) => {
    if (item.financeiro_entidades?.nome) {
      return (
        <span className="font-bold text-gray-800">
          {item.financeiro_entidades.nome}
        </span>
      );
    }
    if (item.observacoes && item.observacoes.includes("Cliente Avulso:")) {
      // Ajuste para limpar a tag de etapa se ela vier grudada no nome
      const nomeAvulso = item.observacoes
        .split("Cliente Avulso:")[1]
        ?.split("[")[0] // Para no inicio da tag [ETAPA...
        ?.trim()
        .split("-")[0]; // Remove traços extras

      return (
        <span className="font-bold text-blue-600 flex items-center gap-1">
          {nomeAvulso}{" "}
          <span className="text-[10px] bg-blue-50 px-1 rounded border border-blue-100 font-normal">
            Avulso
          </span>
        </span>
      );
    }
    return (
      <span className="text-gray-400 italic">Cliente não identificado</span>
    );
  };

  // Helper para extrair a etapa da observação
  const getEtapaFunil = (item) => {
    if (item.observacoes && item.observacoes.includes("[ETAPA:")) {
      const match = item.observacoes.match(/\[ETAPA: (.*?)\]/);
      return match ? match[1] : null;
    }
    return null;
  };

  const filtered = orcamentos.filter((item) => {
    const term = searchTerm.toLowerCase();
    const nomeCadastrado = item.financeiro_entidades?.nome?.toLowerCase() || "";
    const descricao = item.descricao?.toLowerCase() || "";
    const obs = item.observacoes?.toLowerCase() || "";

    return (
      descricao.includes(term) ||
      nomeCadastrado.includes(term) ||
      obs.includes(term)
    );
  });

  const getStatusBadge = (item) => {
    // 1. Badge Principal (Status do sistema)
    let badgePrincipal;
    switch (item.status) {
      case "aprovado":
        badgePrincipal = (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold flex items-center gap-1 w-fit">
            <CheckCircle size={12} /> Aprovado
          </span>
        );
        break;
      case "rejeitado":
        badgePrincipal = (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold flex items-center gap-1 w-fit">
            <XCircle size={12} /> Rejeitado
          </span>
        );
        break;
      default:
        badgePrincipal = (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold flex items-center gap-1 w-fit">
            <Clock size={12} /> Pendente
          </span>
        );
    }

    // 2. Badge Secundário (Etapa do Funil)
    const etapa = getEtapaFunil(item);

    return (
      <div className="flex flex-col gap-1 items-center">
        {badgePrincipal}
        {etapa && (
          <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 flex items-center gap-1">
            <MessageCircle size={10} className="text-orange-400" /> {etapa}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-700">Orçamentos Emitidos</h2>
        <button
          onClick={handleNovo}
          className="bg-primary hover:bg-[#3A4A3E] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all text-sm"
        >
          <Plus size={18} /> Novo Orçamento
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-gray-50 rounded-lg flex items-center px-4 border border-gray-200 focus-within:border-primary transition-colors">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Pesquisar por cliente ou descrição..."
            className="bg-transparent w-full py-2 outline-none text-sm text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Nº Proposta</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Emissão</th>
              <th className="p-4 text-center">Status / Etapa</th>{" "}
              {/* Cabeçalho ajustado */}
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">
                  Nenhum orçamento encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-mono font-bold text-primary">
                    {item.numero_orcamento || "---"}
                  </td>

                  <td className="p-4">{getNomeClienteDisplay(item)}</td>

                  <td className="p-4 text-gray-600">
                    {new Date(item.data_emissao).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </td>

                  {/* Célula de Status Ajustada */}
                  <td className="p-4">{getStatusBadge(item)}</td>

                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handlePrint(item)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Baixar Proposta (Word)"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-blue-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <NovoOrcamentoModal
          onClose={() => setModalOpen(false)}
          orcamentoParaEditar={itemParaEditar}
          onSuccess={() => fetchOrcamentos()}
        />
      )}
    </div>
  );
}
