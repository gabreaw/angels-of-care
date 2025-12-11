import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Activity,
  Pill,
  FileText,
  Plus,
  Trash2,
  ClipboardList,
  CheckSquare,
  Calendar,
  Clock,
} from "lucide-react";

export default function AdminPacientesDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("geral");

  const [historico, setHistorico] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [sinais, setSinais] = useState([]);
  const [evolucoes, setEvolucoes] = useState([]);
  const [plantoes, setPlantoes] = useState([]);

  const [listaFuncionarios, setListaFuncionarios] = useState([]);

  useEffect(() => {
    fetchTudo();
  }, []);

  async function fetchTudo() {
    setLoading(true);

    const { data: pac, error: errPac } = await supabase
      .from("pacientes")
      .select("*")
      .eq("id", id)
      .single();
    if (errPac) {
      alert("Erro ao buscar paciente");
      navigate("/admin/pacientes");
      return;
    }
    setPaciente(pac);

    const [histRes, medRes, sinaisRes, evoRes, plantoesRes, funcRes] =
      await Promise.all([
        supabase
          .from("historico_clinico")
          .select("*")
          .eq("paciente_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("medicamentos")
          .select("*")
          .eq("paciente_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("sinais_vitais")
          .select("*")
          .eq("paciente_id", id)
          .order("data_afericao", { ascending: false })
          .limit(20),
        supabase
          .from("evolucoes")
          .select("*")
          .eq("paciente_id", id)
          .order("data_registro", { ascending: false })
          .limit(10),
        supabase
          .from("plantoes")
          .select("*, funcionarios(nome_completo)")
          .eq("paciente_id", id)
          .order("data_plantao", { ascending: true }),
        supabase
          .from("funcionarios")
          .select("id, nome_completo")
          .eq("status", "ativo")
          .order("nome_completo"),
      ]);

    setHistorico(histRes.data || []);
    setMedicamentos(medRes.data || []);
    setSinais(sinaisRes.data || []);
    setEvolucoes(evoRes.data || []);
    setPlantoes(plantoesRes.data || []);
    setListaFuncionarios(funcRes.data || []);

    setLoading(false);
  }

  const addHistorico = async (e) => {
    e.preventDefault();
    const form = e.target;
    const novo = {
      paciente_id: id,
      categoria: form.categoria.value,
      descricao: form.descricao.value,
      observacoes: form.observacoes.value,
    };
    const { data } = await supabase
      .from("historico_clinico")
      .insert([novo])
      .select();
    if (data) {
      setHistorico([data[0], ...historico]);
      form.reset();
    }
  };

  const addMedicamento = async (e) => {
    e.preventDefault();
    const form = e.target;
    const novo = {
      paciente_id: id,
      nome_medicamento: form.nome.value,
      dosagem: form.dosagem.value,
      frequencia: form.frequencia.value,
      via_administracao: form.via.value,
    };
    const { data } = await supabase
      .from("medicamentos")
      .insert([novo])
      .select();
    if (data) {
      setMedicamentos([data[0], ...medicamentos]);
      form.reset();
    }
  };

  const addSinais = async (e) => {
    e.preventDefault();
    const form = e.target;
    const toNum = (val) => (val ? parseFloat(val) : null);
    const toInt = (val) => (val ? parseInt(val, 10) : null);
    const novo = {
      paciente_id: id,
      pressao_arterial: form.pressao.value || null,
      frequencia_cardiaca: toInt(form.bpm.value),
      temperatura: toNum(form.temp.value),
      glicemia: toInt(form.glicemia.value),
      saturacao_o2: toInt(form.saturacao.value),
    };
    const { data } = await supabase
      .from("sinais_vitais")
      .insert([novo])
      .select();
    if (data) {
      setSinais([data[0], ...sinais]);
      form.reset();
    }
  };

  const addEvolucao = async (e) => {
    e.preventDefault();
    const form = e.target;
    const novo = {
      paciente_id: id,
      profissional_nome: form.profissional.value,
      turno: form.turno.value,
      texto_evolucao: form.texto.value,
      diurese_presente: form.diurese.checked,
      evacuacao_presente: form.evacuacao.checked,
      aspiracao_tqt: form.aspiracao.checked,
      mudanca_decubito: form.decubito.checked,
      higiene_realizada: form.higiene.checked,
    };
    const { data } = await supabase.from("evolucoes").insert([novo]).select();
    if (data) {
      setEvolucoes([data[0], ...evolucoes]);
      form.reset();
    }
  };
  const addPlantao = async (e) => {
    e.preventDefault();
    const form = e.target;

    const novo = {
      paciente_id: id,
      funcionario_id: form.funcionario.value,
      data_plantao: form.data.value,
      horario_inicio: form.inicio.value,
      horario_fim: form.fim.value,
      tipo_turno: form.turno.value,
      status: "agendado",
      is_extra: form.extra.checked,
    };

    const { data, error } = await supabase
      .from("plantoes")
      .insert([novo])
      .select("*, funcionarios(nome_completo)");

    if (error) {
      alert("Erro ao agendar: " + error.message);
    } else {
      const novaLista = [...plantoes, data[0]].sort(
        (a, b) => new Date(a.data_plantao) - new Date(b.data_plantao)
      );
      setPlantoes(novaLista);
      form.reset();
    }
  };

  const deletarItem = async (tabela, itemId, setLista, listaAtual) => {
    if (!window.confirm("Deletar item?")) return;
    const { error } = await supabase.from(tabela).delete().eq("id", itemId);
    if (!error) setLista(listaAtual.filter((i) => i.id !== itemId));
  };

  if (loading)
    return (
      <div className="p-8 text-center text-sage">Carregando prontuário...</div>
    );
  if (!paciente) return null;

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/admin/pacientes"
            className="flex items-center gap-2 text-sage hover:text-primary transition-colors"
          >
            <ArrowLeft size={20} /> Voltar
          </Link>
          <h1 className="text-2xl font-serif text-primary font-bold hidden md:block">
            {paciente.nome_paciente}
          </h1>
        </div>

        <div className="flex gap-2 border-b border-beige mb-6 overflow-x-auto pb-1">
          <TabButton
            active={activeTab === "geral"}
            onClick={() => setActiveTab("geral")}
            icon={User}
            label="Geral"
          />
          <TabButton
            active={activeTab === "escalas"}
            onClick={() => setActiveTab("escalas")}
            icon={Calendar}
            label="Escalas"
          />
          <TabButton
            active={activeTab === "evolucao"}
            onClick={() => setActiveTab("evolucao")}
            icon={ClipboardList}
            label="Evolução"
          />
          <TabButton
            active={activeTab === "sinais"}
            onClick={() => setActiveTab("sinais")}
            icon={Activity}
            label="Sinais Vitais"
          />
          <TabButton
            active={activeTab === "prontuario"}
            onClick={() => setActiveTab("prontuario")}
            icon={Pill}
            label="Medicamentos"
          />
        </div>
        {activeTab === "geral" && (
          <div className="bg-white rounded-3xl shadow-lg border border-beige overflow-hidden p-8 grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <User className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">
                    Dados Pessoais
                  </h3>
                  <p className="text-sm text-darkText/80">
                    CPF: {paciente.cpf_paciente}
                  </p>
                  <p className="text-sm text-darkText/80">
                    Nascimento: {paciente.data_nascimento}
                  </p>
                  <span className="mt-2 inline-block text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
                    {paciente.grau_dependencia}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-yellow-50 p-2 rounded-lg">
                  <Activity className="text-yellow-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">
                    Diagnóstico & Cuidados
                  </h3>
                  <p className="text-darkText font-bold">
                    {paciente.diagnostico}
                  </p>
                  <p className="text-sm text-darkText/70 mt-2 bg-paper p-3 rounded-lg border border-beige">
                    {paciente.cuidados_especificos || "Sem observações."}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-50 p-2 rounded-lg">
                  <MapPin className="text-green-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">Endereço</h3>
                  <p className="text-sm text-darkText/80">
                    {paciente.endereco_completo}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-50 p-2 rounded-lg">
                  <Phone className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">Responsável</h3>
                  <p className="text-darkText font-bold">
                    {paciente.nome_responsavel}
                  </p>
                  <a
                    href={`https://wa.me/${paciente.telefone_responsavel?.replace(
                      /\D/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-600 text-sm font-bold hover:underline"
                  >
                    {paciente.telefone_responsavel} ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "escalas" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow border border-beige p-6 sticky top-6">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <Calendar size={20} /> Agendar Plantão
                </h3>

                <form onSubmit={addPlantao} className="space-y-4">
                  <div>
                    <label className="label-mini">Funcionário</label>
                    <select
                      name="funcionario"
                      className="input-mini bg-white"
                      required
                    >
                      <option value="">Selecione...</option>
                      {listaFuncionarios.map((func) => (
                        <option key={func.id} value={func.id}>
                          {func.nome_completo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label-mini">Data</label>
                      <input
                        type="date"
                        name="data"
                        className="input-mini"
                        required
                      />
                    </div>
                    <div>
                      <label className="label-mini">Turno</label>
                      <select name="turno" className="input-mini bg-white">
                        <option>Diurno</option>
                        <option>Noturno</option>
                        <option>24h</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label-mini">Início</label>
                      <input
                        type="time"
                        name="inicio"
                        className="input-mini"
                        required
                        defaultValue="07:00"
                      />
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 my-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="extra"
                          className="w-5 h-5 accent-purple-600"
                        />
                        <div>
                          <span className="font-bold text-purple-800 text-sm">
                            Plantão Extra (Pagamento Diário)
                          </span>
                          <p className="text-[10px] text-purple-600 leading-tight">
                            Marque se este plantão deve ser pago logo após
                            realizado.
                          </p>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="label-mini">Fim</label>
                      <input
                        type="time"
                        name="fim"
                        className="input-mini"
                        required
                        defaultValue="19:00"
                      />
                    </div>
                  </div>

                  <button className="w-full bg-primary hover:bg-[#3A4A3E] text-white font-bold py-3 rounded-xl transition-all shadow-md mt-2">
                    Confirmar Agenda
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {plantoes.length === 0 && (
                <div className="text-center p-8 text-darkText/50 bg-white rounded-2xl border border-dashed">
                  Nenhum plantão agendado para este paciente.
                </div>
              )}

              {plantoes.map((plantao) => (
                <div
                  key={plantao.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-beige flex justify-between items-center group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-sage/10 text-primary p-3 rounded-lg text-center min-w-[60px]">
                      <span className="block text-xs font-bold uppercase">
                        {new Date(plantao.data_plantao)
                          .toLocaleDateString("pt-BR", { weekday: "short" })
                          .replace(".", "")}
                      </span>
                      <span className="block text-xl font-bold">
                        {new Date(plantao.data_plantao).getDate()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-darkText">
                        {plantao.funcionarios?.nome_completo ||
                          "Sem funcionário"}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-darkText/60 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                            plantao.tipo_turno === "Noturno"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {plantao.tipo_turno}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />{" "}
                          {plantao.horario_inicio.slice(0, 5)} -{" "}
                          {plantao.horario_fim.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                        plantao.status === "agendado"
                          ? "border-blue-200 text-blue-600 bg-blue-50"
                          : plantao.status === "realizado"
                          ? "border-green-200 text-green-600 bg-green-50"
                          : "border-gray-200 text-gray-400"
                      }`}
                    >
                      {plantao.status}
                    </span>
                    <button
                      onClick={() =>
                        deletarItem(
                          "plantoes",
                          plantao.id,
                          setPlantoes,
                          plantoes
                        )
                      }
                      className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "evolucao" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow border border-beige p-6 sticky top-6">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <FileText size={20} /> Nova Evolução
                </h3>
                <form onSubmit={addEvolucao} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="profissional"
                      placeholder="Profissional"
                      className="input-mini"
                      required
                    />
                    <select name="turno" className="input-mini bg-white">
                      <option>Diurno</option>
                      <option>Noturno</option>
                    </select>
                  </div>
                  <textarea
                    name="texto"
                    placeholder="Descreva o plantão..."
                    className="w-full p-3 rounded-lg border border-gray-300 text-sm h-32 focus:border-primary outline-none resize-none"
                    required
                  ></textarea>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="text-xs font-bold text-sage uppercase mb-2">
                      Procedimentos:
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="diurese"
                        className="accent-primary"
                      />{" "}
                      Diurese
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="evacuacao"
                        className="accent-primary"
                      />{" "}
                      Evacuação
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="aspiracao"
                        className="accent-primary"
                      />{" "}
                      Aspiração TQT
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="decubito"
                        className="accent-primary"
                      />{" "}
                      Mudança Decúbito
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="higiene"
                        className="accent-primary"
                      />{" "}
                      Higiene
                    </label>
                  </div>
                  <button className="w-full bg-primary hover:bg-[#3A4A3E] text-white font-bold py-3 rounded-xl transition-all shadow-md">
                    Salvar Evolução
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {evolucoes.map((evo) => (
                <div
                  key={evo.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-beige relative group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          evo.turno === "Noturno"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {evo.turno}
                      </span>
                      <span className="text-sm font-bold text-darkText">
                        {evo.profissional_nome}
                      </span>
                    </div>
                    <span className="text-xs text-darkText/50">
                      {new Date(evo.data_registro).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-darkText/80 text-sm whitespace-pre-wrap leading-relaxed mb-4">
                    {evo.texto_evolucao}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {evo.diurese_presente && (
                      <Tag label="Diurese" color="blue" />
                    )}
                    {evo.evacuacao_presente && (
                      <Tag label="Evacuação" color="brown" />
                    )}
                    {evo.aspiracao_tqt && <Tag label="Aspiração" color="red" />}
                    {evo.mudanca_decubito && (
                      <Tag label="Decúbito" color="green" />
                    )}
                    {evo.higiene_realizada && (
                      <Tag label="Higiene" color="teal" />
                    )}
                  </div>
                  <button
                    onClick={() =>
                      deletarItem("evolucoes", evo.id, setEvolucoes, evolucoes)
                    }
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "sinais" && (
          <div className="bg-white rounded-2xl shadow border border-beige p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Activity size={20} /> Evolução Diária
              </h3>
              <form
                onSubmit={addSinais}
                className="flex flex-wrap gap-2 items-end bg-sage/5 p-3 rounded-xl border border-sage/20"
              >
                <div className="w-20">
                  <label className="label-mini">PA</label>
                  <input
                    name="pressao"
                    placeholder="12/8"
                    className="input-mini"
                  />
                </div>
                <div className="w-16">
                  <label className="label-mini">Temp</label>
                  <input
                    name="temp"
                    placeholder="36.5"
                    className="input-mini"
                  />
                </div>
                <div className="w-16">
                  <label className="label-mini">BPM</label>
                  <input name="bpm" placeholder="80" className="input-mini" />
                </div>
                <div className="w-16">
                  <label className="label-mini">O2 %</label>
                  <input
                    name="saturacao"
                    placeholder="98"
                    className="input-mini"
                  />
                </div>
                <div className="w-16">
                  <label className="label-mini">Glic.</label>
                  <input
                    name="glicemia"
                    placeholder="100"
                    className="input-mini"
                  />
                </div>
                <button className="btn-mini bg-primary text-white h-8 mt-4">
                  <Plus size={16} />
                </button>
              </form>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-sage/10 text-primary font-bold">
                  <tr>
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3">Pressão</th>
                    <th className="p-3">Temp</th>
                    <th className="p-3">BPM</th>
                    <th className="p-3">Saturação</th>
                    <th className="p-3">Glicemia</th>
                    <th className="p-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige">
                  {sinais.map((item) => (
                    <tr key={item.id} className="hover:bg-paper">
                      <td className="p-3 font-mono text-xs">
                        {new Date(item.data_afericao).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-3 font-bold">
                        {item.pressao_arterial || "-"}
                      </td>
                      <td className="p-3">
                        {item.temperatura ? `${item.temperatura}°C` : "-"}
                      </td>
                      <td className="p-3">
                        {item.frequencia_cardiaca
                          ? `${item.frequencia_cardiaca} bpm`
                          : "-"}
                      </td>
                      <td className="p-3">
                        {item.saturacao_o2 ? `${item.saturacao_o2}%` : "-"}
                      </td>
                      <td className="p-3">
                        {item.glicemia ? `${item.glicemia} mg/dL` : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() =>
                            deletarItem(
                              "sinais_vitais",
                              item.id,
                              setSinais,
                              sinais
                            )
                          }
                          className="text-red-300 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "prontuario" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow border border-beige p-6">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <FileText size={20} /> Histórico & Alergias
              </h3>
              <form
                onSubmit={addHistorico}
                className="bg-sage/10 p-4 rounded-xl mb-6 space-y-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <select name="categoria" className="input-mini bg-white">
                    <option>Doença Crônica</option>
                    <option>Alergia</option>
                    <option>Cirurgia</option>
                    <option>Internação</option>
                  </select>
                  <input
                    name="descricao"
                    placeholder="Descrição"
                    required
                    className="input-mini"
                  />
                </div>
                <input
                  name="observacoes"
                  placeholder="Obs"
                  className="input-mini w-full"
                />
                <button className="btn-mini w-full bg-primary text-white">
                  Adicionar Histórico
                </button>
              </form>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {historico.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start p-3 bg-paper rounded-lg border border-beige/50 text-sm"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase text-sage">
                        {item.categoria}
                      </span>
                      <p className="font-bold text-darkText">
                        {item.descricao}
                      </p>
                      {item.observacoes && (
                        <p className="text-xs text-darkText/60">
                          {item.observacoes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        deletarItem(
                          "historico_clinico",
                          item.id,
                          setHistorico,
                          historico
                        )
                      }
                      className="text-red-300 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow border border-beige p-6">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <Pill size={20} /> Medicamentos
              </h3>
              <form
                onSubmit={addMedicamento}
                className="bg-blue-50 p-4 rounded-xl mb-6 space-y-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="nome"
                    placeholder="Nome"
                    required
                    className="input-mini"
                  />
                  <input
                    name="dosagem"
                    placeholder="Dose"
                    required
                    className="input-mini"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="frequencia"
                    placeholder="Freq"
                    required
                    className="input-mini"
                  />
                  <select name="via" className="input-mini bg-white">
                    <option>Oral</option>
                    <option>Sublingual</option>
                    <option>Injetável</option>
                    <option>Sonda</option>
                  </select>
                </div>
                <button className="btn-mini w-full bg-blue-600 text-white">
                  Adicionar Medicamento
                </button>
              </form>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {medicamentos.map((med) => (
                  <div
                    key={med.id}
                    className="flex justify-between items-center p-3 bg-paper rounded-lg border border-beige/50 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <Pill size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-darkText">
                          {med.nome_medicamento}{" "}
                          <span className="text-xs font-normal text-darkText/60">
                            ({med.dosagem})
                          </span>
                        </p>
                        <p className="text-xs text-sage">
                          {med.frequencia} • {med.via_administracao}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        deletarItem(
                          "medicamentos",
                          med.id,
                          setMedicamentos,
                          medicamentos
                        )
                      }
                      className="text-red-300 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .input-mini { width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #ddd; font-size: 0.85rem; outline: none; }
        .input-mini:focus { border-color: #4B5E4F; }
        .label-mini { font-size: 0.65rem; font-weight: bold; color: #4B5E4F; display: block; margin-bottom: 2px; }
        .btn-mini { padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: bold; transition: all 0.2s; }
        .btn-mini:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all whitespace-nowrap border-b-2 ${
        active
          ? "border-primary text-primary bg-sage/10 rounded-t-lg"
          : "border-transparent text-sage hover:text-primary hover:bg-paper"
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );
}

function Tag({ label, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    brown: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    teal: "bg-teal-100 text-teal-700",
  };
  return (
    <span
      className={`px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${colors[color]}`}
    >
      <CheckSquare size={10} /> {label}
    </span>
  );
}
