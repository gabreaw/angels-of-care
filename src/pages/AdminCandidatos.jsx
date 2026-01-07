import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Archive,
  CheckCircle,
  FileText,
} from "lucide-react";

export default function AdminCandidatos() {
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidatos();
  }, []);

  async function fetchCandidatos() {
    setLoading(true);
    // Busca candidatos que não foram arquivados
    const { data, error } = await supabase
      .from("candidatos")
      .select("*")
      .neq("status", "arquivado")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setCandidatos(data || []);
    setLoading(false);
  }

  const arquivarCandidato = async (id) => {
    if (!confirm("Arquivar este currículo? Ele sairá desta lista.")) return;
    const { error } = await supabase
      .from("candidatos")
      .update({ status: "arquivado" })
      .eq("id", id);
    if (!error) fetchCandidatos();
  };

  const marcarContatado = async (id) => {
    const { error } = await supabase
      .from("candidatos")
      .update({ status: "contatado" })
      .eq("id", id);
    if (!error) fetchCandidatos();
  };

  // Função para formatar o zap
  const linkZap = (tel) => `https://wa.me/${tel.replace(/\D/g, "")}`;

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/admin"
            className="p-2 bg-white rounded-full hover:bg-gray-100 shadow-sm"
          >
            <ArrowLeft className="text-sage" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif text-primary font-bold">
              Banco de Talentos
            </h1>
            <p className="text-darkText/60">
              Currículos recebidos pelo site (Trabalhe Conosco).
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-10">Carregando currículos...</div>
        ) : candidatos.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center border border-dashed text-gray-400">
            Nenhum currículo novo recebido.
          </div>
        ) : (
          <div className="grid gap-6">
            {candidatos.map((c) => (
              <div
                key={c.id}
                className={`bg-white p-6 rounded-2xl shadow-sm border ${
                  c.status === "contatado"
                    ? "border-green-200 bg-green-50/30"
                    : "border-beige"
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-primary">
                        {c.nome_completo}
                      </h3>
                      {c.status === "novo" && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                          Novo
                        </span>
                      )}
                      {c.status === "contatado" && (
                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                          Já Contatado
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
                      <User size={14} /> {c.funcao}
                      <span className="text-gray-300">|</span>
                      <MapPin size={14} /> {c.cidade_bairro}
                    </p>

                    {/* Resumo Expansível (simples) */}
                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 whitespace-pre-wrap font-mono leading-snug border border-gray-100 mb-4 max-h-40 overflow-y-auto">
                      {c.resumo_qualificacoes}
                    </div>

                    <div className="flex gap-3">
                      <a
                        href={linkZap(c.telefone || "")}
                        target="_blank"
                        className="flex items-center gap-1 text-sm font-bold text-green-600 hover:underline"
                      >
                        <Phone size={14} /> Chamar no WhatsApp
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => marcarContatado(c.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Marcar como Contatado"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      onClick={() => arquivarCandidato(c.id)}
                      className="p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 rounded-lg"
                      title="Arquivar/Excluir"
                    >
                      <Archive size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
