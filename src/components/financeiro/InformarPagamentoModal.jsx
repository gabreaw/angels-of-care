import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { X, Calendar, DollarSign, CheckCircle } from "lucide-react";

export default function InformarPagamentoModal({
  onClose,
  onSuccess,
  transacao,
}) {
  const [loading, setLoading] = useState(false);
  const [contas, setContas] = useState([]);

  const hoje = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    data_pagamento: hoje,
    valor_pago: transacao.valor,
    juros: 0,
    multa: 0,
    desconto: 0,
    forma_pagamento: transacao.forma_pagamento || "boleto",
    conta_id: transacao.conta_id || "",
    observacoes: "",
  });

  const [totalPago, setTotalPago] = useState(transacao.valor);

  useEffect(() => {
    fetchContas();
  }, []);

  useEffect(() => {
    // Calculate total whenever values change
    const v = parseFloat(formData.valor_pago) || 0;
    const j = parseFloat(formData.juros) || 0;
    const m = parseFloat(formData.multa) || 0;
    const d = parseFloat(formData.desconto) || 0;
    setTotalPago(v + j + m - d);
  }, [formData.valor_pago, formData.juros, formData.multa, formData.desconto]);

  async function fetchContas() {
    const { data } = await supabase
      .from("financeiro_contas")
      .select("*")
      .order("nome");
    setContas(data || []);
    // Set default account if none selected and accounts exist
    if (!formData.conta_id && data && data.length > 0) {
      setFormData((prev) => ({ ...prev, conta_id: data[0].id }));
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMoneyChange = (e) => {
    // Simple handler for money inputs (stores raw number for simplicity in this example,
    // but ideally use a mask library or the previous mask logic)
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("financeiro_transacoes")
        .update({
          status: "pago",
          data_pagamento: formData.data_pagamento,
          valor_pago: totalPago, // Assuming you have a column for actual paid amount, otherwise overwrite 'valor' or keep 'valor' as original
          // For this example, I'll update the main fields related to payment
          juros: formData.juros,
          multa: formData.multa,
          desconto: formData.desconto,
          forma_pagamento: formData.forma_pagamento,
          conta_id: formData.conta_id,
          observacoes: formData.observacoes
            ? transacao.observacoes + "\nPagamento: " + formData.observacoes
            : transacao.observacoes,
        })
        .eq("id", transacao.id);

      if (error) throw error;

      // Optional: Update account balance logic here if needed (e.g., subtract from financeiro_contas)

      onSuccess();
      onClose();
    } catch (err) {
      alert("Erro ao confirmar pagamento: " + err.message);
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
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            Informar pagamento
          </h2>
          <button onClick={onClose}>
            <X size={24} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
          {/* Top Info Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">
              Informações do lançamento
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                  Fornecedor
                </p>
                <p className="font-medium text-blue-600">
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
                  Valor Original
                </p>
                <p className="font-bold text-lg text-gray-800">
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

          {/* Payment Form */}
          <form
            id="form-pagamento"
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6"
          >
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2">
              Informações do pagamento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Data do pagamento *
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
                  Forma de pagamento
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
                  Conta de Saída *
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Valor Original (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="valor_pago"
                  value={formData.valor_pago}
                  onChange={handleMoneyChange}
                  className="w-full p-2 border rounded-lg bg-gray-50"
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
                  onChange={handleMoneyChange}
                  className="w-full p-2 border rounded-lg"
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
                  onChange={handleMoneyChange}
                  className="w-full p-2 border rounded-lg"
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
                  onChange={handleMoneyChange}
                  className="w-full p-2 border rounded-lg text-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <div className="text-right">
                <span className="text-sm font-bold text-gray-500 uppercase mr-4">
                  Total Pago
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {formatMoney(totalPago)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">
                Observações do Pagamento
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg h-20 resize-none"
                placeholder="Ex: Pago com atraso autorizado..."
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded text-gray-600 font-bold text-sm"
          >
            Cancelar
          </button>
          <button
            form="form-pagamento"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2 text-sm shadow-md"
          >
            {loading ? (
              "Confirmando..."
            ) : (
              <>
                {" "}
                <CheckCircle size={18} /> Confirmar pagamento{" "}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
