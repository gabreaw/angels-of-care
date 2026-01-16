import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  X,
  Search,
  Plus,
  Edit,
  Trash2,
  Wallet,
  CreditCard,
  Banknote,
  Loader2,
} from "lucide-react";
import NovaContaModal from "./NovaContaModal";

export default function ListaContasModal({ onClose }) {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [contaParaEditar, setContaParaEditar] = useState(null);

  useEffect(() => {
    fetchContas();
  }, []);

  async function fetchContas() {
    setLoading(true);
    const { data, error } = await supabase
      .from("financeiro_contas")
      .select("*")
      .order("nome");

    if (error) console.error(error);
    else setContas(data || []);
    setLoading(false);
  }

  const filtered = contas.filter((c) =>
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNovo = () => {
    setContaParaEditar(null);
    setShowForm(true);
  };

  const handleEditar = (conta) => {
    setContaParaEditar(conta);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Tem certeza? Transações vinculadas a esta conta podem ficar sem referência."
      )
    )
      return;

    const { error } = await supabase
      .from("financeiro_contas")
      .delete()
      .eq("id", id);
    if (error) alert("Erro ao excluir: " + error.message);
    else fetchContas();
  };

  const handleSuccessForm = () => {
    fetchContas();
    setShowForm(false);
  };

  const getIcon = (tipo) => {
    switch (tipo) {
      case "cartao_credito":
        return <CreditCard size={18} className="text-orange-500" />;
      case "caixa":
        return <Banknote size={18} className="text-green-500" />;
      default:
        return <Wallet size={18} className="text-blue-500" />;
    }
  };

  if (showForm) {
    return (
      <NovaContaModal
        onClose={() => setShowForm(false)}
        onSuccess={handleSuccessForm}
        contaParaEditar={contaParaEditar}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Gerenciar Contas
            </h2>
            <p className="text-sm text-gray-500">Contas bancárias e caixas</p>
          </div>
          <button onClick={onClose}>
            <X size={24} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex gap-3">
          <div className="flex-1 bg-white border border-gray-200 rounded-lg flex items-center px-3">
            <Search size={18} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar conta..."
              className="w-full py-2 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleNovo}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus size={18} /> Nova
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              Nenhuma conta encontrada.
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-50 rounded-full border border-gray-200">
                      {getIcon(item.tipo)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{item.nome}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                          {item.tipo.replace("_", " ")}
                        </span>
                        <span className="text-xs text-gray-400">
                          Saldo Inicial: R${" "}
                          {new Intl.NumberFormat("pt-BR", {
                            minimumFractionDigits: 2,
                          }).format(item.saldo_inicial)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditar(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
