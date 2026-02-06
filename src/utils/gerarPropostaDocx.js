import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { supabase } from "../lib/supabase"; 

export const gerarPropostaDocx = async (orcamento) => {
  if (!orcamento) return;

  try {
    let nomeCliente = "Cliente";

    if (orcamento.financeiro_entidades?.nome) {
      nomeCliente = orcamento.financeiro_entidades.nome;
    }
    else if (
      orcamento.observacoes &&
      orcamento.observacoes.includes("Cliente Avulso:")
    ) {
      const partes = orcamento.observacoes.split("Cliente Avulso:");
      if (partes[1]) {
        nomeCliente = partes[1].trim().split("-")[0].trim();
      }
    }

    const nomeTemplate = orcamento.template
      ? `${orcamento.template}.docx`
      : "proposta_v6.docx";

    console.log("Baixando template:", nomeTemplate); 

    const { data, error } = await supabase.storage
      .from("templates")
      .download(nomeTemplate);

    if (error) {
      throw new Error(
        `Template '${nomeTemplate}' não encontrado no Supabase. Verifique se o arquivo existe no Bucket 'templates'.`,
      );
    }

    const content = await data.arrayBuffer();
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "%%", end: "%%" },
    });

    const formatMoney = (val) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(val || 0);

    // 4. TRATAMENTO DE DATAS (Fuso Horário Local)
    const getLocalData = (dataString) => {
      if (!dataString) return new Date();
      const date = new Date(dataString);
      // Ajusta o fuso para garantir que o dia não volte
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() + userTimezoneOffset);
    };

    const dataObj = getLocalData(orcamento.data_emissao);

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

    const dataExtenso = `${dataObj.getDate()} de ${meses[dataObj.getMonth()]} de ${dataObj.getFullYear()}`;

    let dataInicioStr = "__/__";
    if (orcamento.previsao_inicio) {
      const dtInicio = getLocalData(orcamento.previsao_inicio);
      const dia = String(dtInicio.getDate()).padStart(2, "0");
      const mes = String(dtInicio.getMonth() + 1).padStart(2, "0");
      dataInicioStr = `${dia}/${mes}`;
    }

    const itens = orcamento.itens || [];
    const getVal = (termo) => {
      const item = itens.find(
        (i) => i.descricao && i.descricao.includes(termo),
      );
      return formatMoney(item ? item.valor : 0);
    };

    doc.render({
      CLIENTE_NOME: nomeCliente, 
      DATA_EXTENSO: dataExtenso,
      NUMERO: orcamento.numero_orcamento || "---",
      VALIDADE: orcamento.validade_dias || "05", 
      DATA_INICIO: dataInicioStr,

      VAL_TEC_12: getVal("Técnica 12h"),
      VAL_CUID_12: getVal("Cuidadora 12h"),
      VAL_TEC_24: getVal("Técnica 24h"),
      VAL_CUID_24: getVal("Cuidadora 24h"),
    });

    const blob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const clienteSafe = nomeCliente.replace(/[^a-z0-9]/gi, "_");
    const nomeArquivo = `Proposta_${clienteSafe}_${orcamento.numero_orcamento?.replace("/", "-")}.docx`;

    saveAs(blob, nomeArquivo);
  } catch (error) {
    console.error("Erro ao gerar proposta:", error);
    if (error.properties && error.properties.errors) {
      const msg = error.properties.errors.map((e) => e.message).join("\n");
      alert("Erro no Template Word (Tags inválidas):\n" + msg);
    } else {
      alert("Erro ao gerar documento: " + error.message);
    }
  }
};
