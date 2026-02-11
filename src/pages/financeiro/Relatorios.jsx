import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Wallet,
  PieChart as PieIcon,
  AlertCircle,
} from "lucide-react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export default function Relatorios({ empresaId }) {
  const [loading, setLoading] = useState(true);
  const [erroApi, setErroApi] = useState(null);
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7));

  const [resumo, setResumo] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    pendente: 0,
  });

  const [dadosGraficoBarra, setDadosGraficoBarra] = useState([]);
  const [dadosGraficoPizza, setDadosGraficoPizza] = useState([]);

  useEffect(() => {
    console.log("Relatorios - Empresa ID recebido:", empresaId);

    if (empresaId) {
      fetchDados();
    } else {
      console.warn("Sem empresaId, buscando dados gerais...");
      fetchDados();
    }
  }, [mesAno, empresaId]);

  async function fetchDados() {
    setLoading(true);
    setErroApi(null);

    try {
      const [ano, mes] = mesAno.split("-");

      let query = supabase.from("financeiro_transacoes").select(`
          id,
          tipo, 
          valor, 
          status, 
          data_competencia,
          financeiro_categorias (nome)
        `);

      if (empresaId) {
        query = query.eq("empresa_id", empresaId);
      }

      const { data: dados, error } = await query;

      if (error) throw error;

      const dadosMesAtual = [];
      const dadosAnoTodo = [];

      dados.forEach((t) => {
        if (!t.data_competencia) return;

        const [tAno, tMes] = t.data_competencia.split("-");

        if (tAno === ano) {
          dadosAnoTodo.push({ ...t, mes: tMes });
        }

        if (tAno === ano && tMes === mes) {
          dadosMesAtual.push(t);
        }
      });

      let totalReceitas = 0;
      let totalDespesas = 0;
      let totalPendente = 0;
      const categoriasMap = {};

      dadosMesAtual.forEach((t) => {
        const valor = Number(t.valor || 0);

        if (t.tipo === "receita") {
          totalReceitas += valor;
        } else if (t.tipo === "despesa") {
          totalDespesas += valor;

          const nomeCat = t.financeiro_categorias?.nome || "Sem Categoria";
          if (!categoriasMap[nomeCat]) categoriasMap[nomeCat] = 0;
          categoriasMap[nomeCat] += valor;
        }

        if (t.status !== "pago") {
          totalPendente += valor;
        }
      });

      setResumo({
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo: totalReceitas - totalDespesas,
        pendente: totalPendente,
      });

      const pizzaData = Object.keys(categoriasMap)
        .map((key) => ({ name: key, value: categoriasMap[key] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      setDadosGraficoPizza(pizzaData);

      const mesesNomes = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];

      const barraData = mesesNomes.map((nome, index) => {
        const mesNumero = (index + 1).toString().padStart(2, "0");

        const transacoesDoMes = dadosAnoTodo.filter((t) => t.mes === mesNumero);

        const rec = transacoesDoMes
          .filter((t) => t.tipo === "receita")
          .reduce((acc, curr) => acc + Number(curr.valor), 0);

        const desp = transacoesDoMes
          .filter((t) => t.tipo === "despesa")
          .reduce((acc, curr) => acc + Number(curr.valor), 0);

        return { name: nome, Receitas: rec, Despesas: desp };
      });

      setDadosGraficoBarra(barraData);
    } catch (err) {
      console.error("Erro ao buscar relatórios:", err);
      setErroApi(err.message);
    } finally {
      setLoading(false);
    }
  }

  const formatMoney = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);

  if (erroApi) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2">
        <AlertCircle />
        <div>
          <p className="font-bold">Erro ao carregar dados</p>
          <p className="text-sm">{erroApi}</p>
          <button onClick={fetchDados} className="text-xs underline mt-1">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-1">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <PieIcon size={24} className="text-primary" /> Dashboard Financeiro
          </h2>
          <p className="text-sm text-gray-500">
            Visão geral da saúde financeira.{" "}
            {!empresaId && (
              <span className="text-red-500 font-bold">
                (Modo Global - Sem Empresa Selecionada)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <Calendar size={18} className="text-gray-400" />
            <input
              type="month"
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
              className="bg-transparent outline-none text-sm font-bold text-gray-700 cursor-pointer"
            />
          </div>
          <button
            onClick={fetchDados}
            className="bg-gray-100 p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
            title="Atualizar dados"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp size={80} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase mb-1">
              Receita
            </p>
            <h3 className="text-2xl font-bold text-green-600">
              {loading ? "..." : formatMoney(resumo.receitas)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-green-700 bg-green-50 w-fit px-2 py-1 rounded-full border border-green-100">
            <TrendingUp size={12} /> Entradas do mês
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingDown size={80} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase mb-1">
              Despesas
            </p>
            <h3 className="text-2xl font-bold text-red-600">
              {loading ? "..." : formatMoney(resumo.despesas)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-red-700 bg-red-50 w-fit px-2 py-1 rounded-full border border-red-100">
            <TrendingDown size={12} /> Saídas do mês
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between relative overflow-hidden text-white ${resumo.saldo >= 0 ? "bg-gradient-to-br from-blue-600 to-blue-500 border-blue-600" : "bg-gradient-to-br from-red-600 to-red-500 border-red-600"}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Wallet size={80} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80 mb-1 uppercase">
              Resultado Líquido
            </p>
            <h3 className="text-3xl text-white font-bold">
              {loading ? "..." : formatMoney(resumo.saldo)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-white/90 bg-white/20 w-fit px-2 py-1 rounded-full border border-white/10">
            <DollarSign size={12} /> {resumo.saldo >= 0 ? "Lucro" : "Prejuízo"}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Calendar size={80} className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase mb-1">
              Pendente (Geral)
            </p>
            <h3 className="text-2xl font-bold text-orange-500">
              {loading ? "..." : formatMoney(resumo.pendente)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-orange-700 bg-orange-50 w-fit px-2 py-1 rounded-full border border-orange-100">
            <Calendar size={12} /> A Receber ou Pagar
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Fluxo de Caixa ({mesAno.split("-")[0]})
          </h3>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                Carregando...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosGraficoBarra}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    tickFormatter={(val) => `k${val / 1000}`}
                  />
                  <Tooltip
                    formatter={(value) => formatMoney(value)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar
                    dataKey="Receitas"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar
                    dataKey="Despesas"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            Despesas por Categoria
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            Top 5 gastos em {mesAno.split("-")[1]}/{mesAno.split("-")[0]}
          </p>
          <div className="h-[300px] w-full relative">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                Carregando...
              </div>
            ) : dadosGraficoPizza.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <PieIcon size={32} className="mb-2 opacity-50" />
                Sem despesas registradas.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGraficoPizza}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dadosGraficoPizza.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
