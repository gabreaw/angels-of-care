import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { X, Save, Wallet, Loader2 } from "lucide-react";

export default function NovaContaModal({
  onClose,
  onSuccess,
  contaParaEditar = null,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "corrente",
    saldo_inicial: "0,00",
  });

  useEffect(() => {
    if (contaParaEditar) {
      setFormData({
        nome: contaParaEditar.nome,
        tipo: contaParaEditar.tipo,
        saldo_inicial: new Intl.NumberFormat("pt-BR", {
          minimumFractionDigits: 2,
        }).format(contaParaEditar.saldo_inicial),
      });
    }
  }, [contaParaEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) return alert("O nome da conta é obrigatório.");

    setLoading(true);
    try {
      const saldoFloat = parseFloat(
        String(formData.saldo_inicial).replace(/\./g, "").replace(",", ".")
      );

      const payload = {
        nome: formData.nome,
        tipo: formData.tipo,
        saldo_inicial: isNaN(saldoFloat) ? 0 : saldoFloat,
      };

      if (contaParaEditar) {
        const { error } = await supabase
          .from("financeiro_contas")
          .update(payload)
          .eq("id", contaParaEditar.id);

        if (error) throw error;
        alert("Conta atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("financeiro_contas")
          .insert([payload]);

        if (error) throw error;
        alert("Conta cadastrada com sucesso!");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert("Erro ao salvar conta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Wallet size={20} className="text-purple-600" />
            {contaParaEditar ? "Editar Conta" : "Nova Conta / Caixa"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form id="form-conta" onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">
              Nome da Conta *
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Ex: Nubank Principal, Caixa Físico"
              className="w-full p-2.5 border rounded-lg focus:border-purple-500 outline-none text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">
                Tipo
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full p-2.5 border rounded-lg bg-white text-sm outline-none"
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="caixa">Caixa Físico (Dinheiro)</option>
                <option value="cartao_credito">Cartão de Crédito</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">
                Saldo Inicial (R$)
              </label>
              <input
                type="text"
                name="saldo_inicial"
                value={formData.saldo_inicial}
                onChange={handleChange}
                placeholder="0,00"
                className="w-full p-2.5 border rounded-lg text-right font-mono text-sm outline-none"
              />
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 text-sm font-bold hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            form="form-conta"
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
