import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Users,
  UserPlus,
  HeartPulse,
  LogOut,
  Calendar,
  Inbox,
  Landmark,
  ArrowRight,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [candidatosCount, setCandidatosCount] = useState(0);

  useEffect(() => {
    checkCandidatos();
  }, []);

  async function checkCandidatos() {
    const { count } = await supabase
      .from("candidatos")
      .select("*", { count: "exact", head: true })
      .eq("status", "novo");

    setCandidatosCount(count || 0);
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Erro ao sair: " + error.message);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 animate-in fade-in duration-500">
      {/* HEADER + BOTÃO SAIR */}
      <div className="max-w-7xl mx-auto mb-10 mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Activity className="text-primary" />
            Portal Angels
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestão Administrativa Integrada
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-colors font-bold text-sm border border-red-100 shadow-sm"
        >
          <LogOut size={18} /> Sair do Sistema
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Operacional
            </h2>
            <div className="h-[1px] bg-gray-200 flex-1"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard
              to="/admin/funcionarios"
              icon={<Users size={24} className="text-blue-600" />}
              bgIcon="bg-blue-50"
              title="Prestadores"
              desc="Gerencie sua rede de parceiros."
            />

            <DashboardCard
              to="/admin/funcionarios/novo"
              icon={<UserPlus size={24} className="text-emerald-600" />}
              bgIcon="bg-emerald-50"
              title="Novo Parceiro"
              desc="Cadastrar profissional manualmente."
            />

            <DashboardCard
              to="/admin/pacientes"
              icon={<HeartPulse size={24} className="text-rose-600" />}
              bgIcon="bg-rose-50"
              title="Pacientes"
              desc="Prontuários e responsáveis."
            />

            <DashboardCard
              to="/admin/escalas"
              icon={<Calendar size={24} className="text-purple-600" />}
              bgIcon="bg-purple-50"
              title="Escalas"
              desc="Mapa geral de plantões."
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Administrativo
            </h2>
            <div className="h-[1px] bg-gray-200 flex-1"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard
              to="/admin/candidatos"
              icon={<Inbox size={24} className="text-sky-600" />}
              bgIcon="bg-sky-50"
              title="Banco de Talentos"
              desc="Currículos do site."
              badge={candidatosCount}
            />

            <DashboardCard
              to="/admin/financeiro"
              icon={<Landmark size={24} className="text-amber-600" />}
              bgIcon="bg-amber-50"
              title="Financeiro"
              desc="Área financeira e caixa."
              highlight={true}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardCard({
  to,
  icon,
  bgIcon,
  title,
  desc,
  highlight = false,
  badge = 0,
}) {
  return (
    <Link
      to={to}
      className={`
                relative overflow-hidden bg-white p-6 rounded-2xl border transition-all duration-300
                hover:shadow-lg hover:-translate-y-1 group flex flex-col justify-between min-h-[140px]
                ${highlight ? "border-amber-200 ring-4 ring-amber-50/30" : "border-gray-100"}
            `}
    >
      {badge > 0 && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse shadow-sm z-10">
          {badge} NOVOS
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div
          className={`w-12 h-12 ${bgIcon} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}
        >
          {icon}
        </div>
        <div className="text-gray-300 group-hover:text-primary transition-colors transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 duration-300">
          <ArrowRight size={20} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 leading-snug">{desc}</p>
      </div>
    </Link>
  );
}
