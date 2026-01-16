import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { X, Save } from "lucide-react";

export default function NovoFornecedorModal({
  onClose,
  onSuccess,
  fornecedorParaEditar = null,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo_pessoa: "juridica",
    cpf_cnpj: "",
    nome: "",
    nome_fantasia: "",
    tipo_relacao: "fornecedor",
    email: "",
    telefone_celular: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    observacoes: "",
    indicador_ie: "nao_contribuinte",
    inscricao_estadual: "",
    inscricao_municipal: "",
    inscricao_suframa: "",
    optante_simples: false,
  });

  // Load data if editing
  useEffect(() => {
    if (fornecedorParaEditar) {
      setFormData({
        tipo_pessoa: fornecedorParaEditar.tipo_pessoa || "juridica",
        cpf_cnpj: fornecedorParaEditar.cpf_cnpj || "",
        nome: fornecedorParaEditar.nome || "",
        nome_fantasia: fornecedorParaEditar.nome_fantasia || "",
        tipo_relacao: fornecedorParaEditar.tipo_relacao || "fornecedor",
        email: fornecedorParaEditar.email || "",
        telefone_celular: fornecedorParaEditar.telefone_celular || "",
        cep: fornecedorParaEditar.cep || "",
        endereco: fornecedorParaEditar.endereco || "",
        numero: fornecedorParaEditar.numero || "",
        bairro: fornecedorParaEditar.bairro || "",
        cidade: fornecedorParaEditar.cidade || "",
        estado: fornecedorParaEditar.estado || "",
        observacoes: fornecedorParaEditar.observacoes || "",
        indicador_ie: fornecedorParaEditar.indicador_ie || "nao_contribuinte",
        inscricao_estadual: fornecedorParaEditar.inscricao_estadual || "",
        inscricao_municipal: fornecedorParaEditar.inscricao_municipal || "",
        inscricao_suframa: fornecedorParaEditar.inscricao_suframa || "",
        optante_simples: fornecedorParaEditar.optante_simples || false,
      });
    }
  }, [fornecedorParaEditar]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSimplesChange = (valor) => {
    setFormData((prev) => ({ ...prev, optante_simples: valor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, tipo_relacao: "fornecedor" };

      if (fornecedorParaEditar) {
        // UPDATE Logic
        const { error } = await supabase
          .from("financeiro_entidades")
          .update(payload)
          .eq("id", fornecedorParaEditar.id);

        if (error) throw error;
        alert("Fornecedor atualizado com sucesso!");
      } else {
        // INSERT Logic
        const { error } = await supabase
          .from("financeiro_entidades")
          .insert([payload]);

        if (error) throw error;
        alert("Cadastro realizado com sucesso!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarCNPJ = async () => {
    const cnpjLimpo = formData.cpf_cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      alert("Por favor, digite um CNPJ válido com 14 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`
      );
      if (!response.ok) throw new Error("CNPJ não encontrado ou erro na API.");
      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        nome: data.razao_social,
        nome_fantasia: data.nome_fantasia || data.razao_social,
        cep: data.cep,
        endereco: data.logradouro,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.municipio,
        estado: data.uf,
        email: data.email || "",
        telefone_celular: data.ddd_telefone_1 || "",
        optante_simples: data.opcao_pelo_simples || false,
      }));
    } catch (error) {
      alert("Erro ao buscar CNPJ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {fornecedorParaEditar ? "Editar Fornecedor" : "Novo Fornecedor"}
          </h2>
          <button onClick={onClose}>
            <X size={24} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <form
            id="form-entidade"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* 1. DADOS GERAIS */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">
                Dados Gerais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Tipo de Pessoa *
                  </label>
                  <select
                    name="tipo_pessoa"
                    value={formData.tipo_pessoa}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="juridica">Jurídica</option>
                    <option value="fisica">Física</option>
                    <option value="estrangeira">Estrangeira</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    CPF/CNPJ
                  </label>
                  <div className="flex gap-2">
                    <input
                      name="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      placeholder="Apenas números"
                    />
                    <button
                      type="button"
                      onClick={handleBuscarCNPJ}
                      className="px-3 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-200 hover:bg-blue-100"
                    >
                      Buscar
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Nome Fantasia *
                  </label>
                  <input
                    name="nome_fantasia"
                    value={formData.nome_fantasia}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Razão Social / Nome *
                  </label>
                  <input
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. INFORMAÇÕES FISCAIS */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-gray-700">Informações Fiscais</h3>

                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-gray-500 text-xs">
                    Optante pelo Simples?
                  </span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="optante_simples"
                      checked={formData.optante_simples === true}
                      onChange={() => handleSimplesChange(true)}
                    />{" "}
                    Sim
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="optante_simples"
                      checked={formData.optante_simples === false}
                      onChange={() => handleSimplesChange(false)}
                    />{" "}
                    Não
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Indicador de IE
                  </label>
                  <select
                    name="indicador_ie"
                    value={formData.indicador_ie}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="nao_contribuinte">Não Contribuinte</option>
                    <option value="contribuinte">Contribuinte</option>
                    <option value="contribuinte_isento">
                      Contribuinte Isento
                    </option>
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Inscrição Estadual
                  </label>
                  <input
                    name="inscricao_estadual"
                    value={formData.inscricao_estadual}
                    onChange={handleChange}
                    className="w-full p-2 border rounded disabled:bg-gray-100"
                    disabled={formData.indicador_ie === "nao_contribuinte"}
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Inscrição Municipal
                  </label>
                  <input
                    name="inscricao_municipal"
                    value={formData.inscricao_municipal}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Inscrição Suframa
                  </label>
                  <input
                    name="inscricao_suframa"
                    value={formData.inscricao_suframa}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* 3. ENDEREÇO */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">
                Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    CEP
                  </label>
                  <input
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Logradouro
                  </label>
                  <input
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Número
                  </label>
                  <input
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Bairro
                  </label>
                  <input
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Cidade
                  </label>
                  <input
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Estado
                  </label>
                  <input
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* 4. CONTATO E OBSERVAÇÕES */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">
                Contato e Observações
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    E-mail
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Celular/Telefone
                  </label>
                  <input
                    name="telefone_celular"
                    value={formData.telefone_celular}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
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
                  className="w-full p-2 border rounded h-20 resize-none"
                />
              </div>
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
            form="form-entidade"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2 text-sm shadow-md"
          >
            {loading ? (
              "Salvando..."
            ) : (
              <>
                <Save size={18} /> Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
