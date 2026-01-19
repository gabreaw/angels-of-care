import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import {
  X,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Loader2,
  Paperclip,
  PlusCircle,
  Trash2,
} from "lucide-react";

export default function InformarRecebimentoModal({
  onClose,
  onSuccess,
  transacao,
}) {
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false); 
  const [contas, setContas] = useState([]);

  const fileInputRef = useRef(null); 

  const hoje = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    data_pagamento: hoje,
    valor_original: transacao.valor,
    juros: 0,
    multa: 0,
    desconto: 0,
    forma_pagamento: transacao.forma_pagamento || "boleto",
    conta_id: transacao.conta_id || "",
    observacoes: "",
    anexo_urls: [],
  });

  const [totalPago, setTotalPago] = useState(transacao.valor);

  useEffect(() => {
    fetchContas();
    let existingUrls = [];
    try {
      if (transacao.anexo_url) {
        if (transacao.anexo_url.trim().startsWith("[")) {
          existingUrls = JSON.parse(transacao.anexo_url);
        } else {
          existingUrls = [transacao.anexo_url];
        }
      }
    } catch (e) {
      existingUrls = transacao.anexo_url ? [transacao.anexo_url] : [];
    }
    setFormData((prev) => ({ ...prev, anexo_urls: existingUrls }));
  }, []);

  useEffect(() => {
    const v = parseFloat(formData.valor_original) || 0;
    const j = parseFloat(formData.juros) || 0;
    const m = parseFloat(formData.multa) || 0;
    const d = parseFloat(formData.desconto) || 0;
    setTotalPago(v + j + m - d);
  }, [
    formData.valor_original,
    formData.juros,
    formData.multa,
    formData.desconto,
  ]);

  async function fetchContas() {
    const { data } = await supabase
      .from("financeiro_contas")
      .select("*")
      .order("nome");
    setContas(data || []);
    if (!formData.conta_id && data && data.length > 0) {
      setFormData((prev) => ({ ...prev, conta_id: data[0].id }));
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFile(true);
    const newAttachments = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop().toLowerCase().trim();
        const fileName = `comprovantes/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("financeiro")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("financeiro")
          .getPublicUrl(fileName);

        newAttachments.push({
          name: file.name,
          url: data.publicUrl,
        });
      }

      setFormData((prev) => ({
        ...prev,
        anexo_urls: [...prev.anexo_urls, ...newAttachments],
      }));
      alert(`${files.length} comprovante(s) anexado(s)!`);
    } catch (error) {
      alert("Erro ao enviar: " + error.message);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      anexo_urls: prev.anexo_urls.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const anexosPadronizados = formData.anexo_urls.map((item) => {
      if (typeof item === "string") {
        const nomeExtraido = decodeURIComponent(
          item.split("/").pop().split("?")[0],
        );
        return { name: nomeExtraido, url: item };
      }
      return item;
    });
    const anexoUrlString = JSON.stringify(anexosPadronizados);

    try {
      const { error } = await supabase
        .from("financeiro_transacoes")
        .update({
          status: "pago",
          data_pagamento: formData.data_pagamento,
          valor_pago: totalPago,
          juros: formData.juros,
          multa: formData.multa,
          desconto: formData.desconto,
          forma_pagamento: formData.forma_pagamento,
          conta_id: formData.conta_id,
          observacoes: formData.observacoes
            ? transacao.observacoes
              ? transacao.observacoes + "\n" + formData.observacoes
              : formData.observacoes
            : transacao.observacoes,
          anexo_url: anexoUrlString, 
        })
        .eq("id", transacao.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err) {
      alert("Erro ao confirmar recebimento: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-green-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">
            <TrendingUp size={24} /> Informar Recebimento
          </h2>
          <button onClick={onClose}>
            <X size={24} className="text-green-700 hover:text-green-900" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
          {/* Seção Superior */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">
              Informações do lançamento
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                  Cliente
                </p>
                <p className="font-medium text-green-600 truncate">
                  {transacao.financeiro_entidades?.nome || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                  Vencimento
                </p>
                <p className="font-medium">
                  {formatDate(transacao.data_vencimento)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                  Categoria
                </p>
                <p className="font-medium">
                  {transacao.financeiro_categorias?.nome || "-"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                  Valor Total
                </p>
                <p className="font-bold text-lg text-green-700">
                  {formatMoney(transacao.valor)}
                </p>
              </div>
              <div className="col-span-4">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                  Descrição
                </p>
                <p className="text-gray-700">{transacao.descricao}</p>
              </div>
            </div>
          </div>

          <form
            id="form-recebimento"
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6"
          >
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2">
              Informações do Recebimento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Data do recebimento *
                </label>
                <input
                  type="date"
                  name="data_pagamento"
                  value={formData.data_pagamento}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Forma de recebimento
                </label>
                <select
                  name="forma_pagamento"
                  value={formData.forma_pagamento}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="boleto">Boleto</option>
                  <option value="pix">Pix</option>
                  <option value="transferencia">Transferência</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão de Crédito</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Conta de Entrada *
                </label>
                <select
                  name="conta_id"
                  value={formData.conta_id}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg bg-white"
                  required
                >
                  <option value="">Selecione...</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Valor da Parcela (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="valor_original"
                  value={formData.valor_original}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg bg-gray-100 text-gray-600"
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Juros (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="juros"
                  value={formData.juros}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Multa (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="multa"
                  value={formData.multa}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="desconto"
                  value={formData.desconto}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg text-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <div className="text-right">
                <span className="text-sm font-bold text-gray-500 uppercase mr-4">
                  Total Recebido
                </span>
                <span className="text-3xl font-bold text-green-600">
                  {formatMoney(totalPago)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">
                Observações
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg h-20 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">
                Comprovantes / Anexos
              </label>

              {formData.anexo_urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {formData.anexo_urls.map((anexo, index) => {
                    const fileUrl =
                      typeof anexo === "string" ? anexo : anexo.url;
                    const fileName =
                      typeof anexo === "string"
                        ? decodeURIComponent(
                            anexo.split("/").pop().split("?")[0],
                          )
                        : anexo.name;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 border rounded-lg text-xs"
                      >
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-green-700 hover:underline truncate"
                          title={fileName}
                        >
                          <Paperclip size={14} className="flex-shrink-0" />{" "}
                          <span className="truncate">{fileName}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-gray-400 hover:text-red-500 ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                onClick={() => fileInputRef.current.click()}
                className={`border-2 border-dashed border-green-200 bg-green-50/50 rounded-lg p-3 text-center cursor-pointer hover:bg-green-50 transition-colors ${uploadingFile ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-sm">
                  {uploadingFile ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <PlusCircle size={18} />
                  )}
                  {uploadingFile ? "Enviando..." : "Anexar Comprovante"}
                </div>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="application/pdf, image/*"
                  multiple
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded text-gray-600 font-bold text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            form="form-recebimento"
            disabled={loading || uploadingFile}
            className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2 text-sm shadow-md transition-all"
          >
            {loading ? (
              "Confirmando..."
            ) : (
              <>
                {" "}
                <CheckCircle size={18} /> Confirmar Recebimento{" "}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
