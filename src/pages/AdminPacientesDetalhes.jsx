import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { createClient } from "@supabase/supabase-js";
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
  Paperclip,
  Edit,
  X,
  Lock,
  CheckCircle,
  Save,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function AdminPacientesDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("geral");

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [modalAcessoOpen, setModalAcessoOpen] = useState(false);
  const [emailFamilia, setEmailFamilia] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [criandoAcesso, setCriandoAcesso] = useState(false);

  const [historico, setHistorico] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [sinais, setSinais] = useState([]);
  const [evolucoes, setEvolucoes] = useState([]);
  const [plantoes, setPlantoes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [listaFuncionarios, setListaFuncionarios] = useState([]);
  const [editingPlantaoId, setEditingPlantaoId] = useState(null);
  const [plantaoForm, setPlantaoForm] = useState({
    funcionario: "",
    data: new Date().toISOString().split("T")[0],
    inicio: "07:00",
    fim: "19:00",
    turno: "Diurno",
    extra: false,
  });
  const [editingEvolucaoId, setEditingEvolucaoId] = useState(null);
  const [evolucaoForm, setEvolucaoForm] = useState({
    funcionario_id: "",
    data_registro: new Date()
      .toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
      .split("/")
      .reverse()
      .join("-"),
    turno: "Diurno",
    texto: "",
    diurese: false,
    evacuacao: false,
    aspiracao: false,
    decubito: false,
    higiene: false,
    arquivo_url: null,
  });

  const [expandedMonths, setExpandedMonths] = useState({});
  const [expandedMonthsEscalas, setExpandedMonthsEscalas] = useState({});

  useEffect(() => {
    fetchTudo();
  }, []);

  // --- CORREÇÃO AQUI ---
  // Essa função força o navegador a entender que o dado do banco (13h) é UTC
  // E deve ser exibido como horário do Brasil (10h)
  const formatarDataHoraBrasil = (dataString) => {
    if (!dataString) return "";

    // Se a string não tiver indicador de fuso (Z ou +), adicionamos Z para indicar UTC
    const dataIso =
      dataString.includes("Z") || dataString.includes("+")
        ? dataString
        : dataString + "Z";

    const dataObj = new Date(dataIso);

    if (isNaN(dataObj.getTime())) return dataString; // Fallback se der erro

    return dataObj.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric", // Adicionado o ano pra ficar completo
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  // ---------------------

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
    if (pac.email_responsavel) {
      setEmailFamilia(pac.email_responsavel);
    }

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
          .limit(100),
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

  const evolucoesPorMes = evolucoes.reduce((acc, evo) => {
    // Usar data_registro com a correção para agrupar no mês certo
    const dataIso =
      evo.data_registro.includes("Z") || evo.data_registro.includes("+")
        ? evo.data_registro
        : evo.data_registro + "Z";

    const date = new Date(dataIso);

    // Opcional: Converter para o mês local, caso a virada de mês seja afetada pelo fuso
    const monthKey = date.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      month: "long",
      year: "numeric",
    });

    const monthKeyCapitalized =
      monthKey.charAt(0).toUpperCase() + monthKey.slice(1);

    if (!acc[monthKeyCapitalized]) {
      acc[monthKeyCapitalized] = [];
    }
    acc[monthKeyCapitalized].push(evo);
    return acc;
  }, {});

  const plantoesPorMes = plantoes.reduce((acc, plantao) => {
    const [ano, mes, dia] = plantao.data_plantao.split("-");
    const date = new Date(ano, mes - 1, dia);

    const monthKey = date.toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const capitalized = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);

    if (!acc[capitalized]) acc[capitalized] = [];
    acc[capitalized].push(plantao);
    return acc;
  }, {});
  const toggleMonth = (monthKey) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };
  const toggleMonthEscalas = (monthKey) => {
    setExpandedMonthsEscalas((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  const handleEvolucaoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEvolucaoForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const iniciarEdicaoEvolucao = (item) => {
    const funcEncontrado = listaFuncionarios.find(
      (f) => f.nome_completo === item.profissional_nome,
    );
    const dataSimples = item.data_registro.split("T")[0];
    setEvolucaoForm({
      funcionario_id: funcEncontrado ? funcEncontrado.id : "",
      data_registro: dataSimples,
      turno: item.turno,
      texto: item.texto_evolucao,
      diurese: item.diurese_presente,
      evacuacao: item.evacuacao_presente,
      aspiracao: item.aspiracao_tqt,
      decubito: item.mudanca_decubito,
      higiene: item.higiene_realizada,
      arquivo_url: item.arquivo_url,
    });
    setEditingEvolucaoId(item.id);
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const cancelarEdicaoEvolucao = () => {
    setEditingEvolucaoId(null);
    setEvolucaoForm({
      funcionario_id: "",
      data_registro: new Date()
        .toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
        .split("/")
        .reverse()
        .join("-"),
      turno: "Diurno",
      texto: "",
      diurese: false,
      evacuacao: false,
      aspiracao: false,
      decubito: false,
      higiene: false,
      arquivo_url: null,
    });
  };

  const handleSalvarEvolucao = async (e) => {
    e.preventDefault();
    setUploading(true);
    const dataForm = evolucaoForm.data_registro;

    const agora = new Date();
    const hora = String(agora.getHours()).padStart(2, "0");
    const minuto = String(agora.getMinutes()).padStart(2, "0");
    const segundo = String(agora.getSeconds()).padStart(2, "0");
    const dataParaBanco = `${dataForm} ${hora}:${minuto}:${segundo}`;
    try {
      const funcionarioSelecionado = listaFuncionarios.find(
        (f) => f.id == evolucaoForm.funcionario_id,
      );
      const nomeProfissional = funcionarioSelecionado
        ? funcionarioSelecionado.nome_completo
        : "Admin/Desconhecido";

      const fileInput = e.target.anexo;
      let finalUrl = evolucaoForm.arquivo_url;

      if (fileInput && fileInput.files[0]) {
        const file = fileInput.files[0];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("evolucoes")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("evolucoes")
          .getPublicUrl(filePath);

        finalUrl = urlData.publicUrl;
      }

      const payload = {
        paciente_id: id,
        profissional_nome: nomeProfissional,
        data_registro: dataParaBanco,
        turno: evolucaoForm.turno,
        texto_evolucao: evolucaoForm.texto,
        diurese_presente: evolucaoForm.diurese,
        evacuacao_presente: evolucaoForm.evacuacao,
        aspiracao_tqt: evolucaoForm.aspiracao,
        mudanca_decubito: evolucaoForm.decubito,
        higiene_realizada: evolucaoForm.higiene,
        arquivo_url: finalUrl,
      };

      let data, error;

      if (editingEvolucaoId) {
        const res = await supabase
          .from("evolucoes")
          .update(payload)
          .eq("id", editingEvolucaoId)
          .select();
        data = res.data;
        error = res.error;
      } else {
        const res = await supabase.from("evolucoes").insert([payload]).select();
        data = res.data;
        error = res.error;
      }

      if (error) {
        alert("Erro: " + error.message);
      } else if (data) {
        if (editingEvolucaoId) {
          setEvolucoes(
            evolucoes.map((evo) =>
              evo.id === editingEvolucaoId ? data[0] : evo,
            ),
          );
          alert("Evolução atualizada!");
        } else {
          setEvolucoes([data[0], ...evolucoes]);
          alert("Evolução criada!");
        }
        cancelarEdicaoEvolucao();
        e.target.reset();
      }
    } catch (err) {
      alert("Erro no processo: " + err.message);
    } finally {
      setUploading(false);
    }
  };
  const handlePlantaoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlantaoForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleSalvarPlantao = async (e) => {
    e.preventDefault();

    const payload = {
      paciente_id: id,
      funcionario_id: plantaoForm.funcionario,
      data_plantao: plantaoForm.data,
      horario_inicio: plantaoForm.inicio,
      horario_fim: plantaoForm.fim,
      tipo_turno: plantaoForm.turno,
      status: "agendado",
      is_extra: plantaoForm.extra,
    };

    if (editingPlantaoId) delete payload.status;

    let data, error;

    if (editingPlantaoId) {
      const res = await supabase
        .from("plantoes")
        .update(payload)
        .eq("id", editingPlantaoId)
        .select("*, funcionarios(nome_completo)");
      data = res.data;
      error = res.error;
    } else {
      const res = await supabase
        .from("plantoes")
        .insert([payload])
        .select("*, funcionarios(nome_completo)");
      data = res.data;
      error = res.error;
    }

    if (error) {
      alert("Erro ao salvar plantão: " + error.message);
    } else {
      if (editingPlantaoId) {
        setPlantoes(
          plantoes.map((p) => (p.id === editingPlantaoId ? data[0] : p)),
        );
        alert("Escala atualizada!");
      } else {
        const novaLista = [...plantoes, data[0]].sort(
          (a, b) => new Date(a.data_plantao) - new Date(b.data_plantao),
        );
        setPlantoes(novaLista);
        alert("Plantão agendado!");
      }
      cancelarEdicaoPlantao();
    }
  };
  const iniciarEdicaoPlantao = (plantao) => {
    setPlantaoForm({
      funcionario: plantao.funcionario_id,
      data: plantao.data_plantao,
      inicio: plantao.horario_inicio,
      fim: plantao.horario_fim,
      turno: plantao.tipo_turno,
      extra: plantao.is_extra,
    });
    setEditingPlantaoId(plantao.id);
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const cancelarEdicaoPlantao = () => {
    setEditingPlantaoId(null);
    setPlantaoForm({
      funcionario: "",
      data: new Date().toISOString().split("T")[0],
      inicio: "07:00",
      fim: "19:00",
      turno: "Diurno",
      extra: false,
    });
  };
  const handleCriarAcesso = async (e) => {
    e.preventDefault();
    if (novaSenha.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setCriandoAcesso(true);

    try {
      const tempSupabase = createClient(supabaseUrl, supabaseKey);

      const { data: authData, error: authError } =
        await tempSupabase.auth.signUp({
          email: emailFamilia,
          password: novaSenha,
        });

      if (authError) {
        if (authError.message.includes("already registered")) {
          alert("Este email já tem cadastro. Tentaremos apenas vincular.");
        } else {
          throw authError;
        }
      }

      let userUuid = authData.user?.id;

      if (!userUuid && authError?.message.includes("already registered")) {
        throw new Error(
          "Email já cadastrado! Por segurança, exclua o usuário no menu Authentication para recriar, ou use outro email.",
        );
      }

      if (userUuid) {
        const { error: updateError } = await supabase
          .from("pacientes")
          .update({
            auth_id: userUuid,
            email_responsavel: emailFamilia,
          })
          .eq("id", id);

        if (updateError) throw updateError;

        setPaciente((prev) => ({
          ...prev,
          auth_id: userUuid,
          email_responsavel: emailFamilia,
        }));
        alert(
          `Acesso criado com sucesso!\nLogin: ${emailFamilia}\nSenha: ${novaSenha}`,
        );
        setModalAcessoOpen(false);
      }
    } catch (error) {
      alert("Erro ao criar acesso: " + error.message);
    } finally {
      setCriandoAcesso(false);
    }
  };

  const atualizarPaciente = async (e) => {
    e.preventDefault();
    const form = e.target;

    const updates = {
      nome_paciente: form.nome.value,
      cpf_paciente: form.cpf.value,
      data_nascimento: form.nascimento.value,
      grau_dependencia: form.grau.value,
      diagnostico: form.diagnostico.value,
      cuidados_especificos: form.cuidados.value,
      endereco_completo: form.endereco.value,
      nome_responsavel: form.responsavel.value,
      telefone_responsavel: form.telefone.value,
    };

    const { error } = await supabase
      .from("pacientes")
      .update(updates)
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      setPaciente({ ...paciente, ...updates });
      setEditModalOpen(false);
    }
  };

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
        (a, b) => new Date(a.data_plantao) - new Date(b.data_plantao),
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

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif text-primary font-bold hidden md:block">
              {paciente.nome_paciente}
            </h1>
            <button
              onClick={() => setEditModalOpen(true)}
              className="bg-white hover:bg-gray-100 text-primary p-2 rounded-full shadow border border-beige transition-all"
              title="Editar Dados do Paciente"
            >
              <Edit size={18} />
            </button>
          </div>
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
          <div className="space-y-6">
            <section className="bg-amber-50 rounded-3xl p-6 border border-amber-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-100 p-3 rounded-full text-amber-700">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900 text-lg">
                      Acesso da Família
                    </h3>
                    <p className="text-sm text-amber-800/80">
                      {paciente.auth_id
                        ? `Acesso ativo vinculado a: ${
                            paciente.email_responsavel ||
                            "(Email não registrado)"
                          }`
                        : "A família ainda não possui login para ver o portal."}
                    </p>
                  </div>
                </div>
                {paciente.auth_id ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-amber-200 shadow-sm text-green-700 font-bold">
                      <CheckCircle size={18} /> Acesso Configurado
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            "Tem certeza? Isso vai remover o acesso da família ao portal.",
                          )
                        )
                          return;
                        try {
                          await supabase
                            .from("pacientes")
                            .update({ auth_id: null, email_responsavel: null })
                            .eq("id", id);
                          setPaciente((prev) => ({
                            ...prev,
                            auth_id: null,
                            email_responsavel: null,
                          }));
                          alert(
                            "Acesso removido. Você pode criar um novo agora.",
                          );
                        } catch (err) {
                          alert("Erro ao remover: " + err.message);
                        }
                      }}
                      className="bg-white hover:bg-red-50 text-red-500 p-2 rounded-lg border border-red-100 transition-colors"
                      title="Remover acesso / Redefinir"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailFamilia(paciente.email_responsavel || "");
                      setModalAcessoOpen(true);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-xl shadow transition-all"
                  >
                    Criar Login da Família
                  </button>
                )}
              </div>
            </section>
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
                        "",
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
          </div>
        )}

        {activeTab === "evolucao" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="xl:col-span-1">
              <div
                className={`bg-white rounded-2xl shadow border border-beige p-6 sticky top-6 ${
                  editingEvolucaoId
                    ? "border-amber-400 ring-1 ring-amber-200"
                    : ""
                }`}
              >
                <div className="flex justify-between items-center mb-6 border-b border-beige pb-4">
                  <h3
                    className={`text-lg font-bold flex items-center gap-2 ${
                      editingEvolucaoId ? "text-amber-700" : "text-primary"
                    }`}
                  >
                    {editingEvolucaoId ? (
                      <>
                        <Edit size={20} /> Editando Evolução
                      </>
                    ) : (
                      <>
                        <FileText size={20} /> Nova Evolução
                      </>
                    )}
                  </h3>
                  {editingEvolucaoId && (
                    <button
                      onClick={cancelarEdicaoEvolucao}
                      className="text-xs flex items-center gap-1 bg-white border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-50 text-gray-600"
                    >
                      <X size={14} /> Cancelar
                    </button>
                  )}
                </div>
                <form onSubmit={handleSalvarEvolucao} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Profissional
                      </label>
                      <select
                        name="funcionario_id"
                        value={evolucaoForm.funcionario_id}
                        onChange={handleEvolucaoChange}
                        className="w-full p-2 rounded-lg border bg-gray-50 focus:bg-white transition-colors outline-none focus:border-primary"
                      >
                        <option value="">
                          Selecione (ou deixe auto se for admin)
                        </option>
                        {listaFuncionarios.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nome_completo}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* AQUI ESTA A CORREÇÃO DE EXIBIÇÃO NO FORMULÁRIO */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Data
                      </label>
                      <input
                        type="date"
                        name="data_registro"
                        value={evolucaoForm.data_registro}
                        onChange={handleEvolucaoChange}
                        className="w-full p-2 rounded-lg border bg-gray-50 focus:bg-white transition-colors outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Turno
                      </label>
                      <select
                        name="turno"
                        value={evolucaoForm.turno}
                        onChange={handleEvolucaoChange}
                        className="w-full p-2 rounded-lg border bg-gray-50 focus:bg-white transition-colors outline-none focus:border-primary"
                      >
                        <option>Diurno</option>
                        <option>Noturno</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label-mini mb-1 font-bold text-darkText">
                      Descrição Detalhada
                    </label>
                    <textarea
                      name="texto"
                      value={evolucaoForm.texto}
                      onChange={handleEvolucaoChange}
                      placeholder="Descreva o plantão, intercorrências e observações..."
                      className="w-full p-4 rounded-xl border border-gray-300 text-sm h-96 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none leading-relaxed shadow-inner"
                      required
                    ></textarea>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 border-dashed">
                    <label className="label-mini flex items-center gap-2 mb-2 text-blue-800 font-bold">
                      <Paperclip size={16} />
                      Anexar Documentos / Fotos (múltiplos)
                    </label>
                    <input
                      type="file"
                      name="anexo"
                      accept="image/*, application/pdf"
                      multiple
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors cursor-pointer"
                    />
                    {evolucaoForm.arquivo_urls &&
                      evolucaoForm.arquivo_urls.length > 0 && (
                        <p className="text-xs text-green-600 mt-2">
                          {evolucaoForm.arquivo_urls.length} arquivo(s)
                          atual(is)
                        </p>
                      )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-sage uppercase mb-3 tracking-wider">
                      Procedimentos Realizados:
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { name: "diurese", label: "Diurese" },
                        { name: "evacuacao", label: "Evacuação" },
                        { name: "aspiracao", label: "Aspiração TQT" },
                        { name: "decubito", label: "Mudança Decúbito" },
                        { name: "higiene", label: "Higiene" },
                      ].map((proc) => (
                        <label
                          key={proc.name}
                          className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-primary transition-colors"
                        >
                          <input
                            type="checkbox"
                            name={proc.name}
                            checked={evolucaoForm[proc.name]}
                            onChange={handleEvolucaoChange}
                            className="w-4 h-4 accent-primary rounded cursor-pointer"
                          />
                          <span className="text-sm text-darkText font-medium">
                            {proc.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={uploading}
                    className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 text-base ${
                      editingEvolucaoId
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-primary hover:bg-[#3A4A3E]"
                    }`}
                  >
                    {uploading ? (
                      <span className="animate-pulse">Processando...</span>
                    ) : editingEvolucaoId ? (
                      <>
                        <Save size={20} /> Atualizar Evolução
                      </>
                    ) : (
                      <>
                        <Plus size={20} /> Salvar Evolução no Prontuário
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            <div className="xl:col-span-1 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-darkText">
                  Histórico Recente
                </h3>
                <span className="text-xs font-bold bg-sage/20 text-primary px-3 py-1 rounded-full">
                  {evolucoes.length} registros
                </span>
              </div>

              {Object.keys(evolucoesPorMes).map((monthKey) => {
                const isOpen = expandedMonths[monthKey];
                return (
                  <div
                    key={monthKey}
                    className="border border-beige rounded-xl overflow-hidden bg-white mb-4 shadow-sm"
                  >
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-bold text-primary text-sm flex items-center gap-2">
                        <Calendar size={16} /> {monthKey}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500">
                          {evolucoesPorMes[monthKey].length}
                        </span>
                        {isOpen ? (
                          <ChevronDown size={18} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={18} className="text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-4 space-y-4 bg-gray-50/30">
                        {evolucoesPorMes[monthKey].map((evo) => (
                          <div
                            key={evo.id}
                            className={`bg-white p-5 rounded-xl border relative group hover:shadow-md transition-all ${
                              editingEvolucaoId === evo.id
                                ? "border-amber-400 ring-1 ring-amber-200"
                                : "border-beige"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                                    evo.turno === "Noturno"
                                      ? "bg-indigo-500"
                                      : "bg-orange-400"
                                  }`}
                                >
                                  {evo.turno === "Noturno" ? "N" : "D"}
                                </div>
                                <div>
                                  <span className="block text-sm font-bold text-darkText">
                                    {evo.profissional_nome}
                                  </span>
                                  {/* AQUI ESTÁ A CORREÇÃO DE VISUALIZAÇÃO */}
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    {formatarDataHoraBrasil(evo.data_registro)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-1">
                                <button
                                  onClick={() => iniciarEdicaoEvolucao(evo)}
                                  className="text-gray-300 hover:text-amber-500 hover:bg-amber-50 p-1.5 rounded-full transition-all"
                                  title="Editar registro"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    deletarItem(
                                      "evolucoes",
                                      evo.id,
                                      setEvolucoes,
                                      evolucoes,
                                    )
                                  }
                                  className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all"
                                  title="Excluir registro"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                              <p className="text-darkText/80 text-sm whitespace-pre-wrap leading-relaxed font-sans">
                                {evo.texto_evolucao}
                              </p>
                            </div>

                            <div className="flex flex-col gap-2">
                              {(() => {
                                const urls = (() => {
                                  try {
                                    if (Array.isArray(evo.arquivo_urls))
                                      return evo.arquivo_urls;
                                    if (typeof evo.arquivo_url === "string") {
                                      if (evo.arquivo_url.startsWith("[")) {
                                        return JSON.parse(evo.arquivo_url);
                                      } else {
                                        return [evo.arquivo_url];
                                      }
                                    }
                                    return [];
                                  } catch (e) {
                                    return [];
                                  }
                                })();
                                return urls.map((url, index) => (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:underline text-xs font-bold"
                                  >
                                    <Paperclip size={12} /> Ver Anexo{" "}
                                    {urls.length > 1 ? index + 1 : ""}
                                  </a>
                                ));
                              })()}

                              <div className="flex flex-wrap gap-2 mt-1">
                                {evo.diurese_presente && (
                                  <Tag label="Diurese" color="blue" />
                                )}
                                {evo.evacuacao_presente && (
                                  <Tag label="Evacuação" color="brown" />
                                )}
                                {evo.aspiracao_tqt && (
                                  <Tag label="Aspiração" color="red" />
                                )}
                                {evo.mudanca_decubito && (
                                  <Tag label="Decúbito" color="green" />
                                )}
                                {evo.higiene_realizada && (
                                  <Tag label="Higiene" color="teal" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "escalas" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow border border-beige p-6 sticky top-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Calendar size={20} />
                    {editingPlantaoId ? "Editar Plantão" : "Agendar Plantão"}
                  </h3>
                  {editingPlantaoId && (
                    <button
                      onClick={cancelarEdicaoPlantao}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <form onSubmit={handleSalvarPlantao} className="space-y-4">
                  <div>
                    <label className="label-mini">Funcionário</label>
                    <select
                      name="funcionario"
                      value={plantaoForm.funcionario}
                      onChange={handlePlantaoChange}
                      className="input-mini bg-white"
                      required
                    >
                      <option value="">Selecione...</option>
                      {listaFuncionarios.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome_completo}
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
                        value={plantaoForm.data}
                        onChange={handlePlantaoChange}
                        className="input-mini"
                        required
                      />
                    </div>
                    <div>
                      <label className="label-mini">Turno</label>
                      <select
                        name="turno"
                        value={plantaoForm.turno}
                        onChange={handlePlantaoChange}
                        className="input-mini bg-white"
                      >
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
                        value={plantaoForm.inicio}
                        onChange={handlePlantaoChange}
                        className="input-mini"
                        required
                      />
                    </div>
                    <div>
                      <label className="label-mini">Fim</label>
                      <input
                        type="time"
                        name="fim"
                        value={plantaoForm.fim}
                        onChange={handlePlantaoChange}
                        className="input-mini"
                        required
                      />
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 my-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="extra"
                        checked={plantaoForm.extra}
                        onChange={handlePlantaoChange}
                        className="w-5 h-5 accent-purple-600"
                      />
                      <span className="font-bold text-purple-800 text-sm">
                        Plantão Extra
                      </span>
                    </label>
                  </div>
                  <button
                    className={`w-full text-white font-bold py-3 rounded-xl transition-all shadow-md mt-2 ${editingPlantaoId ? "bg-amber-600 hover:bg-amber-700" : "bg-primary hover:bg-[#3A4A3E]"}`}
                  >
                    {editingPlantaoId
                      ? "Salvar Alterações"
                      : "Confirmar Agenda"}
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

              {Object.keys(plantoesPorMes).map((monthKey) => {
                const isOpen = expandedMonthsEscalas[monthKey];

                return (
                  <div
                    key={monthKey}
                    className="border border-beige rounded-xl overflow-hidden bg-white mb-4 shadow-sm"
                  >
                    <button
                      onClick={() => toggleMonthEscalas(monthKey)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-bold text-primary text-sm flex items-center gap-2">
                        <Calendar size={16} /> {monthKey}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500">
                          {plantoesPorMes[monthKey].length}
                        </span>
                        {isOpen ? (
                          <ChevronDown size={18} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={18} className="text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-4 space-y-3 bg-gray-50/30">
                        {plantoesPorMes[monthKey].map((plantao) => {
                          const [pAno, pMes, pDia] =
                            plantao.data_plantao.split("-");
                          const dataPlantaoObj = new Date(
                            pAno,
                            pMes - 1,
                            pDia,
                            12,
                            0,
                            0,
                          );

                          return (
                            <div
                              key={plantao.id}
                              className="bg-white p-4 rounded-xl shadow-sm border border-beige flex justify-between items-center group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="bg-sage/10 text-primary p-3 rounded-lg text-center min-w-[60px]">
                                  <span className="block text-xs font-bold uppercase">
                                    {dataPlantaoObj
                                      .toLocaleDateString("pt-BR", {
                                        weekday: "short",
                                      })
                                      .replace(".", "")}
                                  </span>
                                  <span className="block text-xl font-bold">
                                    {dataPlantaoObj.getDate()}
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
                                    {plantao.is_extra && (
                                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold text-[10px] uppercase">
                                        Extra
                                      </span>
                                    )}
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
                                      plantoes,
                                    )
                                  }
                                  className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button
                                  onClick={() => iniciarEdicaoPlantao(plantao)}
                                  className="text-gray-300 hover:text-blue-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
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
                              sinais,
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
                          historico,
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
                          medicamentos,
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

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-beige max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <Edit size={20} /> Editar Paciente
              </h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={atualizarPaciente} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-mini">Nome Completo</label>
                  <input
                    name="nome"
                    defaultValue={paciente.nome_paciente}
                    className="input-mini"
                    required
                  />
                </div>
                <div>
                  <label className="label-mini">CPF</label>
                  <input
                    name="cpf"
                    defaultValue={paciente.cpf_paciente}
                    className="input-mini"
                  />
                </div>
                <div>
                  <label className="label-mini">Data de Nascimento</label>
                  <input
                    name="nascimento"
                    type="date"
                    defaultValue={paciente.data_nascimento}
                    className="input-mini"
                  />
                </div>
                <div>
                  <label className="label-mini">Grau de Dependência</label>
                  <select
                    name="grau"
                    defaultValue={paciente.grau_dependencia}
                    className="input-mini bg-white"
                  >
                    <option>Grau I</option>
                    <option>Grau II</option>
                    <option>Grau III</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-mini">Endereço Completo</label>
                <input
                  name="endereco"
                  defaultValue={paciente.endereco_completo}
                  className="input-mini"
                  required
                />
              </div>

              <div>
                <label className="label-mini">Diagnóstico Principal</label>
                <input
                  name="diagnostico"
                  defaultValue={paciente.diagnostico}
                  className="input-mini"
                />
              </div>

              <div>
                <label className="label-mini">Cuidados Específicos</label>
                <textarea
                  name="cuidados"
                  defaultValue={paciente.cuidados_especificos}
                  className="input-mini h-24 resize-none"
                />
              </div>

              <div className="bg-sage/5 p-4 rounded-xl space-y-3 border border-sage/20">
                <h4 className="font-bold text-sage text-xs uppercase">
                  Contato do Responsável
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label-mini">Nome do Responsável</label>
                    <input
                      name="responsavel"
                      defaultValue={paciente.nome_responsavel}
                      className="input-mini"
                    />
                  </div>
                  <div>
                    <label className="label-mini">Telefone (WhatsApp)</label>
                    <input
                      name="telefone"
                      defaultValue={paciente.telefone_responsavel}
                      className="input-mini"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button className="flex-1 py-3 font-bold bg-primary text-white rounded-xl shadow-md hover:bg-[#3A4A3E] transition-all">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalAcessoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-amber-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-amber-900">
                Acesso da Família
              </h3>
              <button onClick={() => setModalAcessoOpen(false)}>
                <X size={24} className="text-gray-400 hover:text-red-500" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Crie um login para que a família possa acessar o{" "}
                <strong>Portal do Cliente</strong> e acompanhar as evoluções.
              </p>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Email de Login
                </label>
                <input
                  type="email"
                  value={emailFamilia}
                  onChange={(e) => setEmailFamilia(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:border-amber-500 outline-none"
                  placeholder="ex: familia@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Senha Provisória
                </label>
                <input
                  type="text"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:border-amber-500 outline-none text-center font-mono tracking-widest"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <button
                onClick={handleCriarAcesso}
                disabled={criandoAcesso}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-md transition-all mt-2"
              >
                {criandoAcesso
                  ? "Criando e Vinculando..."
                  : "Confirmar e Criar Acesso"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input-mini { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 0.9rem; outline: none; }
        .input-mini:focus { border-color: #4B5E4F; }
        .label-mini { font-size: 0.7rem; font-weight: bold; color: #4B5E4F; display: block; margin-bottom: 4px; }
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
