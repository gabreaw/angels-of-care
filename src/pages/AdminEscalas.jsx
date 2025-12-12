import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import {
  Calendar as CalIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  X,
  Maximize2,
  MessageCircle,
} from "lucide-react";

export default function AdminEscalas() {
  const [plantoes, setPlantoes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inicializa já com horas seguras para evitar problemas de timezone na navegação
  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const [filtroPaciente, setFiltroPaciente] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);

  // --- FUNÇÕES DE DATA BLINDADAS (STRING PURA) ---

  // Gera string YYYY-MM-DD segura a partir de uma data, usando UTC (para queries)
  const toSecureStringUTC = (dateObj) => {
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Gera string YYYY-MM-DD segura a partir de uma data, usando local time (para display)
  const toSecureStringLocal = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Cria data segura ao MEIO-DIA para cálculos, usando UTC
  const createNoonDate = (year, month, day) => {
    return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  };

  // Extrai o dia "15" da string "2025-12-15" sem converter para data (Evita erro de fuso)
  const getDayFromString = (dateString) => {
    if (!dateString) return "";
    return parseInt(dateString.split("-")[2], 10);
  };

  useEffect(() => {
    const fetchPacientes = async () => {
      const { data } = await supabase
        .from("pacientes")
        .select("id, nome_paciente")
        .order("nome_paciente");
      setPacientes(data || []);
    };
    fetchPacientes();
  }, []);

  useEffect(() => {
    fetchEscalas();
  }, [currentDate, viewMode, filtroPaciente]);

  async function fetchEscalas() {
    setLoading(true);

    let start, end;
    // Sempre clonar e garantir meio-dia para cálculos de navegação
    const curr = new Date(currentDate);
    curr.setHours(12, 0, 0, 0);

    if (viewMode === "month") {
      // Do dia 1 ao último dia do mês
      start = createNoonDate(curr.getFullYear(), curr.getMonth(), 1);
      end = createNoonDate(curr.getFullYear(), curr.getMonth() + 1, 0);
    } else if (viewMode === "week") {
      const day = curr.getDay();
      start = new Date(curr);
      start.setDate(curr.getDate() - day);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else {
      start = new Date(curr);
      end = new Date(curr);
    }

    const startStr = toSecureStringUTC(start);
    const endStr = toSecureStringUTC(end);

    let query = supabase
      .from("plantoes")
      .select(
        `
        *,
        pacientes (id, nome_paciente, bairro),
        funcionarios (nome_completo)
      `
      )
      .gte("data_plantao", startStr)
      .lte("data_plantao", endStr)
      .order("data_plantao", { ascending: true })
      .order("horario_inicio", { ascending: true });

    if (filtroPaciente !== "todos") {
      query = query.eq("paciente_id", filtroPaciente);
    }

    const { data, error } = await query;

    if (error) console.error("Erro:", error);
    else {
      // Adiciona displayDate para cada plantao, convertendo UTC para local
      const plantoesComDisplayDate = (data || []).map(p => {
        const utcDate = new Date(p.data_plantao);
        const displayDate = toSecureStringLocal(utcDate);
        return {
          ...p,
          displayDate
        };
      });
      setPlantoes(plantoesComDisplayDate);
    }

    setLoading(false);
  }

  async function mudarStatus(id, novoStatus) {
    const { error } = await supabase
      .from("plantoes")
      .update({ status: novoStatus })
      .eq("id", id);
    if (!error) {
      setPlantoes(
        plantoes.map((p) => (p.id === id ? { ...p, status: novoStatus } : p))
      );
    }
  }

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    newDate.setHours(12, 0, 0, 0);
    if (viewMode === "month") newDate.setMonth(newDate.getMonth() - 1);
    else if (viewMode === "week") newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    newDate.setHours(12, 0, 0, 0);
    if (viewMode === "month") newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === "week") newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    setCurrentDate(d);
  };

  const openDayModal = (dateStr) => {
    setModalDate(dateStr);
    setModalOpen(true);
  };

  const PlantaoCard = ({ plantao, compact = false }) => {
    const statusColors = {
      agendado: "border-blue-200 bg-blue-50 text-blue-900",
      realizado: "border-green-200 bg-green-50 text-green-900",
      falta: "border-red-200 bg-red-50 text-red-900",
      cancelado: "border-gray-200 bg-gray-50 text-gray-500 opacity-60",
    };

    let cardClass = statusColors[plantao.status] || statusColors.agendado;
    if (plantao.is_extra) {
      cardClass =
        "border-purple-400 bg-purple-100 text-purple-900 ring-1 ring-purple-300";
    }

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`text-xs p-2 rounded-lg border-l-4 mb-1 shadow-sm hover:shadow-md transition-all cursor-pointer group relative ${cardClass}`}
      >
        {plantao.is_extra && (
          <span className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] px-1 rounded-bl">
            EXTRA
          </span>
        )}

        <div className="flex justify-between items-start">
          <span className="font-bold truncate">
            {plantao.pacientes?.nome_paciente.split(" ")[0]}
          </span>
          {!compact && (
            <span className="text-[10px] opacity-70">
              {plantao.horario_inicio.slice(0, 5)}
            </span>
          )}
        </div>

        {!compact && (
          <>
            <div className="mt-1 flex items-center gap-1 opacity-80">
              <User size={10} />
              <span className="truncate">
                {plantao.funcionarios?.nome_completo?.split(" ")[0] ||
                  "SEM ESCALA"}
              </span>
            </div>

            <div className="flex gap-2 mt-2 pt-1 border-t border-black/5 justify-end">
              {plantao.status === "agendado" ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      mudarStatus(plantao.id, "realizado");
                    }}
                    className="p-1 bg-white rounded-full text-green-600 hover:scale-110 shadow-sm"
                    title="Confirmar"
                  >
                    <CheckCircle size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      mudarStatus(plantao.id, "falta");
                    }}
                    className="p-1 bg-white rounded-full text-red-500 hover:scale-110 shadow-sm"
                    title="Falta"
                  >
                    <XCircle size={14} />
                  </button>
                </>
              ) : (
                <span className="uppercase text-[9px] font-bold opacity-70">
                  {plantao.status}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Cria dias baseados no meio-dia para garantir estabilidade
    const firstDay = createNoonDate(year, month, 1);
    const lastDay = createNoonDate(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const daysArray = [];
    for (let i = 0; i < startDayOfWeek; i++) daysArray.push(null);
    for (let i = 1; i <= daysInMonth; i++)
      daysArray.push(createNoonDate(year, month, i));

    return (
      <div className="grid grid-cols-7 gap-px bg-beige border border-beige rounded-xl overflow-hidden shadow-sm">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div
            key={d}
            className="bg-sage/10 p-2 text-center text-xs font-bold text-primary uppercase"
          >
            {d}
          </div>
        ))}
        {daysArray.map((dateObj, idx) => {
          if (!dateObj)
            return <div key={idx} className="bg-gray-50 min-h-[100px]"></div>;

          // STRING IS KING: Usamos a string para tudo (filtro e exibição)
          const dateStr = toSecureStringLocal(dateObj);

          const plantoesDoDia = plantoes.filter(
            (p) => p.displayDate === dateStr
          );

          const isToday = dateStr === toSecureStringLocal(new Date());

          return (
            <div
              key={idx}
              onClick={() => openDayModal(dateStr)}
              className={`bg-white min-h-[120px] p-2 border-t border-l border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors group relative ${
                isToday ? "bg-blue-50/30" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`text-sm font-bold ${
                    isToday
                      ? "text-blue-600 bg-blue-100 px-2 rounded-full"
                      : "text-gray-400"
                  }`}
                >
                  {/* AQUI É O PULO DO GATO: Não usamos dateObj.getDate(). Usamos a string! */}
                  {getDayFromString(dateStr)}
                </span>
                <Maximize2
                  size={12}
                  className="text-sage opacity-0 group-hover:opacity-100"
                />
              </div>

              <div className="space-y-1">
                {plantoesDoDia.slice(0, 2).map((p) => (
                  <PlantaoCard key={p.id} plantao={p} compact={true} />
                ))}
                {plantoesDoDia.length > 2 && (
                  <div className="text-[10px] text-center text-primary font-bold bg-sage/10 rounded py-1">
                    + {plantoesDoDia.length - 2} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    const grouped = plantoes.reduce((acc, p) => {
      acc[p.displayDate] = acc[p.displayDate] || [];
      acc[p.displayDate].push(p);
      return acc;
    }, {});

    const daysToShow = [];
    const start = new Date(currentDate);
    start.setHours(12, 0, 0, 0); // Meio-dia

    if (viewMode === "week") {
      start.setDate(start.getDate() - start.getDay());
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        daysToShow.push(toSecureStringLocal(d));
      }
    } else {
      daysToShow.push(toSecureStringLocal(currentDate));
    }

    return (
      <div className="space-y-6">
        {daysToShow.map((dataStr) => {
          // Cria objeto data seguro só para formatar o título (Semana, Dia da semana)
          const [ano, mes, dia] = dataStr.split("-");
          const dateObj = new Date(ano, mes - 1, dia, 12, 0, 0); // Força meio-dia

          const list = grouped[dataStr] || [];
          const isToday = dataStr === toSecureString(new Date());

          return (
            <div
              key={dataStr}
              className={`bg-white rounded-2xl shadow-sm border p-4 ${
                isToday
                  ? "border-blue-200 ring-1 ring-blue-100"
                  : "border-beige"
              }`}
            >
              <h3
                className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                  isToday ? "text-blue-700" : "text-primary"
                }`}
              >
                <span className="capitalize">
                  {dateObj.toLocaleDateString("pt-BR", { weekday: "long" })}
                </span>
                <span className="text-gray-400 font-normal">
                  | {getDayFromString(dataStr)}/{dateObj.getMonth() + 1}/
                  {dateObj.getFullYear()}
                </span>
                {isToday && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    HOJE
                  </span>
                )}
              </h3>

              {list.length === 0 ? (
                <p className="text-sm text-gray-400 italic pl-2">
                  Sem plantões agendados.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((p) => (
                    <PlantaoCard key={p.id} plantao={p} compact={false} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const DayDetailsModal = () => {
    if (!modalOpen || !modalDate) return null;

    const plantoesModal = plantoes.filter((p) => p.displayDate === modalDate);

    // Parse seguro para o título do modal
    const [ano, mes, dia] = modalDate.split("-");
    const dateObj = new Date(ano, mes - 1, dia, 12, 0, 0);

    const diaFormatado = dateObj.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={() => setModalOpen(false)}
      >
        <div
          className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-beige overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-primary p-6 text-white flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-2xl font-serif font-bold capitalize">
                {diaFormatado}
              </h2>
              <p className="text-white/70 text-sm">
                {plantoesModal.length} plantões agendados
              </p>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-3 bg-gray-50 flex-1">
            {plantoesModal.length === 0 ? (
              <p className="text-center text-gray-400 italic py-8">
                Nenhum plantão neste dia.
              </p>
            ) : (
              plantoesModal.map((p) => (
                <PlantaoCard key={p.id} plantao={p} compact={false} />
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white text-center shrink-0">
            <button
              onClick={() => setModalOpen(false)}
              className="text-sage hover:text-primary font-bold text-sm"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <Link to="/admin" className="text-sage hover:text-primary">
              <ArrowLeft />
            </Link>
            <div>
              <h1 className="text-3xl font-serif text-primary font-bold">
                Agenda de Escalas
              </h1>
              <p className="text-darkText/60">
                Visualize e controle os plantões.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto bg-white p-2 rounded-2xl shadow-sm border border-beige">
            <div className="flex items-center px-3 border-r border-gray-100">
              <Filter size={16} className="text-sage mr-2" />
              <select
                value={filtroPaciente}
                onChange={(e) => setFiltroPaciente(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold text-darkText w-32 md:w-40"
              >
                <option value="todos">Todos Pacientes</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome_paciente}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleToday}
                className="text-sm font-bold px-3 py-1 hover:bg-gray-100 rounded"
              >
                {viewMode === "month"
                  ? currentDate.toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })
                  : viewMode === "week"
                  ? `Semana de ${currentDate.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}`
                  : currentDate.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                    })}
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("day")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === "day"
                    ? "bg-white shadow text-primary"
                    : "text-gray-500"
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === "week"
                    ? "bg-white shadow text-primary"
                    : "text-gray-500"
                }`}
              >
                Sem
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === "month"
                    ? "bg-white shadow text-primary"
                    : "text-gray-500"
                }`}
              >
                Mês
              </button>
            </div>
            <Link
              to="/admin/escalas/confirmacao"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg text-sm"
            >
              <MessageCircle size={18} /> Disparar Escalas
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-sage">
            Carregando escalas...
          </div>
        ) : (
          <div className="animate-fade-in">
            {viewMode === "month" ? renderMonthView() : renderListView()}
          </div>
        )}

        <DayDetailsModal />
      </div>
    </div>
  );
}
