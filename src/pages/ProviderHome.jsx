import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import {
  LogOut,
  Calendar,
  MapPin,
  Clock,
  User,
  ChevronRight,
  Stethoscope,
  AlertCircle,
  PlayCircle,
  CalendarClock,
  ArrowRight,
} from "lucide-react";

export default function ProviderHome() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [plantaoAtivo, setPlantaoAtivo] = useState(null);
  const [proximoPlantao, setProximoPlantao] = useState(null);
  const [meusPacientes, setMeusPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return navigate("/login");

      const { data: func } = await supabase
        .from("funcionarios")
        .select("id, nome_completo, status")
        .eq("auth_id", user.id)
        .single();

      if (!func || func.status !== "ativo") {
        alert("Seu acesso está inativo. Contate o administrador.");
        await supabase.auth.signOut();
        return navigate("/login");
      }

      setUsuario(func);

      const agora = new Date();
      const hoje = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

      const horaAtual = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const { data: plantoes } = await supabase
        .from("plantoes")
        .select(
          `
          id, 
          data_plantao, 
          horario_inicio, 
          horario_fim, 
          status,
          pacientes (id, nome_paciente, endereco_completo, diagnostico, grau_dependencia)
        `,
        )
        .eq("funcionario_id", func.id)
        .gte("data_plantao", hoje)
        .neq("status", "cancelado")
        .order("data_plantao", { ascending: true })
        .order("horario_inicio", { ascending: true });

      if (plantoes && plantoes.length > 0) {
        const active = plantoes.find(
          (p) =>
            p.data_plantao === hoje &&
            p.horario_inicio <= horaAtual &&
            p.horario_fim > horaAtual,
        );
        setPlantaoAtivo(active || null);

        const next = plantoes.find((p) => {
          if (active && p.id === active.id) return false;

          if (p.data_plantao > hoje) return true; 
          if (p.data_plantao === hoje && p.horario_inicio > horaAtual)
            return true; 
          return false;
        });
        setProximoPlantao(next || null);

        const pacientesMap = new Map();
        plantoes.forEach((p) => {
          if (p.pacientes) {
            pacientesMap.set(p.pacientes.id, p.pacientes);
          }
        });
        setMeusPacientes(Array.from(pacientesMap.values()));
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-primary p-6 pt-12 pb-28 rounded-b-[3rem] shadow-xl relative z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

        <div className="flex justify-between items-start mb-6 relative">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1 tracking-wide">
              Olá, parceiro(a)
            </p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {usuario ? usuario.nome_completo.split(" ")[0] : "Carregando..."}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/10 p-2.5 rounded-xl text-white hover:bg-white/20 transition-all backdrop-blur-md shadow-lg border border-white/10"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="px-6 -mt-24 relative z-20 space-y-4">
        {loading ? (
          <div className="h-32 bg-white/50 backdrop-blur-sm rounded-3xl animate-pulse border border-white/40 shadow-lg"></div>
        ) : (
          <>
            {plantaoAtivo && (
              <div className="bg-green-600 rounded-3xl p-5 text-white shadow-xl shadow-green-900/20 relative overflow-hidden group animate-in slide-in-from-bottom-4 duration-500">
                <div className="absolute -right-4 -top-4 text-green-500/20 rotate-12 group-hover:scale-110 transition-transform duration-500">
                  <PlayCircle size={100} fill="currentColor" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse shadow-[0_0_8px_rgba(134,239,172,0.8)]"></span>
                      Em Andamento
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mb-1 truncate pr-2 leading-tight">
                    {plantaoAtivo.pacientes?.nome_paciente}
                  </h2>

                  <div className="flex items-center gap-4 text-green-50 text-sm font-medium mb-5">
                    <span className="flex items-center gap-1.5 bg-black/10 px-2 py-0.5 rounded-lg">
                      <Clock size={14} /> Até às{" "}
                      {plantaoAtivo.horario_fim.slice(0, 5)}
                    </span>
                  </div>

                  <Link
                    to={`/app/pacientes/${plantaoAtivo.pacientes.id}`}
                    className="w-full bg-white text-green-700 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-green-50 active:scale-[0.98] transition-all"
                  >
                    Acessar Prontuário <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            )}

            {proximoPlantao && (
              <div className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 flex items-center justify-between group animate-in slide-in-from-bottom-6 duration-700 delay-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none"></div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1">
                      <CalendarClock size={12} /> Próximo
                    </span>
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      {formatarData(proximoPlantao.data_plantao)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight truncate">
                    {proximoPlantao.pacientes?.nome_paciente}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5 font-medium">
                    <Clock size={14} className="text-blue-500" />
                    {proximoPlantao.horario_inicio.slice(0, 5)} -{" "}
                    {proximoPlantao.horario_fim.slice(0, 5)}
                  </p>
                </div>

                <Link
                  to={`/app/pacientes/${proximoPlantao.pacientes.id}`}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0"
                >
                  <ArrowRight size={20} />
                </Link>
              </div>
            )}

            {!plantaoAtivo && !proximoPlantao && (
              <div className="bg-white/90 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-lg text-center py-8">
                <div className="bg-gray-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="text-gray-300" size={28} />
                </div>
                <h3 className="text-gray-800 font-bold mb-1">Agenda Livre</h3>
                <p className="text-gray-500 text-sm">
                  Nenhum plantão agendado para breve.
                </p>
              </div>
            )}
          </>
        )}

        {/* LISTA DE PACIENTES */}
        <div className="pt-6">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-4 px-1">
            <User size={20} className="text-primary" /> Meus Pacientes
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-200/50 rounded-2xl animate-pulse"
                ></div>
              ))}
            </div>
          ) : meusPacientes.length > 0 ? (
            <div className="space-y-4">
              {meusPacientes.map((paciente) => (
                <div
                  key={paciente.id}
                  className={`bg-white p-5 rounded-3xl border transition-all group relative overflow-hidden ${
                    plantaoAtivo?.pacientes?.id === paciente.id
                      ? "border-green-200 shadow-md ring-1 ring-green-100"
                      : "border-gray-100 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl transition-colors ${
                          plantaoAtivo?.pacientes?.id === paciente.id
                            ? "bg-green-100 text-green-700"
                            : "bg-sage/10 text-primary border-sage/20"
                        }`}
                      >
                        {paciente.nome_paciente.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-base leading-tight">
                          {paciente.nome_paciente}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 inline-block mt-1">
                          {paciente.grau_dependencia || "Grau n/a"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-500 pl-1 mb-4 border-l-2 border-gray-100 ml-1">
                    <div className="flex items-start gap-2">
                      <MapPin
                        size={14}
                        className="text-gray-400 mt-0.5 shrink-0"
                      />
                      <p className="line-clamp-1 text-xs">
                        {paciente.endereco_completo?.split(",")[0]}
                      </p>
                    </div>
                    {paciente.diagnostico && (
                      <div className="flex items-start gap-2">
                        <Stethoscope
                          size={14}
                          className="text-gray-400 mt-0.5 shrink-0"
                        />
                        <p className="line-clamp-1 text-xs">
                          {paciente.diagnostico}
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/app/pacientes/${paciente.id}`}
                    className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-bold ${
                      plantaoAtivo?.pacientes?.id === paciente.id
                        ? "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                    }`}
                  >
                    {plantaoAtivo?.pacientes?.id === paciente.id
                      ? "Acessar Prontuário"
                      : "Ver Detalhes"}{" "}
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-200 text-center">
              <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="text-gray-300" size={24} />
              </div>
              <p className="text-gray-500 text-sm font-medium">
                Nenhum paciente vinculado à sua conta.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
