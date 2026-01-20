import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  X,
  Save,
  Plus,
  Trash2,
  Calculator,
  User,
  Calendar,
} from "lucide-react";

export default function NovoOrcamentoModal({
  onClose,
  onSuccess,
  orcamentoParaEditar,
}) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);

  const [formData, setFormData] = useState({
    entidade_id: "",
    data_emissao: new Date().toISOString().split("T")[0],
    data_validade: new Date(new Date().setDate(new Date().getDate() + 15))
      .toISOString()
      .split("T")[0],
    descricao: "",
    status: "pendente",
    observacoes: "",
    itens: [], 
  });
  const [novoItem, setNovoItem] = useState({
    descricao: "",
    qtd: 1,
    valor: 0,
  });

  useEffect(() => {
    fetchClientes();
    if (orcamentoParaEditar) {
      setFormData({
        ...orcamentoParaEditar,
        data_emissao: orcamentoParaEditar.data_emissao?.split("T")[0],
        data_validade: orcamentoParaEditar.data_validade?.split("T")[0],
        entidade_id: orcamentoParaEditar.entidade_id || "",
        itens: orcamentoParaEditar.itens || [],
      });
    }
  }, [orcamentoParaEditar]);

  async function fetchClientes() {
    const { data } = await supabase
      .from("financeiro_entidades")
      .select("*")
      .order("nome");
    setClientes(data || []);
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddItem = () => {
    if (!novoItem.descricao || novoItem.valor <= 0)
      return alert("Preencha descrição e valor.");

    const itemCompleto = {
      id: crypto.randomUUID(),
      descricao: novoItem.descricao,
      qtd: Number(novoItem.qtd),
      valor: Number(novoItem.valor),
      total: Number(novoItem.qtd) * Number(novoItem.valor),
    };

    setFormData((prev) => ({
      ...prev,
      itens: [...prev.itens, itemCompleto],
    }));

    setNovoItem({ descricao: "", qtd: 1, valor: 0 });
  };

  const handleRemoveItem = (id) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.filter((i) => i.id !== id),
    }));
  };

  const totalGeral = formData.itens.reduce((acc, item) => acc + item.total, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      entidade_id: formData.entidade_id || null, 
      data_emissao: formData.data_emissao,
      data_validade: formData.data_validade,
      descricao: formData.descricao,
      status: formData.status,
      observacoes: formData.observacoes,
      itens: formData.itens,
      valor_total: totalGeral,
    };

    try {
      if (orcamentoParaEditar) {
        const { error } = await supabase
          .from("financeiro_orcamentos")
          .update(payload)
          .eq("id", orcamentoParaEditar.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("financeiro_orcamentos")
          .insert([payload]);
        if (error) throw error;
      }
      alert("Orçamento salvo com sucesso!");
      onSuccess();
      onClose();
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calculator size={24} className="text-primary" />
            {orcamentoParaEditar ? "Editar Orçamento" : "Novo Orçamento"}
          </h2>
          <button onClick={onClose}>
            <X size={24} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form
            id="form-orcamento"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Cliente
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                  <select
                    name="entidade_id"
                    value={formData.entidade_id}
                    onChange={handleChange}
                    className="w-full pl-10 p-2 border rounded-lg bg-white h-10"
                    required
                  >
                    <option value="">Selecione o Cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Data Emissão
                </label>
                <input
                  type="date"
                  name="data_emissao"
                  value={formData.data_emissao}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg h-10"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Validade
                </label>
                <input
                  type="date"
                  name="data_validade"
                  value={formData.data_validade}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg h-10"
                />
              </div>
              <div className="md:col-span-9">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Título / Descrição do Orçamento
                </label>
                <input
                  type="text"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  placeholder="Ex: Reforma da Fachada"
                  className="w-full p-2 border rounded-lg h-10"
                  required
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg bg-white h-10"
                >
                  <option value="pendente">Pendente</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="rejeitado">Rejeitado</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            </div>

            <hr className="border-gray-100" />
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">
                Itens do Orçamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-4 items-end">
                <div className="md:col-span-6">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Descrição do Item
                  </label>
                  <input
                    placeholder="Ex: Mão de obra dia"
                    value={novoItem.descricao}
                    onChange={(e) =>
                      setNovoItem({ ...novoItem, descricao: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Qtd
                  </label>
                  <input
                    type="number"
                    value={novoItem.qtd}
                    onChange={(e) =>
                      setNovoItem({ ...novoItem, qtd: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Valor Unit (R$)
                  </label>
                  <input
                    type="number"
                    value={novoItem.valor}
                    onChange={(e) =>
                      setNovoItem({ ...novoItem, valor: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full bg-primary text-white p-2 rounded-lg hover:bg-[#3A4A3E] transition-colors flex justify-center items-center h-[38px]"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                    <tr>
                      <th className="p-3">Descrição</th>
                      <th className="p-3 text-center">Qtd</th>
                      <th className="p-3 text-right">Unitário</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.itens.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-4 text-center text-gray-400 italic"
                        >
                          Nenhum item adicionado.
                        </td>
                      </tr>
                    ) : (
                      formData.itens.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-700">
                            {item.descricao}
                          </td>
                          <td className="p-3 text-center">{item.qtd}</td>
                          <td className="p-3 text-right">
                            {formatMoney(item.valor)}
                          </td>
                          <td className="p-3 text-right font-bold">
                            {formatMoney(item.total)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold text-gray-800">
                    <tr>
                      <td
                        colSpan="3"
                        className="p-3 text-right uppercase text-xs"
                      >
                        Total Geral
                      </td>
                      <td className="p-3 text-right text-lg text-primary">
                        {formatMoney(totalGeral)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                Observações / Condições de Pagamento
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg h-24 resize-none"
                placeholder="Ex: Pagamento 50% na entrada e 50% na entrega..."
              />
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
            form="form-orcamento"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded font-bold hover:bg-[#3A4A3E] flex items-center gap-2 text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar Orçamento"} <Save size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
