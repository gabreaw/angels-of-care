import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Save,
  MapPin,
  User,
  CreditCard,
  FileText,
  UploadCloud,
  Trash2,
  Eye,
  Lock, 
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function AdminEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalAcessoOpen, setModalAcessoOpen] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [criandoAcesso, setCriandoAcesso] = useState(false);

  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    rg: "",
    orgao_emissor: "",
    nacionalidade: "",
    estado_civil: "",
    email: "",
    telefone: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: "",
    funcao: "",
    coren_numero: "",
    cnpj: "",
    chave_pix: "",
    banco: "",
    agencia: "",
    conta: "",
    tipo_conta: "",
    auth_id: null,
    role: "prestador",
    doc_identidade_url: [],
    doc_cartao_cnpj_url: [],
    doc_comprovante_endereco_url: [],
    doc_coren_url: [],
  });

  const [novosArquivos, setNovosArquivos] = useState({
    doc_identidade: [],
    doc_cartao_cnpj: [],
    doc_comprovante_endereco: [],
    doc_coren: [],
  });

  useEffect(() => {
    async function fetchDados() {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        alert("Erro ao carregar: " + error.message);
        navigate("/admin/funcionarios");
      } else {
        setFormData((prev) => ({
          ...prev,
          ...data,
          rg: data.rg || "",
          orgao_emissor: data.orgao_emissor || "",
          nacionalidade: data.nacionalidade || "",
          complemento: data.complemento || "",
          coren_numero: data.coren_numero || "",
          cnpj: data.cnpj || "",
          chave_pix: data.chave_pix || "",
          banco: data.banco || "",
          agencia: data.agencia || "",
          conta: data.conta || "",
          auth_id: data.auth_id || null, // Garante null se vazio
          doc_identidade_url: data.doc_identidade_url || [],
          doc_cartao_cnpj_url: data.doc_cartao_cnpj_url || [],
          doc_comprovante_endereco_url: data.doc_comprovante_endereco_url || [],
          doc_coren_url: data.doc_coren_url || [],
        }));
      }
      setLoading(false);
    }
    fetchDados();
  }, [id, navigate]);

  const mascaraCPF = (v) =>
    v
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  const mascaraCNPJ = (v) =>
    v
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
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
    if (name === "cpf") value = mascaraCPF(value);
    if (name === "cnpj") value = mascaraCNPJ(value);
    if (name === "telefone") value = mascaraTelefone(value);
    if (name === "cep") value = mascaraCEP(value);
    if (name === "rg" || name === "coren_numero" || name === "orgao_emissor")
      value = value.toUpperCase();
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const filesArray = Array.from(e.target.files);
    setNovosArquivos({ ...novosArquivos, [e.target.name]: filesArray });
  };

  const removerArquivoExistente = (campo, caminhoParaRemover) => {
    if (
      !window.confirm(
        "Deseja remover este arquivo? (Você precisará clicar em Salvar para confirmar)"
      )
    )
      return;
    setFormData((prev) => ({
      ...prev,
      [campo]: prev[campo].filter((caminho) => caminho !== caminhoParaRemover),
    }));
  };

  const limparNomeArquivo = (nome) => {
    return nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");
  };

  const uploadMultiplos = async (filesArray, pasta) => {
    if (!filesArray || filesArray.length === 0) return [];
    const paths = [];
    for (const file of filesArray) {
      const nomeLimpo = limparNomeArquivo(file.name);
      const nomeArquivo = `${Date.now()}_${nomeLimpo}`;
      const { data, error } = await supabase.storage
        .from("documentos-prestadores")
        .upload(`${pasta}/${nomeArquivo}`, file);
      if (error) throw error;
      paths.push(data.path);
    }
    return paths;
  };

  const buscarCep = async (e) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length !== 8) return;
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
      }
    } catch (error) {
      console.error(error);
    }
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
          email: formData.email,
          password: novaSenha,
        });

      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new Error(
            "Este email já possui cadastro. Use a recuperação de senha ou outro email."
          );
        }
        throw authError;
      }

      if (authData.user) {
        const { error: updateError } = await supabase
          .from("funcionarios")
          .update({
            auth_id: authData.user.id,
            role: "prestador", 
            status: "ativo",
          })
          .eq("id", id);

        if (updateError) throw updateError;

        setFormData((prev) => ({ ...prev, auth_id: authData.user.id }));
        alert(
          `Acesso criado com sucesso!\nLogin: ${formData.email}\nSenha: ${novaSenha}`
        );
        setModalAcessoOpen(false);
      }
    } catch (error) {
      alert("Erro ao criar acesso: " + error.message);
    } finally {
      setCriandoAcesso(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const novosIdentidade = await uploadMultiplos(
        novosArquivos.doc_identidade,
        "identidade"
      );
      const novosCnpj = await uploadMultiplos(
        novosArquivos.doc_cartao_cnpj,
        "cnpj"
      );
      const novosEndereco = await uploadMultiplos(
        novosArquivos.doc_comprovante_endereco,
        "endereco"
      );
      const novosCoren = await uploadMultiplos(
        novosArquivos.doc_coren,
        "coren"
      );

      const finalIdentidade = [
        ...(formData.doc_identidade_url || []),
        ...novosIdentidade,
      ];
      const finalCnpj = [...(formData.doc_cartao_cnpj_url || []), ...novosCnpj];
      const finalEndereco = [
        ...(formData.doc_comprovante_endereco_url || []),
        ...novosEndereco,
      ];
      const finalCoren = [...(formData.doc_coren_url || []), ...novosCoren];

      const enderecoFormatado = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade}/${formData.estado} (${formData.cep})`;

      const { error } = await supabase
        .from("funcionarios")
        .update({
          ...formData,
          endereco_completo: enderecoFormatado,
          doc_identidade_url: finalIdentidade,
          doc_cartao_cnpj_url: finalCnpj,
          doc_comprovante_endereco_url: finalEndereco,
          doc_coren_url: finalCoren,
        })
        .eq("id", id);

      if (error) throw error;

      alert("Dados atualizados com sucesso!");
      navigate(`/admin/funcionarios/${id}`);
    } catch (error) {
      alert("Erro ao atualizar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-beige overflow-hidden">
        <div className="bg-primary p-6 flex justify-between items-center">
          <h1 className="text-2xl font-serif text-white font-bold">
            Editar Prestador
          </h1>
          <Link
            to={`/admin/funcionarios/${id}`}
            className="text-white/80 hover:text-white flex gap-2 items-center text-sm"
          >
            <ArrowLeft size={18} /> Cancelar
          </Link>
        </div>

        <div className="p-8 space-y-8">
          <section className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="text-lg font-bold text-indigo-900 mb-4 flex gap-2 items-center border-b border-indigo-200 pb-2">
              <Lock size={18} /> Acesso ao Aplicativo
            </h3>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                {formData.auth_id ? (
                  <div className="flex items-center gap-2 text-green-700 font-bold bg-green-100 px-3 py-2 rounded-lg w-fit">
                    <CheckCircle size={20} />
                    <span>Usuário com Acesso Ativo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700 font-bold bg-amber-100 px-3 py-2 rounded-lg w-fit">
                    <AlertTriangle size={20} />
                    <span>Sem acesso ao sistema</span>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Login vinculado ao email: <strong>{formData.email}</strong>
                </p>
              </div>

              {!formData.auth_id && (
                <button
                  type="button"
                  onClick={() => setModalAcessoOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-all whitespace-nowrap"
                >
                  Gerar Senha de Acesso
                </button>
              )}
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-primary mb-4 border-b pb-2 flex gap-2 items-center">
                <User size={18} /> Dados Pessoais
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-campo">Nome Completo</label>
                  <input
                    name="nome_completo"
                    value={formData.nome_completo}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div>
                  <label className="label-campo">CPF</label>
                  <input
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label-campo">RG</label>
                    <input
                      name="rg"
                      value={formData.rg}
                      onChange={handleChange}
                      className="input-padrao"
                    />
                  </div>
                  <div>
                    <label className="label-campo">Org. Emissor</label>
                    <input
                      name="orgao_emissor"
                      value={formData.orgao_emissor}
                      onChange={handleChange}
                      className="input-padrao"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-campo">Nacionalidade</label>
                  <input
                    name="nacionalidade"
                    value={formData.nacionalidade}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div>
                  <label className="label-campo">Estado Civil</label>
                  <select
                    name="estado_civil"
                    value={formData.estado_civil}
                    onChange={handleChange}
                    className="input-padrao bg-white"
                  >
                    <option value="">Selecione</option>
                    <option>Solteiro(a)</option>
                    <option>Casado(a)</option>
                    <option>Divorciado(a)</option>
                    <option>Viúvo(a)</option>
                    <option>União Estável</option>
                  </select>
                </div>
                <div>
                  <label className="label-campo">Email</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div>
                  <label className="label-campo">WhatsApp</label>
                  <input
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
              </div>
            </section>

            <section className="bg-sage/5 p-4 rounded-xl border border-sage/20">
              <h3 className="text-lg font-bold text-primary mb-4 border-b pb-2 flex gap-2 items-center">
                <MapPin size={18} /> Endereço
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="label-campo">CEP</label>
                  <input
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    onBlur={buscarCep}
                    className="input-padrao"
                  />
                </div>
                <div className="col-span-3">
                  <label className="label-campo">Rua</label>
                  <input
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div className="col-span-1">
                  <label className="label-campo">Número</label>
                  <input
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div className="col-span-3">
                  <label className="label-campo">Bairro</label>
                  <input
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div className="col-span-3">
                  <label className="label-campo">Cidade</label>
                  <input
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div className="col-span-1">
                  <label className="label-campo">UF</label>
                  <input
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div className="col-span-4">
                  <label className="label-campo">Complemento</label>
                  <input
                    name="complemento"
                    value={formData.complemento}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
              </div>
            </section>

            <section className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <h3 className="text-lg font-bold text-primary mb-4 border-b pb-2 flex gap-2 items-center">
                <CreditCard size={18} /> Dados MEI & Bancários
              </h3>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="label-campo">Função</label>
                  <select
                    name="funcao"
                    value={formData.funcao}
                    onChange={handleChange}
                    className="input-padrao bg-white"
                  >
                    <option>Téc. Enfermagem</option>
                    <option>Cuidador</option>
                    <option>Enfermeiro</option>
                  </select>
                </div>
                <div>
                  <label className="label-campo">CNPJ</label>
                  <input
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div>
                  <label className="label-campo">Nº Coren</label>
                  <input
                    name="coren_numero"
                    value={formData.coren_numero}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-blue-200 pt-4">
                <div className="col-span-3 md:col-span-1">
                  <label className="label-campo text-blue-800">Banco</label>
                  <input
                    name="banco"
                    value={formData.banco}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div className="col-span-1">
                  <label className="label-campo text-blue-800">Agência</label>
                  <input
                    name="agencia"
                    value={formData.agencia}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="label-campo text-blue-800">Conta</label>
                  <input
                    name="conta"
                    value={formData.conta}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="label-campo text-blue-800">Chave PIX</label>
                  <input
                    name="chave_pix"
                    value={formData.chave_pix}
                    onChange={handleChange}
                    className="input-padrao"
                  />
                </div>
              </div>
            </section>

            <section className="bg-sage/10 p-6 rounded-xl space-y-6 border border-sage/30">
              <h3 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                <UploadCloud size={20} /> Gerenciar Documentos
              </h3>
              <p className="text-sm text-darkText/60 mb-4">
                Você pode excluir documentos antigos e adicionar novos.
              </p>

              <UploadField
                label="RG, CPF ou Coren"
                name="doc_identidade"
                formField="doc_identidade_url"
                onChange={handleFileChange}
                newFiles={novosArquivos.doc_identidade}
                existingFiles={formData.doc_identidade_url}
                onRemoveExisting={removerArquivoExistente}
              />
              <UploadField
                label="Cartão CNPJ"
                name="doc_cartao_cnpj"
                formField="doc_cartao_cnpj_url"
                onChange={handleFileChange}
                newFiles={novosArquivos.doc_cartao_cnpj}
                existingFiles={formData.doc_cartao_cnpj_url}
                onRemoveExisting={removerArquivoExistente}
              />
              <UploadField
                label="Comprovante de Endereço"
                name="doc_comprovante_endereco"
                formField="doc_comprovante_endereco_url"
                onChange={handleFileChange}
                newFiles={novosArquivos.doc_comprovante_endereco}
                existingFiles={formData.doc_comprovante_endereco_url}
                onRemoveExisting={removerArquivoExistente}
              />
              <UploadField
                label="Carteira do Coren"
                name="doc_coren"
                formField="doc_coren_url"
                onChange={handleFileChange}
                newFiles={novosArquivos.doc_coren}
                existingFiles={formData.doc_coren_url}
                onRemoveExisting={removerArquivoExistente}
              />
            </section>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg text-lg"
            >
              <Save size={20} /> {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </form>
        </div>
      </div>

      {modalAcessoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-indigo-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-indigo-900">
                Criar Acesso
              </h3>
              <button
                onClick={() => setModalAcessoOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Isso criará um login para <strong>{formData.email}</strong>.
              Defina uma senha inicial para o prestador.
            </p>

            <form onSubmit={handleCriarAcesso}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Senha Provisória
                </label>
                <input
                  type="text"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none font-mono text-center text-lg tracking-widest"
                  placeholder="Ex: mudar123"
                  required
                />
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 mb-6 border border-yellow-200">
                ⚠️ Certifique-se que o email acima está correto. O sistema
                vinculará o login a este funcionário automaticamente.
              </div>

              <button
                type="submit"
                disabled={criandoAcesso}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
              >
                {criandoAcesso
                  ? "Criando e Vinculando..."
                  : "Confirmar e Criar"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .input-padrao { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; outline: none; transition: all 0.2s; }
        .input-padrao:focus { border-color: #4B5E4F; box-shadow: 0 0 0 3px rgba(75, 94, 79, 0.1); }
        .label-campo { display: block; font-size: 0.75rem; font-weight: 700; color: #4B5E4F; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .upload-field input { width: 100%; font-size: 0.875rem; color: #64748b; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; background: white; }
        .upload-field input::file-selector-button { margin-right: 1rem; padding: 0.5rem 1rem; border-radius: 9999px; border: none; font-size: 0.875rem; font-weight: 600; color: white; background-color: #4B5E4F; cursor: pointer; transition: background-color 0.2s; }
        .upload-field input::file-selector-button:hover { background-color: #3A4A3E; }
      `}</style>
    </div>
  );
}

