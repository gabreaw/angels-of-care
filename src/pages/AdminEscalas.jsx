import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import {
  Calendar as CalIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
  MessageCircle,
  Clock,
  User,
  AlertCircle,
  X,
  Check,
} from "lucide-react";

export default function AdminEscalas() {
  const [plantoes, setPlantoes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const [filtroPaciente, setFiltroPaciente] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState("");

  const toSecureStringUTC = (dateObj) => {
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const createNoonDate = (year, month, day) => {
    return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
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
    const curr = new Date(currentDate);
    curr.setHours(12, 0, 0, 0);
    if (viewMode === "month") {
      start = createNoonDate(curr.getFullYear(), curr.getMonth(), 1);
      end = createNoonDate(curr.getFullYear(), curr.getMonth() + 1, 0);
    } else {
      const day = curr.getDay();
      start = new Date(curr);
      start.setDate(curr.getDate() - day); 
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    }

    let query = supabase
      .from("plantoes")
      .select(`*, pacientes (id, nome_paciente), funcionarios (nome_completo)`)
      .gte("data_plantao", toSecureStringUTC(start))
      .lte("data_plantao", toSecureStringUTC(end))
      .order("data_plantao", { ascending: true })
      .order("horario_inicio", { ascending: true });

    if (filtroPaciente !== "todos") {
      query = query.eq("paciente_id", filtroPaciente);
    }

    const { data, error } = await query;
    if (error) console.error(error);
    else setPlantoes(data || []);

    setLoading(false);
  }

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") newDate.setMonth(newDate.getMonth() + 1);
    else newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    setCurrentDate(d);
  };

  const EventLabel = ({ plantao, onClick }) => {
    let bgClass = "bg-blue-100 text-blue-800 border-l-4 border-blue-500";

    if (plantao.status === "realizado")
      bgClass = "bg-green-100 text-green-800 border-l-4 border-green-500";
    if (plantao.status === "falta")
      bgClass =
        "bg-red-100 text-red-800 border-l-4 border-red-500 opacity-70 decoration-line-through";
    if (plantao.is_extra)
      bgClass =
        "bg-purple-100 text-purple-900 border-l-4 border-purple-500 ring-1 ring-purple-200";

    const semFuncionario = !plantao.funcionarios;
    if (semFuncionario && plantao.status === "agendado") {
      bgClass =
        "bg-red-50 text-red-600 border-l-4 border-red-500 animate-pulse";
    }

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick();
        }}
        className={`px-2 py-1 mb-1 rounded-r-md text-[10px] md:text-xs font-medium cursor-pointer hover:brightness-95 transition-all truncate shadow-sm flex items-center gap-1 ${bgClass}`}
        title={`${plantao.horario_inicio.slice(0, 5)} - ${
          plantao.pacientes?.nome_paciente
        } (${plantao.funcionarios?.nome_completo || "SEM FUNCIONÁRIO"})`}
      >
        <span className="font-bold shrink-0">
          {plantao.horario_inicio.slice(0, 5)}
        </span>
        <span className="truncate">
          {plantao.pacientes?.nome_paciente.split(" ")[0]}
          <span className="opacity-70 font-normal ml-1">
            (
            {plantao.funcionarios?.nome_completo?.split(" ")[0] || (
              <span className="font-bold text-red-600">??</span>
            )}
            )
          </span>
        </span>
      </div>
    );
  };
  const renderMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const blanks = Array(firstDayOfWeek).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const calendarDays = [...blanks, ...days];

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((day, index) => {
            if (!day)
              return (
                <div
                  key={`blank-${index}`}
                  className="bg-gray-50/30 min-h-[140px] border-b border-r border-gray-100"
                />
              );
            const dateString = `${year}-${String(month + 1).padStart(
              2,
              "0"
            )}-${String(day).padStart(2, "0")}`;

            const dayEvents = plantoes.filter(
              (p) => p.data_plantao === dateString
            );

            const todayStr = new Date().toISOString().split("T")[0];
            const isToday = dateString === todayStr;

            return (
              <div
                key={dateString}
                onClick={() => {
                  setSelectedDayEvents(dayEvents);
                  setSelectedDayLabel(
                    `${day}/${month + 1} - ${new Date(
                      year,
                      month,
                      day
                    ).toLocaleDateString("pt-BR", { weekday: "long" })}`
                  );
                  setModalOpen(true);
                }}
                className={`min-h-[140px] border-b border-r border-gray-100 p-1 relative hover:bg-blue-50/50 transition-colors cursor-pointer flex flex-col group ${
                  isToday ? "bg-blue-50/20" : "bg-white"
                }`}
              >
                <div className="flex justify-center mb-1">
                  <span
                    className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium ${
                      isToday
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-700"
                    }`}
                  >
                    {day}
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 4).map((event) => (
                    <EventLabel key={event.id} plantao={event} />
                  ))}
                  {dayEvents.length > 4 && (
                    <div className="text-[10px] text-gray-500 font-bold pl-2 pt-1 hover:text-blue-600">
                      + {dayEvents.length - 4} plantões
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-gray-100 p-1 rounded hover:bg-gray-200">
                    <ArrowLeft size={10} className="rotate-180 text-gray-500" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const DayModal = () => {
    if (!modalOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={() => setModalOpen(false)}
      >
        <div
          className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-primary p-4 px-6 flex justify-between items-center text-white shrink-0">
            <h3 className="text-xl font-bold font-serif capitalize">
              {selectedDayLabel}
            </h3>
            <button
              onClick={() => setModalOpen(false)}
              className="hover:bg-white/20 p-1 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto bg-gray-50 flex-1 space-y-3">
            {selectedDayEvents.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                Nenhum plantão neste dia.
              </p>
            ) : (
              selectedDayEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        {event.horario_inicio.slice(0, 5)} -{" "}
                        {event.horario_fim.slice(0, 5)}
                      </div>
                      <div className="font-bold text-primary text-base mt-1">
                        {event.pacientes?.nome_paciente}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                        event.status === "realizado"
                          ? "bg-green-100 text-green-700"
                          : event.status === "falta"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <User size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {event.funcionarios?.nome_completo || (
                        <span className="text-red-500 font-bold">
                          SEM ESCALA
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {" "}
        <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-6">
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <Link
              to="/admin"
              className="bg-white p-2 rounded-full shadow-sm hover:bg-gray-50 text-gray-500"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
                <CalIcon className="text-primary" /> Escalas
              </h1>
              <p className="text-gray-500 text-sm">Visão geral mensal</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
            {/* Navegação de Data */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-lg font-bold text-gray-800 w-40 text-center capitalize">
                {currentDate.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

            {/* Filtros */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filtroPaciente}
                onChange={(e) => setFiltroPaciente(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value="todos">Todos Pacientes</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome_paciente}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

            <button
              onClick={handleToday}
              className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
            >
              Hoje
            </button>

            <Link
              to="/admin/escalas/confirmacao"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <MessageCircle size={16} /> Disparar Whats
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="h-96 flex items-center justify-center text-gray-400 animate-pulse">
            Carregando calendário...
          </div>
        ) : (
          <div className="animate-fade-in">{renderMonthGrid()}</div>
        )}
        <DayModal />
      </div>
    </div>
  );
}
