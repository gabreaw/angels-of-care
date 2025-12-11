import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle,
  Calendar,
  Filter,
} from "lucide-react";

export default function AdminConfirmacaoEscala() {
  const [loading, setLoading] = useState(false);
  const [semanaInicio, setSemanaInicio] = useState("");
  const [listaAgrupada, setListaAgrupada] = useState([]);

  useEffect(() => {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const domingo = new Date(hoje);
    domingo.setDate(hoje.getDate() - diaSemana);
    setSemanaInicio(domingo.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (semanaInicio) fetchEscalasDaSemana();
  }, [semanaInicio]);

  async function fetchEscalasDaSemana() {
    setLoading(true);

    const inicio = new Date(semanaInicio);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);

    const inicioStr = inicio.toISOString().split("T")[0];
    const fimStr = fim.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("plantoes")
      .select(
        `
        id,
        data_plantao,
        horario_inicio,
        horario_fim,
        is_extra,
        aceite_prestador,
        funcionarios!inner (id, nome_completo, telefone, cnpj)
      `
      )
      .gte("data_plantao", inicioStr)
      .lte("data_plantao", fimStr)
      .order("data_plantao");

    if (error) {
      console.error(error);
    } else {
      agruparPorFuncionario(data);
    }
    setLoading(false);
  }

  const agruparPorFuncionario = (plantoes) => {
    const grupos = {};

    plantoes.forEach((p) => {
      const funcId = p.funcionarios.id;
      if (!grupos[funcId]) {
        grupos[funcId] = {
          funcionario: p.funcionarios,
          plantoes: [],
          todosConfirmados: true,
        };
      }
      grupos[funcId].plantoes.push(p);
      if (!p.aceite_prestador) grupos[funcId].todosConfirmados = false;
    });

    setListaAgrupada(Object.values(grupos));
  };

  // --- GERADOR DE TEXTO OTIMIZADO ---
  const gerarLinkWhatsApp = (item) => {
    const { funcionario, plantoes } = item;

    const inicio = new Date(semanaInicio);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    const fmtData = (d) => d.toLocaleDateString("pt-BR");

    // Criamos um Array de linhas para garantir a quebra correta
    let linhas = [];

    // Cabeçalho
    linhas.push(
      `Olá *${
        funcionario.nome_completo.split(" ")[0]
      }*, inscrito no CNPJ sob o nº ${funcionario.cnpj || "______________"}`
    );
    linhas.push(""); // Linha em branco
    linhas.push(
      `Segue a escala Distribuição de Prestação de Serviços de trabalho para a semana de *${fmtData(
        inicio
      )} a ${fmtData(fim)}*.`
    );
    linhas.push(
      `Por favor, confirme sua aceitação até dia ${fmtData(
        inicio
      )} ou informe qualquer ajuste necessário.`
    );
    linhas.push(""); // Linha em branco

    // Lista de Plantões
    plantoes.forEach((p) => {
      // Ajuste de fuso horário para garantir o dia certo
      const dataPartes = p.data_plantao.split("-"); // YYYY-MM-DD
      // Cria data sem hora para não sofrer com fuso -3h
      const dataP = new Date(dataPartes[0], dataPartes[1] - 1, dataPartes[2]);

      const diaStr = dataP.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const horaIni = p.horario_inicio.slice(0, 5);
      const horaFim = p.horario_fim.slice(0, 5);
      const extraTag = p.is_extra ? " *(Extra)*" : "";

      linhas.push(`🗓 Dia ${diaStr}:   ${horaIni} as ${horaFim}  ${extraTag}`);
    });

    // Rodapé
    linhas.push(""); // Linha em branco
    linhas.push(
      `Sua colaboração é essencial para o bom funcionamento da equipe. Agradeço desde já!`
    );
    linhas.push("");
    linhas.push(`Atenciosamente,`);
    linhas.push(`*Fabiana Adolf Worm*`);
    linhas.push(`Enf. Resp. Técnica`);
    linhas.push(`Coren SC 408648`);

    // Junta tudo com o código oficial de Quebra de Linha (%0A)
    const textoFinal = linhas.join("\n");
    const textoCodificado = encodeURIComponent(textoFinal);

    // --- MODO DE TESTE ATIVADO ---
    const numeroTeste = "5549991234926"; // SEU NÚMERO AQUI
    // const numeroReal = funcionario.telefone.replace(/\D/g, '');

    // Usa a API completa que força a abertura do texto
    return `https://api.whatsapp.com/send?phone=${numeroTeste}&text=${textoCodificado}`;
  };

  const marcarComoConfirmado = async (plantoesIds) => {
    const { error } = await supabase
      .from("plantoes")
      .update({ aceite_prestador: true })
      .in("id", plantoesIds);

    if (!error) {
      fetchEscalasDaSemana();
    } else {
      alert("Erro ao confirmar: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/escalas" className="text-sage hover:text-primary">
              <ArrowLeft />
            </Link>
            <div>
              <h1 className="text-3xl font-serif text-primary font-bold">
                Disparo de Escalas
              </h1>
              <p className="text-darkText/60">
                Envie a agenda semanal e registre o aceite.
              </p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl shadow-sm border border-beige flex items-center gap-3">
            <Calendar className="text-sage" size={20} />
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-sage uppercase">
                Início da Semana (Domingo)
              </label>
              <input
                type="date"
                value={semanaInicio}
                onChange={(e) => setSemanaInicio(e.target.value)}
                className="font-bold text-primary outline-none"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-12 text-sage">
            Calculando mensagens...
          </div>
        ) : listaAgrupada.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-dashed text-darkText/50">
            Nenhum plantão encontrado nesta semana para enviar.
          </div>
        ) : (
          <div className="grid gap-6">
            {listaAgrupada.map((item, idx) => (
              <div
                key={idx}
                className={`bg-white p-6 rounded-2xl shadow-sm border border-beige flex flex-col md:flex-row justify-between gap-6 ${
                  item.todosConfirmados ? "opacity-60 bg-green-50/30" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg text-primary">
                      {item.funcionario.nome_completo}
                    </h3>
                    {item.todosConfirmados && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> Confirmado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-darkText/60 mb-3">
                    {item.plantoes.length} plantões nesta semana
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {item.plantoes.map((p) => (
                      <span
                        key={p.id}
                        className={`text-xs px-2 py-1 rounded border ${
                          p.is_extra
                            ? "bg-purple-100 border-purple-200 text-purple-700"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        {new Date(
                          p.data_plantao + "T00:00:00"
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                        {p.is_extra && "*"}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 justify-center min-w-[200px]">
                  <a
                    href={gerarLinkWhatsApp(item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <MessageCircle size={20} />
                    Enviar WhatsApp
                  </a>

                  {!item.todosConfirmados && (
                    <button
                      onClick={() =>
                        marcarComoConfirmado(item.plantoes.map((p) => p.id))
                      }
                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      <CheckCircle size={16} />
                      Marcar Aceite ("Ok")
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
