import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  MapPin,
  User,
  Stethoscope,
  Phone,
} from "lucide-react";

export default function AdminPacientesNovo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const [formData, setFormData] = useState({
    nome_paciente: "",
    data_nascimento: "",
    cpf_paciente: "",
    sexo: "Feminino",

    diagnostico: "", 
    grau_dependencia: "Grau 1",
    cuidados_especificos: "", 

    nome_responsavel: "",
    telefone_responsavel: "",
    parentesco: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "Chapecó",
    estado: "SC",
    complemento: "",
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
    let { name, value } = e.target;
    if (name === "cpf_paciente") value = mascaraCPF(value);
    if (name === "telefone_responsavel") value = mascaraTelefone(value);
    if (name === "cep") value = mascaraCEP(value);
    setFormData({ ...formData, [name]: value });
  };

  const buscarCep = async (e) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
          cep: e.target.value,
        }));
        document.getElementById("numeroInput").focus();
      } else {
        alert("CEP não encontrado!");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Endereço completo para leitura rápida
    const enderecoFormatado = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade}/${formData.estado} (${formData.cep})`;

    const dadosFinais = {
      ...formData,
      endereco_completo: enderecoFormatado,
      // Limpa formatação para salvar
      telefone_responsavel: `+55${formData.telefone_responsavel.replace(
        /\D/g,
        ""
      )}`,
      cpf_paciente: formData.cpf_paciente.replace(/\D/g, ""),
      cep: formData.cep.replace(/\D/g, ""),
    };

    const { error } = await supabase.from("pacientes").insert([dadosFinais]);

    setLoading(false);

    if (error) {
      alert("Erro ao cadastrar: " + error.message);
    } else {
      alert("Paciente cadastrado com sucesso!");
      navigate("/admin/pacientes"); // Volta para a lista
    }
  };

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-primary font-bold">
            Novo Paciente
          </h1>
          <Link
            to="/admin/pacientes"
            className="flex items-center gap-2 text-sage hover:text-primary"
          >
            <ArrowLeft size={20} /> Cancelar
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-beige p-8 space-y-8"
        >
          {/* 1. DADOS DO PACIENTE */}
          <section>
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <User size={20} /> Quem será cuidado?
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="nome_paciente"
                placeholder="Nome do Paciente"
                onChange={handleChange}
                required
                className="input-padrao"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="data_nascimento"
                  type="date"
                  title="Data de Nascimento"
                  onChange={handleChange}
                  required
                  className="input-padrao text-darkText/70"
                />
                <select
                  name="sexo"
                  onChange={handleChange}
                  className="input-padrao bg-white"
                >
                  <option>Feminino</option>
                  <option>Masculino</option>
                </select>
              </div>
              <input
                name="cpf_paciente"
                value={formData.cpf_paciente}
                placeholder="CPF do Paciente"
                onChange={handleChange}
                className="input-padrao"
              />
            </div>
          </section>

          {/* 2. DADOS CLÍNICOS BÁSICOS */}
          <section className="bg-red-50/50 p-6 rounded-xl border border-red-100">
            <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
              <Stethoscope size={20} /> Perfil Clínico
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="diagnostico"
                placeholder="Diagnóstico Principal (Ex: Alzheimer, AVC)"
                onChange={handleChange}
                required
                className="input-padrao"
              />

              <select
                name="grau_dependencia"
                onChange={handleChange}
                className="input-padrao bg-white"
              >
                <option value="Grau 1">
                  Grau 1 (Independente, requer acompanhamento)
                </option>
                <option value="Grau 2">Grau 2 (Dependência parcial)</option>
                <option value="Grau 3">Grau 3 (Dependência total)</option>
              </select>

              <textarea
                name="cuidados_especificos"
                placeholder="Detalhes importantes: Usa fralda? Sonda? Acamado? Tem alergia?"
                onChange={handleChange}
                className="input-padrao md:col-span-2 h-24"
              />
            </div>
          </section>

          {/* 3. LOCAL DO ATENDIMENTO */}
          <section className="bg-sage/5 p-6 rounded-xl border border-sage/20">
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <MapPin size={20} /> Local do Atendimento
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-1 relative">
                <label className="text-xs font-bold text-sage ml-1">CEP</label>
                <input
                  name="cep"
                  value={formData.cep}
                  placeholder="00000-000"
                  onChange={handleChange}
                  onBlur={buscarCep}
                  required
                  className="input-padrao"
                />
                {loadingCep && (
                  <span className="absolute right-3 top-9 text-xs text-primary animate-pulse">
                    ...
                  </span>
                )}
              </div>
              <div className="col-span-4 md:col-span-3">
                <label className="text-xs font-bold text-sage ml-1">Rua</label>
                <input
                  name="logradouro"
                  value={formData.logradouro}
                  onChange={handleChange}
                  required
                  className="input-padrao bg-gray-50"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-sage ml-1">
                  Número
                </label>
                <input
                  id="numeroInput"
                  name="numero"
                  placeholder="Nº"
                  onChange={handleChange}
                  required
                  className="input-padrao"
                />
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="text-xs font-bold text-sage ml-1">
                  Bairro
                </label>
                <input
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  required
                  className="input-padrao bg-gray-50"
                />
              </div>
              <div className="col-span-4">
                <label className="text-xs font-bold text-sage ml-1">
                  Complemento (Apto, Bloco, Referência)
                </label>
                <input
                  name="complemento"
                  placeholder="Ex: Edifício Solar, Apto 302"
                  onChange={handleChange}
                  className="input-padrao"
                />
              </div>
            </div>
          </section>

          {/* 4. RESPONSÁVEL */}
          <section>
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Phone size={20} /> Responsável Familiar
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <input
                name="nome_responsavel"
                placeholder="Nome do Responsável"
                onChange={handleChange}
                required
                className="input-padrao col-span-2"
              />
              <input
                name="parentesco"
                placeholder="Parentesco (Ex: Filho)"
                onChange={handleChange}
                className="input-padrao"
              />
              <input
                name="telefone_responsavel"
                value={formData.telefone_responsavel}
                placeholder="WhatsApp (49)..."
                onChange={handleChange}
                required
                className="input-padrao col-span-2"
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#3A4A3E] text-white font-bold py-5 rounded-xl text-lg shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} /> {loading ? "Salvando..." : "Salvar Paciente"}
          </button>
        </form>
      </div>
      <style>{`
        .input-padrao { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; outline: none; }
        .input-padrao:focus { border-color: #4B5E4F; box-shadow: 0 0 0 2px rgba(75, 94, 79, 0.2); }
      `}</style>
    </div>
  );
}
