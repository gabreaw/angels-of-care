import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { X, Save, Upload, Loader2, FileText } from "lucide-react";

export default function NovoContratoModal({
  onClose,
  onSuccess,
  contratoParaEditar,
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [entidades, setEntidades] = useState([]);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    entidade_id: "",
    titulo: "",
    tipo: "cliente",
    data_inicio: new Date().toISOString().split("T")[0],
    data_fim: "",
    valor_mensal: "",
    dia_vencimento: "5",
    status: "ativo",
    observacoes: "",
    arquivo_url: null,
  });

  useEffect(() => {
    fetchEntidades();
    if (contratoParaEditar) {
      setFormData({
        ...contratoParaEditar,
        entidade_id: contratoParaEditar.entidade_id || "",
        valor_mensal: formatCurrency(contratoParaEditar.valor_mensal),
        data_inicio: contratoParaEditar.data_inicio,
        data_fim: contratoParaEditar.data_fim || "",
      });
    }
  }, [contratoParaEditar]);

  async function fetchEntidades() {
    const { data } = await supabase
      .from("financeiro_entidades")
      .select("*")
      .order("nome");
    setEntidades(data || []);
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleValorChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    const num = Number(val) / 100;
    setFormData({ ...formData, valor_mensal: formatCurrency(num) });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `contrato-${Date.now()}.${fileExt}`;
      const filePath = `contratos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("financeiro")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("financeiro")
        .getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, arquivo_url: data.publicUrl }));
      alert("Arquivo anexado!");
    } catch (err) {
      alert("Erro no upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const valorNumerico = formData.valor_mensal
      ? parseFloat(
          formData.valor_mensal.replace(/[^\d,]/g, "").replace(",", "."),
        )
      : 0;

    const payload = {
      entidade_id: formData.entidade_id || null,
      titulo: formData.titulo,
      tipo: formData.tipo,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || null,
      valor_mensal: valorNumerico,
      dia_vencimento: formData.dia_vencimento
        ? parseInt(formData.dia_vencimento)
        : null,
      status: formData.status,
      observacoes: formData.observacoes,
      arquivo_url: formData.arquivo_url,
    };

    try {
      if (contratoParaEditar) {
        const { error } = await supabase
          .from("financeiro_contratos")
          .update(payload)
          .eq("id", contratoParaEditar.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("financeiro_contratos")
          .insert([payload]);
        if (error) throw error;
      }
      alert("Contrato salvo!");
      onSuccess();
      onClose();
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {contratoParaEditar ? "Editar Contrato" : "Novo Contrato"}
          </h2>
          <button onClick={onClose}>
            <X size={24} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form
            id="form-contrato"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Título / Objeto
                </label>
                <input
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Ex: Prestação de Serviços - Paciente X"
                  required
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Tipo
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="cliente">
                    Contrato com Cliente (Receita)
                  </option>
                  <option value="fornecedor">
                    Contrato com Fornecedor (Despesa)
                  </option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Parte Envolvida
                </label>
                <select
                  name="entidade_id"
                  value={formData.entidade_id}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg bg-white"
                  required
                >
                  <option value="">Selecione...</option>
                  {entidades.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Data Início
                </label>
                <input
                  type="date"
                  name="data_inicio"
                  value={formData.data_inicio}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Data Fim
                </label>
                <input
                  type="date"
                  name="data_fim"
                  value={formData.data_fim}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="ativo">Ativo</option>
                  <option value="encerrado">Encerrado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Valor Mensal
                </label>
                <input
                  name="valor_mensal"
                  value={formData.valor_mensal}
                  onChange={handleValorChange}
                  className="w-full p-2 border rounded-lg font-bold"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Dia Vencimento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  name="dia_vencimento"
                  value={formData.dia_vencimento}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                Arquivo do Contrato (PDF)
              </label>
              <div
                onClick={() => fileInputRef.current.click()}
                className={`border-2 border-dashed ${formData.arquivo_url ? "border-green-300 bg-green-50" : "border-gray-300 hover:bg-gray-50"} rounded-lg p-4 text-center cursor-pointer transition-colors`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Loader2 className="animate-spin" size={16} /> Enviando...
                  </span>
                ) : formData.arquivo_url ? (
                  <span className="flex items-center justify-center gap-2 text-sm text-green-600 font-bold">
                    <FileText size={16} /> Arquivo Anexado (Clique para trocar)
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Upload size={16} /> Clique para anexar PDF
                  </span>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="application/pdf"
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                Observações
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg h-24 resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded text-gray-600 font-bold text-sm"
          >
            Cancelar
          </button>
          <button
            form="form-contrato"
            disabled={loading || uploading}
            className="px-6 py-2 bg-primary text-white rounded font-bold hover:bg-[#3A4A3E] flex items-center gap-2 text-sm shadow-md transition-all"
          >
            {loading ? "Salvando..." : "Salvar Contrato"} <Save size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