function UploadField({
  label,
  name,
  formField,
  onChange,
  newFiles,
  existingFiles,
  onRemoveExisting,
}) {
  const getPublicUrl = (path) => {
    if (path.startsWith("http")) return path;

    const { data } = supabase.storage
      .from("documentos-prestadores")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="upload-field mb-6 border-b border-gray-100 pb-4 last:border-0">
      <label className="block font-bold text-sm mb-2 text-darkText flex justify-between items-center">
        {label}
        <span className="text-[10px] font-normal text-sage bg-sage/10 px-2 py-1 rounded-full">
          {existingFiles?.length || 0} arquivos salvos
        </span>
      </label>
      {existingFiles && existingFiles.length > 0 && (
        <div className="mb-3 space-y-2 bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Salvos no sistema:
          </p>
          {existingFiles.map((path, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded border border-gray-100"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText size={14} className="text-blue-500 shrink-0" />
                <span
                  className="truncate text-gray-600 w-48 block"
                  title={path}
                >
                  {path.split("/").pop()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getPublicUrl(path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                  title="Visualizar"
                >
                  <Eye size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => onRemoveExisting(formField, path)}
                  className="p-1.5 hover:bg-red-100 text-red-500 rounded transition-colors"
                  title="Remover da lista (Salvar para confirmar)"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <input
        type="file"
        name={name}
        onChange={onChange}
        multiple
        accept="image/*,.pdf"
      />
      {newFiles && newFiles.length > 0 && (
        <div className="mt-2 space-y-1 pl-2 border-l-2 border-green-500">
          <p className="text-[10px] font-bold text-green-600 uppercase">
            Novos para enviar:
          </p>
          {newFiles.map((file, index) => (
            <div
              key={index}
              className="text-xs flex items-center gap-1 text-green-700"
            >
              <UploadCloud size={12} /> {file.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
