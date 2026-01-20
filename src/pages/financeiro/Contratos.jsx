import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react";
import NovoContratoModal from "../../components/financeiro/NovoContratoModal";

export default function Contratos() {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState(null);

  useEffect(() => {
    fetchContratos();
  }, []);

  async function fetchContratos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("financeiro_contratos")
      .select(`*, financeiro_entidades (nome)`)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setContratos(data || []);
    setLoading(false);
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este contrato?"))
      return;
    const { error } = await supabase
      .from("financeiro_contratos")
      .delete()
      .eq("id", id);
    if (error) alert("Erro ao excluir");
    else fetchContratos();
  };

  const handleEdit = (item) => {
    setItemParaEditar(item);
    setModalOpen(true);
  };

  const handleNovo = () => {
    setItemParaEditar(null);
    setModalOpen(true);
  };

  const filtered = contratos.filter(
    (item) =>
      item.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.financeiro_entidades?.nome
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const formatMoney = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  const getStatusBadge = (status, dataFim) => {
    const hoje = new Date();
    const fim = dataFim ? new Date(dataFim) : null;

    // Lógica automática: Se a data passou e estava ativo, marca visualmente como expirado
    if (status === "ativo" && fim && fim < hoje) {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold border border-orange-200 flex items-center gap-1 w-fit">
          <AlertCircle size={12} /> Vencido
        </span>
      );
    }

    switch (status) {
      case "ativo":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200 flex items-center gap-1 w-fit">
            <CheckCircle size={12} /> Vigente
          </span>
        );
      case "cancelado":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200 flex items-center gap-1 w-fit">
            <XCircle size={12} /> Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold border border-gray-200 flex items-center gap-1 w-fit">
            <FileText size={12} /> Encerrado
          </span>
        );
    }
  };

  return (
    <div className="p-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-700">
            Gestão de Contratos
          </h2>
          <p className="text-sm text-gray-500">
            Controle de vigência e documentos assinados.
          </p>
        </div>
        <button
          onClick={handleNovo}
          className="bg-primary hover:bg-[#3A4A3E] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all text-sm"
        >
          <Plus size={18} /> Novo Contrato
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-gray-50 rounded-lg flex items-center px-4 border border-gray-200 focus-within:border-primary transition-colors">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Pesquisar contrato..."
            className="bg-transparent w-full py-2 outline-none text-sm text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="col-span-3 text-center text-gray-400 py-10">
            Carregando contratos...
          </p>
        ) : filtered.length === 0 ? (
          <p className="col-span-3 text-center text-gray-400 py-10">
            Nenhum contrato encontrado.
          </p>
        ) : (
          filtered.map((contrato) => (
            <div
              key={contrato.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all relative group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${contrato.tipo === "cliente" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}
                  >
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">
                      {contrato.titulo}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {contrato.financeiro_entidades?.nome}
                    </p>
                  </div>
                </div>
                {getStatusBadge(contrato.status, contrato.data_fim)}
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs text-gray-600 border-b border-dashed pb-2">
                  <span>Valor Mensal:</span>
                  <span className="font-bold text-gray-800">
                    {formatMoney(contrato.valor_mensal)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> Início:
                  </span>
                  <span>
                    {new Date(contrato.data_inicio).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> Fim:
                  </span>
                  <span>
                    {contrato.data_fim
                      ? new Date(contrato.data_fim).toLocaleDateString("pt-BR")
                      : "Indeterminado"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-50">
                {contrato.arquivo_url && (
                  <a
                    href={contrato.arquivo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-primary p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Ver PDF"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  onClick={() => handleEdit(contrato)}
                  className="text-gray-400 hover:text-blue-500 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(contrato.id)}
                  className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <NovoContratoModal
          onClose={() => setModalOpen(false)}
          contratoParaEditar={itemParaEditar}
          onSuccess={() => fetchContratos()}
        />
      )}
    </div>
  );
}
