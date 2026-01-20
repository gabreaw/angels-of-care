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
} from "lucide-react";

export default function ProviderHome() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
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
        .select("id, nome_completo")
        .eq("auth_id", user.id)
        .single();

      setUsuario(func);

      if (func) {
        const agora = new Date();

        const hoje = agora.toLocaleDateString("sv-SE", {
          timeZone: "America/Sao_Paulo",
        });

        const horaAtual = agora.toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
        });

        const { data: prox } = await supabase
          .from("plantoes")
          .select(
            `
            id, 
            data_plantao, 
            horario_inicio, 
            horario_fim, 
            pacientes (id, nome_paciente, endereco_completo)
          `,
          )
          .eq("funcionario_id", func.id)
          .gte("data_plantao", hoje)
          .order("data_plantao", { ascending: true })
          .order("horario_inicio", { ascending: true })
          .limit(10); 

        let nextShift = null;
        if (prox && prox.length > 0) {
          nextShift = prox.find((p) => {
            if (p.data_plantao > hoje) return true;
            if (p.data_plantao === hoje && p.horario_fim > horaAtual) {
              return true;
            }
            return false;
          });
        }

        setProximoPlantao(nextShift || null);

        const { data: plantoesFuturos } = await supabase
          .from("plantoes")
          .select(
            `
            pacientes (id, nome_paciente, endereco_completo, diagnostico, grau_dependencia)
          `,
          )
          .eq("funcionario_id", func.id)
          .gte("data_plantao", hoje) 
          .order("data_plantao", { ascending: true });

        const pacientesMap = new Map();
        if (plantoesFuturos) {
          plantoesFuturos.forEach((p) => {
            if (p.pacientes) {
              pacientesMap.set(p.pacientes.id, p.pacientes);
            }
          });
        }
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary p-6 pt-10 rounded-b-[2.5rem] shadow-xl relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">
              Olá, parceiro(a)
            </p>
            <h1 className="text-2xl font-serif font-bold text-white">
              {usuario ? usuario.nome_completo.split(" ")[0] : "Carregando..."}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <LogOut size={20} />
          </button>
        </div>

        {loading ? (
          <div className="h-24 bg-white/10 rounded-2xl animate-pulse"></div>
        ) : proximoPlantao ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar size={80} />
            </div>

            <div className="flex items-center gap-2 mb-3 opacity-90 text-xs font-bold uppercase tracking-wider">
              <span className="bg-green-500 w-2 h-2 rounded-full animate-pulse"></span>
              Próximo Compromisso
            </div>

            <h2 className="text-xl text-white font-bold mb-1 truncate pr-8">
              {proximoPlantao.pacientes?.nome_paciente}
            </h2>

            <div className="flex flex-col gap-1 mt-2 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span className="capitalize">
                  {formatarData(proximoPlantao.data_plantao)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>
                  {proximoPlantao.horario_inicio.slice(0, 5)} -{" "}
                  {proximoPlantao.horario_fim.slice(0, 5)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-white text-center">
            <Calendar className="mx-auto mb-2 opacity-50" size={32} />
            <p className="opacity-90 font-medium">Agenda livre por enquanto.</p>
            <p className="text-xs opacity-60">
              Nenhum plantão futuro encontrado.
            </p>
          </div>
        )}
      </div>

      <div className="px-6 -mt-6 relative z-20 space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 mt-10">
            Carregando dados...
          </div>
        ) : meusPacientes.length > 0 ? (
          <>
            <h3 className="font-bold text-darkText mt-8 mb-2 ml-1 text-lg flex items-center gap-2">
              <User size={18} className="text-primary" /> Meus Pacientes
            </h3>

            <div className="space-y-4">
              {meusPacientes.map((paciente) => (
                <div
                  key={paciente.id}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-sage/10 text-primary w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border border-sage/20">
                        {paciente.nome_paciente.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-primary text-lg leading-tight">
                          {paciente.nome_paciente}
                        </h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                          {paciente.grau_dependencia || "Grau n/a"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 pl-1 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-sage mt-0.5 shrink-0" />
                      <p className="line-clamp-2 leading-tight text-xs">
                        {paciente.endereco_completo}
                      </p>
                    </div>
                    {paciente.diagnostico && (
                      <div className="flex items-start gap-2">
                        <Stethoscope
                          size={16}
                          className="text-sage mt-0.5 shrink-0"
                        />
                        <p className="line-clamp-1 text-xs italic opacity-80">
                          {paciente.diagnostico}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-50">
                    <Link
                      to={`/app/pacientes/${paciente.id}`}
                      className="w-full bg-primary/5 hover:bg-primary hover:text-white text-primary font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm group-hover:translate-x-1"
                    >
                      Acessar Prontuário <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center mt-12">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-gray-300" size={32} />
            </div>
            <h3 className="font-bold text-gray-700 mb-1">Sem pacientes</h3>
            <p className="text-gray-500 text-sm">
              Você ainda não tem pacientes vinculados à sua escala.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
