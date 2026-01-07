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
    <div className="min-h-screen bg-paper p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-bold text-sm"
        >
          <LogOut size={18} /> Sair do Sistema
        </button>
      </div>

      <h1 className="text-4xl font-serif text-primary font-bold mb-2">
        Portal Angels
      </h1>
      <p className="text-darkText/60 mb-12">Gestão Administrativa</p>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl w-full">
        <Link
          to="/admin/funcionarios"
          className="bg-white p-8 rounded-2xl shadow-md border border-beige hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-serif text-primary font-bold mb-2">
            Prestadores
          </h2>
          <p className="text-darkText/70">
            Gerencie sua rede de parceiros MEI e cuidadores.
          </p>
        </Link>

        <Link
          to="/admin/funcionarios/novo"
          className="bg-white p-8 rounded-2xl shadow-md border border-beige hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-serif text-primary font-bold mb-2">
            Novo Parceiro
          </h2>
          <p className="text-darkText/70">
            Cadastre um novo profissional na base manualmente.
          </p>
        </Link>

        <Link
          to="/admin/pacientes"
          className="bg-white p-8 rounded-2xl shadow-md border border-beige hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-100 transition-colors">
            <HeartPulse className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-serif text-primary font-bold mb-2">
            Pacientes
          </h2>
          <p className="text-darkText/70">
            Prontuários, endereços e responsáveis familiares.
          </p>
        </Link>
        <Link
          to="/admin/escalas"
          className="bg-white p-8 rounded-2xl shadow-md border border-beige hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-100 transition-colors">
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-serif text-primary font-bold mb-2">
            Escalas
          </h2>
          <p className="text-darkText/70">
            Mapa geral de plantões e confirmação de presença.
          </p>
        </Link>

        <Link
          to="/admin/candidatos"
          className="bg-white p-8 rounded-2xl shadow-md border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
        >
          {candidatosCount > 0 && (
            <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-sm">
              {candidatosCount} Novos
            </div>
          )}
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
            <Inbox className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-serif text-primary font-bold mb-2">
            Banco de Talentos
          </h2>
          <p className="text-darkText/70">
            Currículos recebidos pelo site (Trabalhe Conosco).
          </p>
        </Link>
      </div>
    </div>
  );
}
