import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import {
  CheckCircle,
  Heart,
  User,
  BookOpen,
  Clock,
  FileText,
  MapPin,
  Smile,
  Briefcase,
} from "lucide-react";

export default function TrabalheConosco() {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const [experiencias, setExperiencias] = useState([]);
  const [turnos, setTurnos] = useState([]);

  const [formData, setFormData] = useState({
    nome_completo: "",
    data_nascimento: "",
    cpf: "",
    cep: "",
    cidade: "",
    bairro: "",
    telefone: "",
    email: "",
    funcao: "Cuidador",
    possui_curso: "Sim",
    instituicao_curso: "",
    possui_coren: "Não",
    tempo_experiencia: "",
    aceita_eventual: "Sim",
    perfil_comportamental: "",
    motivo_trabalho: "",
    possui_mei: "Não",
    docs_em_dia: "Sim",
    declaracao_verdadeira: false,
  });

  const mascaraCPF = (v) =>
    v
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  const mascaraTelefone = (v) =>
    v
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2")
      .slice(0, 15);
  const mascaraCEP = (v) =>
    v
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "declaracao_verdadeira") {
      setFormData({ ...formData, [name]: checked });
      return;
    }
    if (name === "cpf") value = mascaraCPF(value);
    if (name === "telefone") value = mascaraTelefone(value);
    if (name === "cep") value = mascaraCEP(value);

    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxGroup = (item, lista, setLista) => {
    if (lista.includes(item)) {
      setLista(lista.filter((i) => i !== item));
    } else {
      setLista([...lista, item]);
    }
  };

  const buscarCep = async (e) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          cidade: data.localidade,
          bairro: data.bairro,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.declaracao_verdadeira) {
      alert("Você precisa concordar com a declaração final.");
      return;
    }
    setLoading(true);

    try {
      const resumoTexto = `
        NASCIMENTO: ${formData.data_nascimento}
        CPF: ${formData.cpf}
        CURSO: ${formData.possui_curso} (${formData.instituicao_curso})
        COREN: ${formData.possui_coren}
        EXPERIÊNCIA: ${formData.tempo_experiencia}
        ÁREAS: ${experiencias.join(", ")}
        TURNOS: ${turnos.join(", ")}
        PERFIL: ${formData.perfil_comportamental}
        MOTIVO: ${formData.motivo_trabalho}
        MEI: ${formData.possui_mei}
      `;

      const { error } = await supabase.from("candidatos").insert([
        {
          nome_completo: formData.nome_completo,
          email: formData.email,
          telefone: `+55${formData.telefone.replace(/\D/g, "")}`,
          cidade_bairro: `${formData.cidade} - ${formData.bairro}`,
          funcao: formData.funcao,
          resumo_qualificacoes: resumoTexto,
          status: "novo",
        },
      ]);

      if (error) throw error;
      setSucesso(true);
    } catch (error) {
      alert("Erro ao enviar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-lg border border-green-100">
          <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-green-600 fill-green-600" />
          </div>
          <h1 className="text-3xl font-serif text-primary font-bold mb-4">
            Obrigado pelo cadastro!
          </h1>
          <p className="text-gray-600 mb-2 text-lg">
            Sua dedicação em cuidar é o que nos move.
          </p>
          <p className="text-gray-500 text-sm">
            Nossa equipe de RH irá analisar seu perfil com carinho e entraremos
            em contato assim que houver uma oportunidade compatível com sua
            experiência e disponibilidade.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-primary font-bold mb-4">
            Trabalhe Conosco
          </h1>
          <p className="text-xl text-sage font-medium">
            "Vamos cuidar de quem já cuidou de toda uma família"
          </p>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            Se você tem vocação para o cuidado, responsabilidade e carinho,
            preencha o formulário abaixo e faça parte da nossa rede de anjos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="Dados Pessoais" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                name="nome_completo"
                onChange={handleChange}
                required
              />
              <Input
                label="Data de Nascimento"
                name="data_nascimento"
                type="date"
                onChange={handleChange}
                required
              />
              <Input
                label="CPF"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
              />
              <Input
                label="E-mail"
                name="email"
                type="email"
                onChange={handleChange}
                required
              />
              <Input
                label="WhatsApp / Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Input
                label="CEP"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                onBlur={buscarCep}
                required
              />
              <Input
                label="Cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className="bg-gray-50"
              />
              <Input
                label="Bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                className="bg-gray-50"
              />
            </div>
          </Section>
          <Section title="Formação e Qualificação" icon={BookOpen}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Qual sua função principal?</Label>
                <select
                  name="funcao"
                  onChange={handleChange}
                  className="input-field bg-white w-full"
                >
                  <option>Cuidador(a)</option>
                  <option>Técnico de Enfermagem</option>
                  <option>Enfermeiro(a)</option>
                </select>
              </div>
              <div>
                <Label>Instituição do Curso / Ano Conclusão</Label>
                <input
                  name="instituicao_curso"
                  placeholder="Ex: Senac / 2022"
                  onChange={handleChange}
                  className="input-field w-full" // Garante largura total
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <RadioGroup
                label="Possui curso de cuidador?"
                name="possui_curso"
                options={["Sim", "Em andamento", "Não"]}
                onChange={handleChange}
              />
              <RadioGroup
                label="Possui COREN ativo?"
                name="possui_coren"
                options={["Sim", "Não", "Não se aplica"]}
                onChange={handleChange}
              />
            </div>
          </Section>
          <Section title="Experiência Profissional" icon={Briefcase}>
            <Label>Tempo de experiência em Home Care</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                "Menos de 6 meses",
                "6 meses a 1 ano",
                "1 a 3 anos",
                "Mais de 3 anos",
              ].map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-primary"
                >
                  <input
                    type="radio"
                    name="tempo_experiencia"
                    value={opt}
                    onChange={handleChange}
                    className="accent-primary"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>

            <Label>Já atuou com (marque todos que se aplicam):</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                "Idosos",
                "Pacientes Acamados",
                "Pós-operatório",
                "Cuidados Paliativos",
                "Alzheimer / Demência",
                "Crianças / PcD",
              ].map((item) => (
                <label
                  key={item}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    experiencias.includes(item)
                      ? "bg-primary/10 border-primary text-primary font-bold"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    onChange={() =>
                      handleCheckboxGroup(item, experiencias, setExperiencias)
                    }
                    className="accent-primary"
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* 4. DISPONIBILIDADE */}
          <Section title="Disponibilidade" icon={Clock}>
            <Label>Turnos disponíveis para trabalho:</Label>
            <div className="flex flex-wrap gap-4 mb-6">
              {[
                "Diurno (Dia)",
                "Noturno (Noite)",
                "Plantão 12x36",
                "Plantão 24h",
                "Finais de Semana",
              ].map((item) => (
                <label
                  key={item}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    turnos.includes(item)
                      ? "bg-green-50 border-green-500 text-green-700 font-bold"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    onChange={() =>
                      handleCheckboxGroup(item, turnos, setTurnos)
                    }
                    className="accent-green-600"
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
            <RadioGroup
              label="Aceita plantões eventuais (folgas/coberturas)?"
              name="aceita_eventual"
              options={["Sim", "Não"]}
              onChange={handleChange}
            />
          </Section>

          {/* 5. PERFIL */}
          <Section title="Perfil Comportamental" icon={Smile}>
            <div className="space-y-4">
              <div>
                <Label>
                  Como você se descreve? (Ex: paciente, responsável...)
                </Label>
                <textarea
                  name="perfil_comportamental"
                  rows="2"
                  className="input-field"
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>Por que escolheu trabalhar como cuidador(a)?</Label>
                <textarea
                  name="motivo_trabalho"
                  rows="3"
                  className="input-field"
                  onChange={handleChange}
                  placeholder="Conte um pouco da sua história..."
                />
              </div>
            </div>
          </Section>

          {/* 6. DOCUMENTAÇÃO */}
          <Section title="Documentação" icon={FileText}>
            <div className="grid md:grid-cols-2 gap-6">
              <RadioGroup
                label="Possui MEI ou PJ aberto?"
                name="possui_mei"
                options={["Sim", "Não"]}
                onChange={handleChange}
              />
              <RadioGroup
                label="Documentos em dia? (RG, CPF, Vacinas)"
                name="docs_em_dia"
                options={["Sim", "Não"]}
                onChange={handleChange}
              />
            </div>
          </Section>

          {/* 7. DECLARAÇÃO */}
          <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="declaracao_verdadeira"
                onChange={handleChange}
                className="mt-1 w-5 h-5 accent-primary"
              />
              <span className="text-sm text-yellow-900 leading-relaxed">
                Declaro que as informações acima são verdadeiras e estou ciente
                de que este cadastro não garante vínculo imediato, servindo para
                banco de talentos da <strong>Angels of Care</strong>. Autorizo o
                contato via WhatsApp.
              </span>
            </label>
          </div>

          <button
            disabled={loading}
            className="w-full bg-primary hover:bg-[#3A4A3E] text-white font-bold py-5 rounded-xl shadow-lg transition-all text-lg flex justify-center items-center gap-2"
          >
            {loading ? (
              "Enviando Cadastro..."
            ) : (
              <>
                <CheckCircle /> Enviar Meu Cadastro
              </>
            )}
          </button>
        </form>

        <style>{`
          .input-field { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; outline: none; transition: 0.2s; font-size: 0.95rem; }
          .input-field:focus { border-color: #4B5E4F; box-shadow: 0 0 0 3px rgba(75, 94, 79, 0.1); }
        `}</style>
      </div>
    </div>
  );
}

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-beige">
    <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
      <Icon size={24} className="text-sage" /> {title}
    </h3>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div className={props.className}>
    <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">
      {label}
    </label>
    <input className={`input-field ${props.className}`} {...props} />
  </div>
);

const Label = ({ children }) => (
  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
    {children}
  </label>
);

const RadioGroup = ({ label, name, options, onChange }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex gap-4">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt}
            onChange={onChange}
            className="accent-primary w-4 h-4"
            defaultChecked={opt === "Não" || opt === "Não se aplica"}
          />
          <span className="text-sm">{opt}</span>
        </label>
      ))}
    </div>
  </div>
);
