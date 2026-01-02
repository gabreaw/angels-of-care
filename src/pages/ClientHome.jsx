import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Heart,
  Activity,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  User,
  ShieldCheck,
} from "lucide-react";

export default function ClientHome() {
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [evolucoes, setEvolucoes] = useState([]);
  const [proximoPlantao, setProximoPlantao] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDadosFamilia();
  }, []);

  async function fetchDadosFamilia() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return navigate("/login");

      const { data: pac, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (error || !pac) throw new Error("Perfil familiar não encontrado.");
      setPaciente(pac);

      const { data: evos } = await supabase
        .from("evolucoes")
        .select("*")
        .eq("paciente_id", pac.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setEvolucoes(evos || []);

      const hoje = new Date().toISOString().split("T")[0];
      const { data: plantao } = await supabase
        .from("plantoes")
        .select(
          `
          data_plantao, 
          horario_inicio, 
          funcionarios (nome_completo, funcao)
        `
        )
        .eq("paciente_id", pac.id)
        .gte("data_plantao", hoje)
        .order("data_plantao", { ascending: true })
        .order("horario_inicio", { ascending: true })
        .limit(1)
        .maybeSingle();

      setProximoPlantao(plantao);
    } catch (error) {
      console.error(error);
      await supabase.auth.signOut();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">Carregando portal...</div>
    );

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {" "}
      <div className="bg-primary p-6 pt-10 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start mb-6">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1 flex items-center gap-1">
              <Heart size={14} className="text-red-300 fill-red-300" /> Portal
              da Família
            </p>
            <h1 className="text-2xl font-serif font-bold text-white">
              {paciente?.nome_paciente}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Acompanhamento em tempo real
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-white relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white text-primary p-3 rounded-full">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs uppercase opacity-70 font-bold">
                Escala de Hoje
              </p>
              {proximoPlantao ? (
                <>
                  <p className="font-bold text-lg leading-tight">
                    {proximoPlantao.funcionarios?.nome_completo.split(" ")[0]}
                  </p>
                  <p className="text-xs opacity-90">
                    {proximoPlantao.funcionarios?.funcao} •{" "}
                    {proximoPlantao.horario_inicio.slice(0, 5)}
                  </p>
                </>
              ) : (
                <p className="font-medium">Sem plantão agendado para hoje</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-8 max-w-lg mx-auto">
        <h2 className="text-primary font-bold text-lg mb-4 flex items-center gap-2">
          <Activity size={20} /> Diário de Cuidados
        </h2>

        {evolucoes.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Clock className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-500">Nenhum registro recente.</p>
          </div>
        ) : (
          <div className="space-y-6 relative border-l-2 border-gray-200 ml-3 pl-6 pb-4">
            {evolucoes.map((evo) => (
              <div key={evo.id} className="relative">
                <div className="absolute -left-[31px] top-0 bg-white border-2 border-primary w-4 h-4 rounded-full"></div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-sage" />
                      <span className="text-xs font-bold text-gray-600">
                        {evo.profissional_nome?.split(" ")[0] || "Cuidador"}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(evo.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed mb-3">
                    {evo.texto_evolucao}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {evo.higiene_realizada && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                        <CheckCircle size={10} /> Banho/Higiene
                      </span>
                    )}
                    {evo.diurese_presente && (
                      <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                        <CheckCircle size={10} /> Diurese
                      </span>
                    )}
                    {evo.arquivo_url && (
                      <a
                        href={evo.arquivo_url}
                        target="_blank"
                        className="text-[10px] bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-gray-200"
                      >
                        <FileText size={10} /> Ver Anexo
                      </a>
                    )}
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
