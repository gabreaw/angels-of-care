import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { UserPlus, Phone, Search } from "lucide-react";

export default function AdminListaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  async function fetchFuncionarios() {
    setLoading(true);
    const { data, error } = await supabase
      .from("funcionarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Erro ao buscar:", error);
    else setFuncionarios(data || []);

    setLoading(false);
  }

  async function toggleStatus(id, statusAtual) {
    const novoStatus = statusAtual === "ativo" ? "inativo" : "ativo";

    const { error } = await supabase
      .from("funcionarios")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar status: " + error.message);
    } else {
      setFuncionarios(
        funcionarios.map((func) =>
          func.id === id ? { ...func, status: novoStatus } : func
        )
      );
    }
  }

  const filteredFuncionarios = funcionarios.filter(
    (func) =>
      func.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.funcao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-primary font-bold">
              Rede de Prestadores
            </h1>
            <p className="text-darkText/60">
              Ative ou desative parceiros conforme a disponibilidade.
            </p>
          </div>
          <Link
            to="/admin/funcionarios/novo"
            className="bg-primary hover:bg-[#3A4A3E] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <UserPlus size={20} />
            Novo Prestador
          </Link>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-beige mb-6 flex items-center gap-3">
          <Search className="text-sage" />
          <input
            type="text"
            placeholder="Buscar por nome ou especialidade..."
            className="w-full outline-none text-darkText"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-beige overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sage">
              Carregando base de dados...
            </div>
          ) : filteredFuncionarios.length === 0 ? (
            <div className="p-8 text-center text-darkText/60">
              Nenhum prestador encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sage/20 text-primary font-serif">
                  <tr>
                    <th className="p-4">Prestador</th>
                    <th className="p-4">Especialidade</th>
                    <th className="p-4">Contato</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige">
                  {filteredFuncionarios.map((func) => (
                    <tr
                      key={func.id}
                      className={`transition-colors hover:bg-paper ${
                        func.status === "inativo" ? "opacity-60 bg-gray-50" : ""
                      }`}
                    >
                      <td className="p-4">
                        <Link
                          to={`/admin/funcionarios/${func.id}`}
                          className="font-bold text-darkText hover:text-primary hover:underline block"
                        >
                          {func.nome_completo}
                        </Link>
                        {func.status === "pendente" && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                            Novo Cadastro
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            func.funcao === "Enfermeiro"
                              ? "bg-purple-100 text-purple-700"
                              : func.funcao === "Téc. Enfermagem"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {func.funcao}
                        </span>
                      </td>

                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-sage" />
                          {func.telefone}
                        </div>
                        <div className="text-darkText/50 text-xs ml-6 truncate max-w-[150px]">
                          {func.email}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => toggleStatus(func.id, func.status)}
                            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              func.status === "ativo"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                            title={
                              func.status === "ativo"
                                ? "Desativar Prestador"
                                : "Reativar Prestador"
                            }
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                func.status === "ativo"
                                  ? "translate-x-7"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span className="text-[10px] font-bold uppercase text-darkText/50">
                            {func.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/admin" className="text-sage hover:text-primary underline">
            Voltar ao Painel
          </Link>
        </div>
      </div>
    </div>
  );
}
