import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { X, Trash2, Plus, Save, Loader2, Edit2 } from "lucide-react";

export default function GerenciarCategoriasModal({ onClose, onSuccess }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nome: "",
    grupo: "",
    tipo: "despesa",
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  async function fetchCategorias() {
    setLoading(true);
    const { data, error } = await supabase
      .from("financeiro_categorias")
      .select("*")
      .eq("tipo", "despesa")
      .order("nome");

    if (error) console.error("Error fetching categories:", error);
    else setCategorias(data || []);
    setLoading(false);
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("financeiro_categorias")
          .update({
            nome: formData.nome,
            grupo: formData.grupo,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("financeiro_categorias")
          .insert([formData]);

        if (error) throw error;
      }

      setFormData({ nome: "", grupo: "", tipo: "despesa" });
      setEditingId(null);
      fetchCategorias();
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (cat) => {
    setFormData({
      nome: cat.nome,
      grupo: cat.grupo || "",
      tipo: cat.tipo,
    });
    setEditingId(cat.id);
  };

  const handleCancelEdit = () => {
    setFormData({ nome: "", grupo: "", tipo: "despesa" });
    setEditingId(null);
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

      if (id === editingId) handleCancelEdit();

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
            onSubmit={handleSave}
            className={`p-4 rounded-xl border shadow-sm space-y-3 transition-colors ${
              editingId
                ? "bg-blue-50 border-blue-200"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center">
              <h3
                className={`text-xs font-bold uppercase ${
                  editingId ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {editingId ? "Editando Categoria" : "Nova Categoria"}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-red-500 hover:underline font-bold"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome (ex: Material de Limpeza)"
                className="flex-1 p-2 border rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
              />
              <button
                type="submit"
                disabled={saving}
                className={`${
                  editingId
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px]`}
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : editingId ? (
                  <Save size={20} />
                ) : (
                  <Plus size={20} />
                )}
              </button>
            </div>

            <input
              type="text"
              placeholder="Grupo (ex: Desp. Administrativas) - Opcional"
              className="w-full p-2 border rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              value={formData.grupo}
              onChange={(e) =>
                setFormData({ ...formData, grupo: e.target.value })
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
                    className={`flex justify-between items-center p-3 hover:bg-gray-50 transition-colors group ${
                      editingId === cat.id ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          editingId === cat.id
                            ? "text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {cat.nome}
                      </p>
                      {cat.grupo && (
                        <p className="text-[10px] text-gray-400">{cat.grupo}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(cat)}
                        className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
