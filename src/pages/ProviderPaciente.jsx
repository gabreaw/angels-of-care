import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  FileText,
  Pill,
  MapPin,
  Paperclip,
  Edit, 
  X, 
  Save,
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

  const [editingId, setEditingId] = useState(null); 
  const [formData, setFormData] = useState({
    turno: "Diurno",
    texto: "",
    diurese: false,
    evacuacao: false,
    higiene: false,
    decubito: false,
    aspiracao: false,
    arquivo_url: null,
  });

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

      fetchEvolucoes(); 

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

  async function fetchEvolucoes() {
    const { data: evos } = await supabase
      .from("evolucoes")
      .select("*")
      .eq("paciente_id", id)
      .order("created_at", { ascending: false })
      .limit(10); 
    setEvolucoes(evos || []);
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditClick = (evo) => {
    setEditingId(evo.id);
    setFormData({
      turno: evo.turno,
      texto: evo.texto_evolucao,
      diurese: evo.diurese_presente,
      evacuacao: evo.evacuacao_presente,
      higiene: evo.higiene_realizada,
      decubito: evo.mudanca_decubito,
      aspiracao: evo.aspiracao_tqt,
      arquivo_url: evo.arquivo_url,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      turno: "Diurno",
      texto: "",
      diurese: false,
      evacuacao: false,
      higiene: false,
      decubito: false,
      aspiracao: false,
      arquivo_url: null,
    });
  };

  const handleSaveEvolucao = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let nomePrestador = "Prestador";
      if (user) {
        const { data: func } = await supabase
          .from("funcionarios")
          .select("nome_completo")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (func) nomePrestador = func.nome_completo;
      }

      const fileInput = e.target.anexo;
      let finalUrl = formData.arquivo_url; 

      if (fileInput && fileInput.files[0]) {
        const file = fileInput.files[0];
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
          finalUrl = urlData.publicUrl;
        }
      }

      const payload = {
        paciente_id: id,
        profissional_nome: nomePrestador, 
        turno: formData.turno,
        texto_evolucao: formData.texto,
        diurese_presente: formData.diurese,
        evacuacao_presente: formData.evacuacao,
        aspiracao_tqt: formData.aspiracao,
        mudanca_decubito: formData.decubito,
        higiene_realizada: formData.higiene,
        arquivo_url: finalUrl,
      };

      if (editingId) {
        const { error } = await supabase
          .from("evolucoes")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        alert("Evolução atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("evolucoes").insert([payload]);

        if (error) throw error;
        alert("Evolução registrada com sucesso!");
      }

      handleCancelEdit();
      fetchEvolucoes();
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setUploading(false);
    }
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
            <div
              className={`p-5 rounded-2xl shadow-sm border transition-colors ${
                editingId
                  ? "bg-amber-50 border-amber-200"
                  : "bg-white border-gray-100"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`font-bold flex items-center gap-2 ${
                    editingId ? "text-amber-700" : "text-primary"
                  }`}
                >
                  {editingId ? (
                    <>
                      <Edit size={18} /> Editando Registro
                    </>
                  ) : (
                    <>
                      <FileText size={18} /> Nova Evolução
                    </>
                  )}
                </h3>
                {editingId && (
                  <button
                    onClick={handleCancelEdit}
                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-500 font-bold bg-white px-2 py-1 rounded border"
                  >
                    <X size={12} /> Cancelar
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveEvolucao} className="space-y-4">
                <select
                  name="turno"
                  value={formData.turno}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-primary"
                >
                  <option>Diurno</option>
                  <option>Noturno</option>
                </select>

                <textarea
                  name="texto"
                  value={formData.texto}
                  onChange={handleInputChange}
                  placeholder="Relate como foi o plantão..."
                  className="w-full p-3 rounded-xl border border-gray-200 min-h-[100px] text-sm focus:border-primary outline-none"
                  required
                ></textarea>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="diurese"
                      checked={formData.diurese}
                      onChange={handleInputChange}
                      className="accent-primary"
                    />
                    <span className="text-xs">Diurese</span>
                  </label>
                  <label className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="evacuacao"
                      checked={formData.evacuacao}
                      onChange={handleInputChange}
                      className="accent-primary"
                    />
                    <span className="text-xs">Evacuação</span>
                  </label>
                  <label className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="higiene"
                      checked={formData.higiene}
                      onChange={handleInputChange}
                      className="accent-primary"
                    />
                    <span className="text-xs">Higiene</span>
                  </label>
                  <label className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="decubito"
                      checked={formData.decubito}
                      onChange={handleInputChange}
                      className="accent-primary"
                    />
                    <span className="text-xs">Decúbito</span>
                  </label>
                  <label className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="aspiracao"
                      checked={formData.aspiracao}
                      onChange={handleInputChange}
                      className="accent-primary"
                    />
                    <span className="text-xs">Aspiração</span>
                  </label>
                </div>

                <div className="border border-dashed border-blue-200 bg-blue-50/50 p-3 rounded-xl">
                  <label className="flex items-center gap-2 text-blue-700 text-xs font-bold justify-center cursor-pointer">
                    <Paperclip size={14} />
                    {formData.arquivo_url
                      ? "Substituir Anexo"
                      : "Anexar Foto/Doc"}
                    <input
                      type="file"
                      name="anexo"
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                  {formData.arquivo_url && (
                    <p className="text-[10px] text-center text-green-600 mt-1 truncate">
                      Arquivo atual: ...{formData.arquivo_url.slice(-15)}
                    </p>
                  )}
                </div>

                <button
                  disabled={uploading}
                  className={`w-full text-white font-bold py-3 rounded-xl shadow-md flex justify-center items-center gap-2 transition-all ${
                    editingId
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-primary hover:bg-[#3A4A3E]"
                  }`}
                >
                  {uploading ? (
                    "Salvando..."
                  ) : editingId ? (
                    <>
                      <Save size={18} /> Atualizar Evolução
                    </>
                  ) : (
                    "Salvar Registro"
                  )}
                </button>
              </form>
            </div>

            <div className="space-y-3 pb-10">
              <h4 className="text-xs font-bold text-gray-400 uppercase ml-1">
                Últimos Registros
              </h4>
              {evolucoes.map((evo) => (
                <div
                  key={evo.id}
                  className={`bg-white p-4 rounded-xl border shadow-sm transition-all ${
                    editingId === evo.id
                      ? "border-amber-400 ring-1 ring-amber-200"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          evo.turno === "Noturno"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {evo.turno}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(evo.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <button
                      onClick={() => handleEditClick(evo)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                      title="Editar esta evolução"
                    >
                      <Edit size={16} />
                    </button>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {evo.texto_evolucao}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-3 opacity-80">
                    {evo.diurese_presente && (
                      <span className="text-[9px] border px-1 rounded bg-gray-50">
                        Diurese
                      </span>
                    )}
                    {evo.evacuacao_presente && (
                      <span className="text-[9px] border px-1 rounded bg-gray-50">
                        Evacuação
                      </span>
                    )}
                    {evo.higiene_realizada && (
                      <span className="text-[9px] border px-1 rounded bg-gray-50">
                        Higiene
                      </span>
                    )}
                    {evo.mudanca_decubito && (
                      <span className="text-[9px] border px-1 rounded bg-gray-50">
                        Decúbito
                      </span>
                    )}
                    {evo.aspiracao_tqt && (
                      <span className="text-[9px] border px-1 rounded bg-gray-50">
                        Aspiração
                      </span>
                    )}
                  </div>
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
