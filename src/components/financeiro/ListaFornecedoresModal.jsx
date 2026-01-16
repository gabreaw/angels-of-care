import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  X,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import NovoFornecedorModal from "./NovoFornecedorModal"; // Importamos o formulário aqui

export default function ListaFornecedoresModal({ onClose }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para controlar o formulário de Edição/Criação
  const [showForm, setShowForm] = useState(false);
  const [fornecedorParaEditar, setFornecedorParaEditar] = useState(null);

  useEffect(() => {
    fetchFornecedores();
  }, []);

  async function fetchFornecedores() {
    setLoading(true);
    const { data, error } = await supabase
      .from("financeiro_entidades")
      .select("*")
      .order("nome");

    if (error) console.error(error);
    else setFornecedores(data || []);
    setLoading(false);
  }

  // Filtra a lista localmente
  const filtered = fornecedores.filter(
    (f) =>
      f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cpf_cnpj?.includes(searchTerm)
  );

  // Ações
  const handleNovo = () => {
    setFornecedorParaEditar(null);
    setShowForm(true);
  };

  const handleEditar = (fornecedor) => {
    setFornecedorParaEditar(fornecedor);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este fornecedor?"))
      return;

    const { error } = await supabase
      .from("financeiro_entidades")
      .delete()
      .eq("id", id);
    if (error) alert("Erro ao excluir: " + error.message);
    else fetchFornecedores();
  };

  const handleSuccessForm = () => {
    fetchFornecedores(); // Recarrega a lista
    setShowForm(false); // Fecha o formulário e volta pra lista
  };

  // --- RENDERIZAÇÃO CONDICIONAL ---

  // Se o formulário estiver aberto, mostramos ele POR CIMA da lista
  if (showForm) {
    return (
      <NovoFornecedorModal
        onClose={() => setShowForm(false)} // Ao fechar o form, volta para a lista
        onSuccess={handleSuccessForm}
        fornecedorParaEditar={fornecedorParaEditar}
      />
    );
  }

  // Caso contrário, mostra a LISTA
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Cabeçalho da Lista */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Gerenciar Fornecedores
            </h2>
            <p className="text-sm text-gray-500">
              Listagem de parceiros e clientes
            </p>
          </div>
          <button onClick={onClose}>
            <X size={24} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        {/* Barra de Ações */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex gap-3">
          <div className="flex-1 bg-white border border-gray-200 rounded-lg flex items-center px-3">
            <Search size={18} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              className="w-full py-2 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleNovo}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus size={18} /> Novo
          </button>
        </div>

        {/* Tabela de Listagem */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              Nenhum fornecedor encontrado.
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-800">{item.nome}</h3>
                      {item.nome_fantasia &&
                        item.nome_fantasia !== item.nome && (
                          <span className="text-xs text-gray-500">
                            ({item.nome_fantasia})
                          </span>
                        )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          item.tipo_pessoa === "juridica"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {item.tipo_pessoa}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {item.cpf_cnpj && (
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                          {item.cpf_cnpj}
                        </span>
                      )}
                      {item.telefone_celular && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {item.telefone_celular}
                        </span>
                      )}
                      {item.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} /> {item.email}
                        </span>
                      )}
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
