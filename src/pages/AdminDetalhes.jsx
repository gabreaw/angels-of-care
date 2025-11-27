import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
// ADICIONEI 'Edit' AQUI NA LISTA 👇
import {
  CheckCircle,
  XCircle,
  FileText,
  ArrowLeft,
  Download,
  Edit,
} from "lucide-react";

// Bibliotecas para o Contrato
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

export default function AdminDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prestador, setPrestador] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrestador();
  }, []);

  async function fetchPrestador() {
    const { data, error } = await supabase
      .from("funcionarios")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Erro ao buscar: " + error.message);
      navigate("/admin/funcionarios");
    } else {
      setPrestador(data);
    }
    setLoading(false);
  }

  async function atualizarStatus(novoStatus) {
    const { error } = await supabase
      .from("funcionarios")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) alert("Erro: " + error.message);
    else {
      setPrestador({ ...prestador, status: novoStatus });
      alert(`Status atualizado para: ${novoStatus.toUpperCase()}`);
    }
  }

  // --- FUNÇÃO GERAR CONTRATO ---
  const gerarContrato = async () => {
    if (!prestador) return;

    try {
      // 1. Baixa o modelo
      const { data, error } = await supabase.storage
        .from("templates")
        .download("contrato_v2.docx");

      if (error)
        throw new Error(
          "Modelo de contrato não encontrado. Verifique o Bucket 'templates'."
        );

      // 2. Lê e prepara o zip
      const content = await data.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // 3. Monta endereço
      const enderecoCompleto = prestador.logradouro
        ? `${prestador.logradouro}, ${prestador.numero} - ${prestador.bairro}, ${prestador.cidade}/${prestador.estado} (CEP: ${prestador.cep})`
        : prestador.endereco_completo;

      // 4. Preenche as variáveis
      const hoje = new Date();
      const meses = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
      ];

      doc.render({
        RAZAO_SOCIAL: prestador.nome_completo,
        CNPJ: prestador.cnpj || "Não informado",
        ENDERECO: enderecoCompleto,
        // Variáveis granulares de endereço para o contrato novo
        ENDERECO_RUA: prestador.logradouro || "Rua ...",
        ENDERECO_NUMERO: prestador.numero || "S/N",
        ENDERECO_BAIRRO: prestador.bairro || "Bairro ...",
        CEP: prestador.cep || "...",

        NOME_COMPLETO: prestador.nome_completo,
        RG: prestador.rg || "N/I",
        ORGAO_EMISSOR: prestador.orgao_emissor || "",
        CPF: prestador.cpf,
        COREN: prestador.coren_numero || "N/A",
        EMAIL: prestador.email,
        NACIONALIDADE: prestador.nacionalidade || "Brasileiro(a)",
        ESTADO_CIVIL: prestador.estado_civil || "...",

        DIA: hoje.getDate(),
        MES: meses[hoje.getMonth()],
        ANO: hoje.getFullYear(),
        DATA_CADASTRO: `${hoje.getDate()} de ${
          meses[hoje.getMonth()]
        } de ${hoje.getFullYear()}`,
      });

      // 5. Gera e baixa
      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(
        blob,
        `Contrato_${prestador.nome_completo.replace(/\s/g, "_")}.docx`
      );
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar contrato: " + error.message);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Carregando dados...</div>;
  if (!prestador) return null;

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-4xl mx-auto">
        {/* Topo e Ações */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <Link
            to="/admin/funcionarios"
            className="flex items-center gap-2 text-sage hover:text-primary"
          >
            <ArrowLeft size={20} /> Voltar para Lista
          </Link>

          <div className="flex gap-2 flex-wrap justify-end">
            {/* Botão Editar */}
            <Link
              to={`/admin/funcionarios/${id}/editar`}
              className="bg-gray-100 text-darkText border border-gray-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-200 hover:text-primary"
            >
              <Edit size={18} /> Editar
            </Link>

            {/* Botão Contrato */}
            <button
              onClick={gerarContrato}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md"
            >
              <FileText size={18} /> Gerar Contrato
            </button>

            {/* Botões de Aprovação */}
            {prestador.status === "pendente" && (
              <button
                onClick={() => atualizarStatus("ativo")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 shadow-md"
              >
                <CheckCircle size={18} /> Aprovar
              </button>
            )}
            {prestador.status === "ativo" && (
              <button
                onClick={() => atualizarStatus("inativo")}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-600 shadow-md"
              >
                <XCircle size={18} /> Desativar
              </button>
            )}
            {prestador.status === "inativo" && (
              <button
                onClick={() => atualizarStatus("ativo")}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-600 shadow-md"
              >
                <CheckCircle size={18} /> Reativar
              </button>
            )}
          </div>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-lg border border-beige overflow-hidden">
          {/* Cabeçalho do Perfil */}
          <div className="bg-sage/10 p-6 border-b border-beige flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-serif text-primary font-bold">
                {prestador.nome_completo}
              </h1>
              <p className="text-darkText/60 font-bold mt-1">
                {prestador.funcao} • {prestador.cidade}/{prestador.estado}
              </p>
              <span
                className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  prestador.status === "ativo"
                    ? "bg-green-100 text-green-700"
                    : prestador.status === "inativo"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                Status: {prestador.status}
              </span>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-8">
            {/* Coluna 1: Dados */}
            <div className="space-y-4 text-sm">
              <h3 className="font-bold text-primary border-b border-beige pb-2 text-base">
                Dados Pessoais & Contato
              </h3>
              <p>
                <strong>CPF:</strong> {prestador.cpf}
              </p>
              <p>
                <strong>RG:</strong> {prestador.rg || "-"}{" "}
                {prestador.orgao_emissor}
              </p>
              <p>
                <strong>Nacionalidade:</strong> {prestador.nacionalidade}
              </p>
              <p>
                <strong>Estado Civil:</strong> {prestador.estado_civil}
              </p>
              <p>
                <strong>Email:</strong> {prestador.email}
              </p>
              <p>
                <strong>WhatsApp:</strong> {prestador.telefone}
              </p>
              <p>
                <strong>Endereço:</strong> {prestador.logradouro},{" "}
                {prestador.numero} - {prestador.bairro}
              </p>
              <p>
                <strong>CEP:</strong> {prestador.cep} ({prestador.cidade}/
                {prestador.estado})
              </p>
              {prestador.complemento && (
                <p>
                  <strong>Complemento:</strong> {prestador.complemento}
                </p>
              )}

              <h3 className="font-bold text-primary border-b border-beige pb-2 mt-6 text-base">
                Dados Bancários & MEI
              </h3>
              <p>
                <strong>CNPJ:</strong> {prestador.cnpj}
              </p>
              <p>
                <strong>Coren:</strong> {prestador.coren_numero}
              </p>
              <p>
                <strong>PIX:</strong> {prestador.chave_pix}
              </p>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                <p>
                  <span className="font-bold text-blue-800">Banco:</span>{" "}
                  {prestador.banco}
                </p>
                <p>
                  <span className="font-bold text-blue-800">Agência:</span>{" "}
                  {prestador.agencia}
                </p>
                <p>
                  <span className="font-bold text-blue-800">Conta:</span>{" "}
                  {prestador.conta} ({prestador.tipo_conta})
                </p>
              </div>
            </div>

            {/* Coluna 2: Documentos */}
            <div className="space-y-4">
              <h3 className="font-bold text-primary border-b border-beige pb-2 text-base">
                Documentos Anexados
              </h3>

              <DocumentoItem
                nome="Identidade (RG/CNH)"
                urls={prestador.doc_identidade_url}
              />
              <DocumentoItem
                nome="Cartão CNPJ"
                urls={prestador.doc_cartao_cnpj_url}
              />
              <DocumentoItem
                nome="Comprovante de Endereço"
                urls={prestador.doc_comprovante_endereco_url}
              />
              <DocumentoItem
                nome="Carteira do Coren"
                urls={prestador.doc_coren_url}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para baixar arquivos de Bucket Privado (COM A CORREÇÃO DE LINK ASSINADO)
function DocumentoItem({ nome, urls }) {
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const gerarLinks = async () => {
      if (!urls || urls.length === 0) return;

      const listaUrls = Array.isArray(urls) ? urls : [urls];
      const linksTemp = [];

      for (const path of listaUrls) {
        // ATENÇÃO: Nome do bucket aqui tem que ser 'documentos-prestadores'
        const { data, error } = await supabase.storage
          .from("documentos-prestadores")
          .createSignedUrl(path, 3600); // Link válido por 1 hora

        if (error) {
          console.error(`Erro ao gerar link para ${path}:`, error);
        } else {
          linksTemp.push({ url: data.signedUrl, path: path });
        }
      }
      setLinks(linksTemp);
    };

    gerarLinks();
  }, [urls]);

  if (!urls || urls.length === 0) {
    return (
      <div className="text-gray-400 text-sm p-2 border border-dashed rounded">
        {nome}: Pendente
      </div>
    );
  }

  return (
    <div className="bg-paper rounded-lg border border-beige p-3">
      <div className="text-sm font-bold text-darkText mb-2 flex items-center gap-2">
        <FileText size={16} className="text-sage" />
        {nome}
      </div>

      <div className="flex flex-wrap gap-2">
        {links.map((item, index) => (
          <a
            key={index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-white border border-sage text-primary px-3 py-2 rounded-md hover:bg-sage hover:text-white transition-colors flex items-center gap-2 shadow-sm"
            title={item.path}
          >
            <Download size={14} />
            Arquivo {index + 1}
          </a>
        ))}
      </div>
    </div>
  );
}
