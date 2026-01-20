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
} from "lucide-react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export default function Relatorios() {
  const [loading, setLoading] = useState(true);

  // Estado do filtro (Padrão: Mês Atual)
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const [resumo, setResumo] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    pendente: 0,
  });

  const [dadosGraficoBarra, setDadosGraficoBarra] = useState([]);
  const [dadosGraficoPizza, setDadosGraficoPizza] = useState([]);

  useEffect(() => {
    fetchDados();
  }, [mesAno]);

  async function fetchDados() {
    setLoading(true);

    const [ano, mes] = mesAno.split("-");

    // --- LÓGICA MENSAL (Cards e Pizza) ---
    // Define o intervalo exato do mês selecionado
    // Importante: Usamos string direta YYYY-MM-DD para evitar conversão de fuso indesejada
    const dataInicioMes = `${ano}-${mes}-01`;
    // Pega o último dia do mês corretamente
    const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
    const dataFimMes = `${ano}-${mes}-${ultimoDia}`;

    // Busca apenas dados deste mês específico
    const { data: dadosMes, error: errorMes } = await supabase
      .from("financeiro_transacoes")
      .select(
        `
        tipo, 
        valor, 
        status, 
        financeiro_categorias (nome)
      `,
      )
      .gte("data_competencia", dataInicioMes)
      .lte("data_competencia", dataFimMes);

    if (errorMes) {
      console.error(errorMes);
      setLoading(false);
      return;
    }

    // Processamento dos Cards (KPIs)
    let totalReceitas = 0;
    let totalDespesas = 0;
    let totalPendente = 0;
    const categoriasMap = {};

    dadosMes.forEach((t) => {
      const valor = Number(t.valor);

      if (t.tipo === "receita") {
        totalReceitas += valor;
      } else {
        totalDespesas += valor;

        // Agrupamento para Pizza (Despesas)
        const nomeCat = t.financeiro_categorias?.nome || "Sem Categoria";
        if (!categoriasMap[nomeCat]) categoriasMap[nomeCat] = 0;
        categoriasMap[nomeCat] += valor;
      }

      if (t.status === "pendente") {
        totalPendente += valor;
      }
    });

    setResumo({
      receitas: totalReceitas,
      despesas: totalDespesas,
      saldo: totalReceitas - totalDespesas,
      pendente: totalPendente,
    });

    // Dados Pizza
    const pizzaData = Object.keys(categoriasMap)
      .map((key) => ({ name: key, value: categoriasMap[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    setDadosGraficoPizza(pizzaData);

    // --- LÓGICA ANUAL (Gráfico de Barras) ---
    // Busca o ano todo para mostrar a evolução
    const inicioAno = `${ano}-01-01`;
    const fimAno = `${ano}-12-31`;

    const { data: dadosAno, error: errorAno } = await supabase
      .from("financeiro_transacoes")
      .select("tipo, valor, data_competencia")
      .gte("data_competencia", inicioAno)
      .lte("data_competencia", fimAno);

    if (!errorAno && dadosAno) {
      const meses = [
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

      const barraData = meses.map((nomeMes, index) => {
        const mesNumero = index + 1; // 1 a 12

        const transacoesDoMes = dadosAno.filter((t) => {
          // Extrai o mês da string YYYY-MM-DD de forma segura
          // Ex: "2026-05-15" -> split("-")[1] -> "05" -> parseInt -> 5
          const mesTransacao = parseInt(t.data_competencia.split("-")[1], 10);
          return mesTransacao === mesNumero;
        });

        const rec = transacoesDoMes
          .filter((t) => t.tipo === "receita")
          .reduce((acc, curr) => acc + Number(curr.valor), 0);

        const desp = transacoesDoMes
          .filter((t) => t.tipo === "despesa")
          .reduce((acc, curr) => acc + Number(curr.valor), 0);

        return {
          name: nomeMes,
          Receitas: rec,
          Despesas: desp,
        };
      });

      setDadosGraficoBarra(barraData);
    }

    setLoading(false);
  }

  const formatMoney = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-beige">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <PieIcon size={24} /> Dashboard Financeiro
          </h2>
          <p className="text-sm text-gray-500">
            Visão geral da saúde financeira do negócio.
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
            className="bg-primary/10 p-2 rounded-lg text-primary hover:bg-primary/20 transition-colors"
            title="Atualizar dados"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Cards KPI - Dados Mensais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={60} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              Receita ({mesAno.split("-")[1]}/{mesAno.split("-")[0]})
            </p>
            <h3 className="text-2xl font-bold text-green-600">
              {loading ? "..." : formatMoney(resumo.receitas)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-green-700 bg-green-50 w-fit px-2 py-1 rounded-full">
            <TrendingUp size={12} /> Entradas do mês
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingDown size={60} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              Despesas ({mesAno.split("-")[1]}/{mesAno.split("-")[0]})
            </p>
            <h3 className="text-2xl font-bold text-red-600">
              {loading ? "..." : formatMoney(resumo.despesas)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-red-700 bg-red-50 w-fit px-2 py-1 rounded-full">
            <TrendingDown size={12} /> Saídas do mês
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between relative overflow-hidden text-white ${resumo.saldo >= 0 ? "bg-primary border-primary" : "bg-red-500 border-red-500"}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={60} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80 mb-1">
              Resultado Líquido
            </p>
            <h3 className="text-2xl font-bold">
              {loading ? "..." : formatMoney(resumo.saldo)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-white/90 bg-white/20 w-fit px-2 py-1 rounded-full">
            <DollarSign size={12} />{" "}
            {resumo.saldo >= 0 ? "Lucro Operacional" : "Prejuízo Operacional"}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calendar size={60} className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              Em Aberto (Mês Atual)
            </p>
            <h3 className="text-2xl font-bold text-orange-500">
              {loading ? "..." : formatMoney(resumo.pendente)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-orange-700 bg-orange-50 w-fit px-2 py-1 rounded-full">
            <Calendar size={12} /> Pendente neste mês
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras - Dados Anuais */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-beige">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Fluxo de Caixa ({mesAno.split("-")[0]})
          </h3>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                Carregando gráfico...
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
                    stroke="#eee"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#888", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#888", fontSize: 12 }}
                    tickFormatter={(val) => `R$${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value) => formatMoney(value)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="Receitas"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="Despesas"
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-beige">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            Despesas ({mesAno.split("-")[1]}/{mesAno.split("-")[0]})
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            Top 5 maiores gastos deste mês
          </p>
          <div className="h-[300px] w-full relative">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                Carregando gráfico...
              </div>
            ) : dadosGraficoPizza.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Sem dados de despesa este mês.
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
