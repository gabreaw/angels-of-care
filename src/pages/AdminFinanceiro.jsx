import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  FileText,
  Briefcase,
  PieChart,
  Settings,
  Users,
  Tags,
  Wallet,
} from "lucide-react";
import ContasPagar from "./financeiro/ContasPagar";
import ContasReceber from "./financeiro/ContasReceber";
import Orcamentos from "./financeiro/Orcamentos";
import ListaFornecedoresModal from "../components/financeiro/ListaFornecedoresModal";
import NovaContaModal from "../components/financeiro/NovaContaModal";
import GerenciarCategoriasModal from "../components/financeiro/GerenciarCategoriasModal";
import ListaContasModal from "../components/financeiro/ListaContasModal";
import Relatorios from "./financeiro/Relatorios";
import Contratos from "./financeiro/Contratos";
export default function AdminFinanceiro() {
  const [activeTab, setActiveTab] = useState("pagar");
  const [menuOpen, setMenuOpen] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSupplierListModal, setShowSupplierListModal] = useState(false);
  const [showAccountListModal, setShowAccountListModal] = useState(false);

  return (
    <div
      className="min-h-screen bg-paper p-4 md:p-8"
      onClick={() => setMenuOpen(false)}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm text-gray-600 transition-all flex items-center gap-2 font-bold text-sm"
            >
              <Settings size={20} />{" "}
              <span className="hidden md:inline">Gerenciar</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Cadastros
                  </p>

                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <Tags size={16} className="text-blue-500" /> Categorias
                  </button>

                  <button
                    onClick={() => setShowSupplierListModal(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <Users size={16} className="text-green-500" /> Fornecedores
                    / Clientes
                  </button>

                  <button
                    onClick={() => setShowAccountListModal(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <Wallet size={16} className="text-purple-500" /> Contas
                    Bancárias
                  </button>
                </div>
              </div>
            )}
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
          {activeTab === "receber" && <ContasReceber />}
          {activeTab === "orcamentos" && <Orcamentos />}
          {activeTab === "relatorios" && <Relatorios />}
          {activeTab === "contratos" && <Contratos />}
        </div>
      </div>

      {showCategoryModal && (
        <GerenciarCategoriasModal onClose={() => setShowCategoryModal(false)} />
      )}

      {showSupplierListModal && (
        <ListaFornecedoresModal
          onClose={() => setShowSupplierListModal(false)}
        />
      )}

      {showAccountListModal && (
        <ListaContasModal onClose={() => setShowAccountListModal(false)} />
      )}
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
