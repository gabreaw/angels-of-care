import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  User,
  Activity,
  Pill,
  FileText,
  Plus,
  Clock,
  MapPin,
  CheckSquare,
  UploadCloud,
  Paperclip,
} from "lucide-react";

export default function ProviderPaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("evolucao"); 
  const [uploading, setUploading] = useState(false);

  const [evolucoes, setEvolucoes] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);

  useEffect(() => {
    fetchDados();
  }, [id]);

  async function fetchDados() {
    try {
      const { data: pac, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPaciente(pac);

      const { data: evos } = await supabase
        .from("evolucoes")
        .select("*")
        .eq("paciente_id", id)
        .order("created_at", { ascending: false })
        .limit(5);
      setEvolucoes(evos || []);

      const { data: meds } = await supabase
        .from("medicamentos")
        .select("*")
        .eq("paciente_id", id);
      setMedicamentos(meds || []);
    } catch (error) {
      alert("Paciente não encontrado ou sem permissão.");
      navigate("/app/home");
    } finally {
      setLoading(false);
    }
  }

  const handleAddEvolucao = async (e) => {
    e.preventDefault();
    setUploading(true);
    const form = e.target;

    // Pega usuário atual para registrar o nome
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: func } = await supabase
      .from("funcionarios")
      .select("nome_completo")
      .eq("auth_id", user.id)
      .single();

    const file = form.anexo.files[0];
    let arquivoUrl = null;

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${id}/${fileName}`;
      const { error: upErr } = await supabase.storage
        .from("evolucoes")
        .upload(filePath, file);
      if (!upErr) {
        const { data: urlData } = supabase.storage
          .from("evolucoes")
          .getPublicUrl(filePath);
        arquivoUrl = urlData.publicUrl;
      }
    }

    const novo = {
      paciente_id: id,
      profissional_nome: func?.nome_completo || "Prestador",
      turno: form.turno.value,
      texto_evolucao: form.texto.value,
      diurese_presente: form.diurese.checked,
      evacuacao_presente: form.evacuacao.checked,
      aspiracao_tqt: form.aspiracao.checked,
      mudanca_decubito: form.decubito.checked,
      higiene_realizada: form.higiene.checked,
      arquivo_url: arquivoUrl,
    };

    const { data, error } = await supabase
      .from("evolucoes")
      .insert([novo])
      .select();

    if (!error && data) {
      setEvolucoes([data[0], ...evolucoes]);
      form.reset();
      alert("Evolução registrada com sucesso!");
    } else {
      alert("Erro ao salvar: " + error.message);
    }
    setUploading(false);
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Carregando prontuário...
      </div>
    );
  if (!paciente) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary p-6 pt-8 pb-10 rounded-b-[2rem] shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/app/home" className="text-white/80 hover:text-white p-1">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-white truncate">
            {paciente.nome_paciente}
          </h1>
        </div>
        <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("evolucao")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "evolucao"
                ? "bg-white text-primary shadow-sm"
                : "text-white/70"
            }`}
          >
            Evolução
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "info"
                ? "bg-white text-primary shadow-sm"
                : "text-white/70"
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab("meds")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "meds"
                ? "bg-white text-primary shadow-sm"
                : "text-white/70"
            }`}
          >
            Meds
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-30 space-y-4">
        {activeTab === "evolucao" && (
          <>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
                <FileText size={18} /> Nova Evolução
              </h3>
              <form onSubmit={handleAddEvolucao} className="space-y-4">
                <select
                  name="turno"
                  className="w-full p-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                >
                  <option>Diurno</option>
                  <option>Noturno</option>
                </select>

                <textarea
                  name="texto"
                  placeholder="Relate como foi o plantão..."
                  className="w-full p-3 rounded-xl border border-gray-200 min-h-[100px] text-sm focus:border-primary outline-none"
                  required
                ></textarea>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <input
                      type="checkbox"
                      name="diurese"
                      className="accent-primary"
                    />{" "}
                    <span className="text-xs">Diurese</span>
                  </label>
                  <label className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <input
                      type="checkbox"
                      name="evacuacao"
                      className="accent-primary"
                    />{" "}
                    <span className="text-xs">Evacuação</span>
                  </label>
                  <label className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <input
                      type="checkbox"
                      name="higiene"
                      className="accent-primary"
                    />{" "}
                    <span className="text-xs">Higiene</span>
                  </label>
                  <label className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <input
                      type="checkbox"
                      name="decubito"
                      className="accent-primary"
                    />{" "}
                    <span className="text-xs">Decúbito</span>
                  </label>
                </div>

                <div className="border border-dashed border-blue-200 bg-blue-50 p-3 rounded-xl">
                  <label className="flex items-center gap-2 text-blue-700 text-xs font-bold justify-center cursor-pointer">
                    <Paperclip size={14} /> Anexar Foto/Doc
                    <input
                      type="file"
                      name="anexo"
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                </div>

                <button
                  disabled={uploading}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md"
                >
                  {uploading ? "Enviando..." : "Salvar Registro"}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase ml-1">
                Últimos Registros
              </h4>
              {evolucoes.map((evo) => (
                <div
                  key={evo.id}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                      {evo.turno}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(evo.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {evo.texto_evolucao}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
        {activeTab === "info" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div>
              <h4 className="text-xs font-bold text-sage uppercase mb-1">
                Diagnóstico
              </h4>
              <p className="text-gray-800 font-medium">
                {paciente.diagnostico}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-sage uppercase mb-1">
                Cuidados Específicos
              </h4>
              <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-sm text-yellow-900">
                {paciente.cuidados_especificos ||
                  "Nenhuma observação especial."}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-sage uppercase mb-1">
                Endereço
              </h4>
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <MapPin size={16} className="shrink-0 mt-0.5" />{" "}
                {paciente.endereco_completo}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-sage uppercase mb-1">
                Responsável
              </h4>
              <p className="font-bold text-primary">
                {paciente.nome_responsavel}
              </p>
              <a
                href={`https://wa.me/55${paciente.telefone_responsavel?.replace(
                  /\D/g,
                  ""
                )}`}
                className="text-green-600 text-sm font-bold underline"
              >
                {paciente.telefone_responsavel}
              </a>
            </div>
          </div>
        )}
        {activeTab === "meds" && (
          <div className="space-y-3">
            {medicamentos.length === 0 && (
              <div className="text-center text-gray-400 py-10">
                Nenhum medicamento cadastrado.
              </div>
            )}
            {medicamentos.map((med) => (
              <div
                key={med.id}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3"
              >
                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                  <Pill size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">
                    {med.nome_medicamento}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {med.dosagem} • {med.via_administracao}
                  </p>
                  <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded mt-1 inline-block">
                    {med.frequencia}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
