import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { X, Trash2, Plus, Save, Loader2 } from "lucide-react";

export default function GerenciarCategoriasModal({ onClose, onSuccess }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for new category
  const [novaCategoria, setNovaCategoria] = useState({
    nome: "",
    grupo: "", // Optional group field
    tipo: "despesa", // Default to 'despesa' as requested context implies expenses
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  async function fetchCategorias() {
    setLoading(true);
    const { data, error } = await supabase
      .from("financeiro_categorias")
      .select("*")
      .eq("tipo", "despesa") // Only managing expense categories for now
      .order("nome");

    if (error) console.error("Error fetching categories:", error);
    else setCategorias(data || []);
    setLoading(false);
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!novaCategoria.nome.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("financeiro_categorias")
        .insert([novaCategoria]);

      if (error) throw error;

      setNovaCategoria({ nome: "", grupo: "", tipo: "despesa" }); // Reset form
      fetchCategorias(); // Refresh list
      if (onSuccess) onSuccess(); // Notify parent to refresh dropdown
    } catch (err) {
      alert("Erro ao adicionar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Tem certeza? Isso não apagará despesas já lançadas com essa categoria."
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("financeiro_categorias")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchCategorias();
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Gerenciar Categorias
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-6">
          <form
            onSubmit={handleAdd}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3"
          >
            <h3 className="text-xs font-bold text-gray-500 uppercase">
              Nova Categoria
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome (ex: Material de Limpeza)"
                className="flex-1 p-2 border rounded-lg text-sm outline-none focus:border-blue-500"
                value={novaCategoria.nome}
                onChange={(e) =>
                  setNovaCategoria({ ...novaCategoria, nome: e.target.value })
                }
                required
              />
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px]"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={20} />
                )}
              </button>
            </div>
            <input
              type="text"
              placeholder="Grupo (ex: Desp. Administrativas) - Opcional"
              className="w-full p-2 border rounded-lg text-sm outline-none focus:border-blue-500"
              value={novaCategoria.grupo}
              onChange={(e) =>
                setNovaCategoria({ ...novaCategoria, grupo: e.target.value })
              }
            />
          </form>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase ml-1">
              Categorias Existentes
            </h3>
            {loading ? (
              <div className="text-center py-4 text-gray-400 text-sm">
                Carregando...
              </div>
            ) : categorias.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">
                Nenhuma categoria encontrada.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {categorias.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-700">
                        {cat.nome}
                      </p>
                      {cat.grupo && (
                        <p className="text-[10px] text-gray-400">{cat.grupo}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
