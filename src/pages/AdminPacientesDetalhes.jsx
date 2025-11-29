import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  FileText,
  Activity,
} from "lucide-react";

export default function AdminPacientesDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaciente();
  }, []);

  async function fetchPaciente() {
    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Erro ao buscar paciente: " + error.message);
      navigate("/admin/pacientes");
    } else {
      setPaciente(data);
    }
    setLoading(false);
  }

  if (loading)
    return (
      <div className="p-8 text-center text-sage">Carregando prontuário...</div>
    );
  if (!paciente) return null;

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            to="/admin/pacientes"
            className="flex items-center gap-2 text-sage hover:text-primary transition-colors w-fit"
          >
            <ArrowLeft size={20} /> Voltar para Lista
          </Link>
        </div>
        <div className="bg-white rounded-3xl shadow-lg border border-beige overflow-hidden mb-8">
          <div className="bg-red-50 p-8 border-b border-red-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-serif text-primary font-bold">
                  {paciente.nome_paciente}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    paciente.status === "ativo"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {paciente.status || "Ativo"}
                </span>
              </div>
              <p className="text-darkText/70 flex items-center gap-2 text-sm">
                <User size={16} /> {paciente.sexo} • Nasc:{" "}
                {paciente.data_nascimento} • CPF: {paciente.cpf_paciente}
              </p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-red-100 shadow-sm text-center">
              <span className="block text-xs font-bold text-red-400 uppercase">
                Grau de Dependência
              </span>
              <span className="text-xl font-bold text-primary">
                {paciente.grau_dependencia}
              </span>
            </div>
          </div>
          <div className="p-8 grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Activity className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">Diagnóstico</h3>
                  <p className="text-darkText/80 text-lg">
                    {paciente.diagnostico}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-yellow-50 p-2 rounded-lg">
                  <FileText className="text-yellow-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">
                    Cuidados Específicos
                  </h3>
                  <p className="text-darkText/80 bg-paper p-4 rounded-xl border border-beige/50 text-sm leading-relaxed">
                    {paciente.cuidados_especificos ||
                      "Nenhuma observação registrada."}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-50 p-2 rounded-lg">
                  <MapPin className="text-green-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">
                    Local de Atendimento
                  </h3>
                  <p className="text-darkText/80 text-sm">
                    {paciente.logradouro}, {paciente.numero} <br />
                    {paciente.bairro} - {paciente.cidade}/{paciente.estado}{" "}
                    <br />
                    CEP: {paciente.cep}
                  </p>
                  {paciente.complemento && (
                    <p className="text-xs text-sage mt-1">
                      Comp: {paciente.complemento}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-purple-50 p-2 rounded-lg">
                  <Phone className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">
                    Responsável Financeiro
                  </h3>
                  <p className="text-darkText/80 font-bold">
                    {paciente.nome_responsavel}
                  </p>
                  <p className="text-sm text-darkText/60 mb-1">
                    {paciente.parentesco}
                  </p>
                  <a
                    href={`https://wa.me/${paciente.telefone_responsavel.replace(
                      /\D/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 font-bold text-sm hover:underline"
                  >
                    {paciente.telefone_responsavel} ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center py-12 border-2 border-dashed border-beige rounded-3xl opacity-50">
          <Activity size={40} className="mx-auto text-sage mb-2" />
          <h3 className="font-bold text-primary">
            Prontuário Diário e Escalas
          </h3>
          <p className="text-sm">
            Em breve você poderá ver o histórico de plantões aqui.
          </p>
        </div>
      </div>
    </div>
  );
}
