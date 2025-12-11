import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { UserPlus, Search, MapPin, Phone, HeartPulse } from "lucide-react";

export default function AdminPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPacientes();
  }, []);

  async function fetchPacientes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .order("nome_paciente", { ascending: true });

    if (error) console.error("Erro ao buscar pacientes:", error);
    else setPacientes(data || []);

    setLoading(false);
  }

  const filtered = pacientes.filter(
    (p) =>
      p.nome_paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.bairro && p.bairro.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-primary font-bold">
              Meus Pacientes
            </h1>
            <p className="text-darkText/60">
              Gestão de clientes e endereços de atendimento.
            </p>
          </div>
          <Link
            to="/admin/pacientes/novo"
            className="bg-primary hover:bg-[#3A4A3E] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <UserPlus size={20} />
            Novo Paciente
          </Link>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-beige mb-6 flex items-center gap-3">
          <Search className="text-sage" />
          <input
            type="text"
            placeholder="Buscar por nome do paciente ou bairro..."
            className="w-full outline-none text-darkText"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="text-center p-8 text-sage">
            Carregando pacientes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-8 text-darkText/60 bg-white rounded-xl border border-dashed border-beige">
            Nenhum paciente encontrado. Cadastre o primeiro!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((paciente) => (
              <div
                key={paciente.id}
                className="bg-white p-6 rounded-2xl shadow-md border border-beige hover:shadow-xl transition-all relative group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-xl text-primary">
                      {paciente.nome_paciente}
                    </h3>
                    {paciente.diagnostico && (
                      <span className="text-[10px] uppercase bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold mt-1 inline-block">
                        {paciente.diagnostico}
                      </span>
                    )}
                  </div>
                  <div className="bg-red-50 p-2 rounded-full">
                    <HeartPulse className="text-red-400" size={20} />
                  </div>
                </div>

                <div className="space-y-3 text-sm text-darkText/80">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-sage shrink-0" />
                    <span className="truncate">
                      {paciente.bairro || "Bairro não informado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-sage shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-darkText/50">
                        Responsável:
                      </span>
                      <span className="font-medium">
                        {paciente.nome_responsavel || "N/I"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-dashed border-gray-100 flex justify-end">
                  <Link
                    to={`/admin/pacientes/${paciente.id}`}
                    className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Ver Prontuário →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/admin" className="text-sage hover:text-primary underline">
            Voltar ao Painel
          </Link>
        </div>
      </div>
    </div>
  );
}
