import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { CheckCircle, FileText, MapPin, CreditCard } from "lucide-react";

export default function CadastroParceiro() {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    rg: "",
    email: "",
    telefone: "",
    telefone_alternativo: "",
    estado_civil: "",
    cnpj: "",
    chave_pix: "",
    banco: "",
    agencia: "",
    conta: "",
    tipo_conta: "Corrente",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "Chapecó",
    estado: "SC",
    complemento: "",
    funcao: "Téc. Enfermagem",
    coren_numero: "",
    nacionalidade: "Brasileiro(a)",
    orgao_emissor: "",
  });

  const [arquivos, setArquivos] = useState({
    doc_identidade: [],
    doc_cartao_cnpj: [],
    doc_comprovante_endereco: [],
    doc_coren: [],
  });

  const mascaraCPF = (valor) =>
    valor
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");

  const mascaraCNPJ = (valor) =>
    valor
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");

  const mascaraTelefone = (valor) =>
    valor
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2")
      .slice(0, 15);

  const mascaraCEP = (valor) =>
    valor
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "cpf") value = mascaraCPF(value);
    if (name === "cnpj") value = mascaraCNPJ(value);
    if (name === "telefone") value = mascaraTelefone(value);
    if (name === "telefone_alternativo") value = mascaraTelefone(value);
    if (name === "cep") value = mascaraCEP(value);
    if (name === "rg" || name === "coren_numero") value = value.toUpperCase();
    setFormData({ ...formData, [name]: value });
  };

  const buscarCep = async (e) => {
    const cepLimpo = e.target.value.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    setLoadingCep(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );
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

  const handleFileChange = (e) => {
    const filesArray = Array.from(e.target.files);
    setArquivos({ ...arquivos, [e.target.name]: filesArray });
  };

  const limparNomeArquivo = (nome) => {
    return nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");
  };

  const uploadMultiplos = async (filesArray, pasta) => {
    if (!filesArray || filesArray.length === 0) return null;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dadosLimpos = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ""),
        cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, "") : "",
        cep: formData.cep.replace(/\D/g, ""),
        telefone: `+55${formData.telefone.replace(/\D/g, "")}`,
        telefone_alternativo: formData.telefone_alternativo
          ? `+55${formData.telefone_alternativo.replace(/\D/g, "")}`
          : null,
      };

      const linksIdentidade = await uploadMultiplos(
        arquivos.doc_identidade,
        "identidade"
      );

      const linksCnpj = await uploadMultiplos(arquivos.doc_cartao_cnpj, "cnpj");

      const linksEndereco = await uploadMultiplos(
        arquivos.doc_comprovante_endereco,
        "endereco"
      );
      const linksCoren = await uploadMultiplos(arquivos.doc_coren, "coren");

      const enderecoFormatado = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade}/${formData.estado} (CEP: ${formData.cep})`;

      const { error } = await supabase.from("funcionarios").insert([
        {
          ...dadosLimpos,
          endereco_completo: enderecoFormatado,
          doc_identidade_url: linksIdentidade,
          doc_cartao_cnpj_url: linksCnpj, 
          doc_comprovante_endereco_url: linksEndereco,
          doc_coren_url: linksCoren,
          status: "pendente",
        },
      ]);

      if (error) throw error;
      setSucesso(true);
    } catch (error) {
      alert("Erro no cadastro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-green-200">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-primary font-bold mb-2">
            Cadastro Enviado!
          </h1>
          <p className="text-darkText/70 mb-6">
            Recebemos seus documentos. Nossa equipe fará a análise em breve.
          </p>
          <Link
            to="/"
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-beige">
        <div className="bg-primary p-8 text-center">
          <h1 className="text-3xl font-serif text-white font-bold">
            Seja um Parceiro Angels
          </h1>
          <p className="text-white/80 mt-2">
            Preencha seus dados. (Campos formatam automaticamente)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <section>
            <h3 className="text-xl font-bold text-primary mb-4">
              1. Dados Pessoais
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="nome_completo"
                placeholder="Nome Completo"
                onChange={handleChange}
                required
                className="input-padrao"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="cpf"
                  value={formData.cpf}
                  placeholder="CPF"
                  onChange={handleChange}
                  required
                  className="input-padrao"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="rg"
                    value={formData.rg}
                    placeholder="RG"
                    onChange={handleChange}
                    required
                    className="input-padrao"
                  />
                  <input
                    name="orgao_emissor"
                    placeholder="Org. Emissor"
                    onChange={handleChange}
                    required
                    className="input-padrao"
                  />
                </div>
              </div>
              <input
                name="telefone"
                value={formData.telefone}
                placeholder="WhatsApp"
                onChange={handleChange}
                required
                className="input-padrao"
              />
              <input
                name="telefone_alternativo"
                value={formData.telefone_alternativo}
                placeholder="Telefone Alternativo (Opcional)"
                onChange={handleChange}
                className="input-padrao"
              />
              <input
                name="email"
                type="email"
                placeholder="E-mail"
                onChange={handleChange}
                required
                className="input-padrao"
              />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input
                  name="nacionalidade"
                  value={formData.nacionalidade}
                  placeholder="Nacionalidade"
                  onChange={handleChange}
                  required
                  className="input-padrao"
                />

                <select
                  name="estado_civil"
                  onChange={handleChange}
                  className="input-padrao bg-white"
                >
                  <option value="">Estado Civil</option>
                  <option>Solteiro(a)</option>
                  <option>Casado(a)</option>
                  <option>Divorciado(a)</option>
                  <option>Viúvo(a)</option>
                  <option>União Estável</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-sage/5 p-6 rounded-xl border border-sage/20">
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <MapPin size={20} /> Endereço
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
              <div className="col-span-3">
                <label className="text-xs font-bold text-sage ml-1">
                  Cidade
                </label>
                <input
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  className="input-padrao bg-gray-50"
                />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold text-sage ml-1">UF</label>
                <input
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="input-padrao bg-gray-50"
                />
              </div>
              <div className="col-span-4">
                <label className="text-xs font-bold text-sage ml-1">
                  Complemento
                </label>
                <input
                  name="complemento"
                  placeholder="Opcional"
                  onChange={handleChange}
                  className="input-padrao"
                />
              </div>
            </div>
          </section>

          <section className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <CreditCard size={20} /> Dados Bancários & Profissional
            </h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <select
                name="funcao"
                onChange={handleChange}
                className="input-padrao bg-white"
              >
                <option>Téc. Enfermagem</option>
                <option>Cuidador</option>
                <option>Enfermeiro</option>
              </select>

              <input
                name="coren_numero"
                value={formData.coren_numero}
                placeholder="Nº Coren (Opcional)"
                onChange={handleChange}
                className="input-padrao"
              />

              <input
                name="cnpj"
                value={formData.cnpj}
                placeholder="CNPJ (MEI) - Opcional"
                onChange={handleChange}
                className="input-padrao"
              />

              <input
                name="chave_pix"
                placeholder="Chave PIX"
                onChange={handleChange}
                required
                className="input-padrao"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-blue-200 pt-4 mt-2">
              <div className="col-span-3 md:col-span-1">
                <label className="text-xs font-bold text-blue-700 ml-1">
                  Banco
                </label>
                <input
                  name="banco"
                  placeholder="Ex: Nubank"
                  onChange={handleChange}
                  required
                  className="input-padrao"
                />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold text-blue-700 ml-1">
                  Agência
                </label>
                <input
                  name="agencia"
                  placeholder="0000"
                  onChange={handleChange}
                  required
                  className="input-padrao"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-blue-700 ml-1">
                  Conta + Dígito
                </label>
                <input
                  name="conta"
                  placeholder="12345-6"
                  onChange={handleChange}
                  required
                  className="input-padrao"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="text-xs font-bold text-blue-700 ml-1">
                  Tipo de Conta
                </label>
                <select
                  name="tipo_conta"
                  onChange={handleChange}
                  className="input-padrao bg-white"
                >
                  <option>Corrente</option>
                  <option>Poupança</option>
                  <option>Pagamento</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-primary mb-4">
              4. Documentação
            </h3>
            <div className="bg-sage/10 p-6 rounded-xl space-y-6 border border-sage/30">
              <UploadField
                label="RG, CPF ou CNH (Frente e Verso)"
                name="doc_identidade"
                onChange={handleFileChange}
                files={arquivos.doc_identidade}
                required
              />

              <UploadField
                label="Cartão CNPJ (Opcional)"
                name="doc_cartao_cnpj"
                onChange={handleFileChange}
                files={arquivos.doc_cartao_cnpj}
              />

              <UploadField
                label="Comprovante de Endereço"
                name="doc_comprovante_endereco"
                onChange={handleFileChange}
                files={arquivos.doc_comprovante_endereco}
                required
              />

              <UploadField
                label="Carteira do Coren (Opcional)"
                name="doc_coren"
                onChange={handleFileChange}
                files={arquivos.doc_coren}
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#3A4A3E] text-white font-bold py-5 rounded-xl text-lg shadow-lg transition-all"
          >
            {loading ? "Enviando..." : "Finalizar Cadastro"}
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

function UploadField({ label, name, onChange, files, required }) {
  return (
    <div className="upload-field">
      <label className="block font-bold text-sm mb-1 text-darkText">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="file"
        name={name}
        onChange={onChange}
        multiple
        accept="image/*,.pdf"
        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-[#3A4A3E]"
      />
      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((file, index) => (
            <div
              key={index}
              className="text-xs flex items-center gap-1 text-primary"
            >
              <FileText size={12} /> {file.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
