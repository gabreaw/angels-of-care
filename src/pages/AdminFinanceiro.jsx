import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  FileText,
  Briefcase,
  PieChart,
} from "lucide-react";
import ContasPagar from "./financeiro/ContasPagar";

export default function AdminFinanceiro() {
  const [activeTab, setActiveTab] = useState("pagar");

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/admin"
            className="p-2 bg-white rounded-full hover:bg-gray-100 shadow-sm transition-colors text-sage"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-serif text-primary font-bold">
              Financeiro
            </h1>
            <p className="text-darkText/60">
              Gestão de contas, contratos e orçamentos.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-beige p-2 mb-6 flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "pagar"}
            onClick={() => setActiveTab("pagar")}
            icon={TrendingDown}
            label="Contas a Pagar"
            color="text-red-600"
          />
          <TabButton
            active={activeTab === "receber"}
            onClick={() => setActiveTab("receber")}
            icon={TrendingUp}
            label="Contas a Receber"
            color="text-green-600"
          />
          <TabButton
            active={activeTab === "orcamentos"}
            onClick={() => setActiveTab("orcamentos")}
            icon={FileText}
            label="Orçamentos"
          />
          <TabButton
            active={activeTab === "contratos"}
            onClick={() => setActiveTab("contratos")}
            icon={Briefcase}
            label="Contratos"
          />
          <TabButton
            active={activeTab === "relatorios"}
            onClick={() => setActiveTab("relatorios")}
            icon={PieChart}
            label="Relatórios"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-beige min-h-[500px]">
          {activeTab === "pagar" && <ContasPagar />}
          {activeTab === "receber" && (
            <div className="p-10 text-center text-gray-400">
              Módulo Contas a Receber (Em desenvolvimento)
            </div>
          )}
          {activeTab === "orcamentos" && (
            <div className="p-10 text-center text-gray-400">
              Módulo Orçamentos (Em desenvolvimento)
            </div>
          )}
          {activeTab === "contratos" && (
            <div className="p-10 text-center text-gray-400">
              Módulo Contratos (Em desenvolvimento)
            </div>
          )}
          {activeTab === "relatorios" && (
            <div className="p-10 text-center text-gray-400">
              Módulo Relatórios (Em desenvolvimento)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  color = "text-gray-600",
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
        active
          ? "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm"
          : "hover:bg-gray-50 text-gray-500 hover:text-gray-800"
      }`}
    >
      <Icon size={18} className={active ? "text-primary" : color} />
      {label}
    </button>
  );
}
