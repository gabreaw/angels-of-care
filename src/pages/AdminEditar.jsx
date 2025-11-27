import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, MapPin } from 'lucide-react';

export default function AdminEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    rg: '',
    orgao_emissor: '',
    nacionalidade: '',
    email: '',
    telefone: '',
    estado_civil: '',
    cnpj: '',
    // Endereço Fragmentado
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: '',
    // Profissional
    funcao: '',
    coren_numero: ''
  });

  // 1. Busca os dados atuais ao abrir a tela
  useEffect(() => {
    async function fetchDados() {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        alert('Erro ao carregar: ' + error.message);
        navigate('/admin/funcionarios');
      } else {
        // Preenche o formulário com o que veio do banco
        setFormData(prev => ({ ...prev, ...data }));
      }
      setLoading(false);
    }
    fetchDados();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Busca CEP (Reaproveitada)
  const buscarCep = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
          cep: cep
        }));
      }
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Atualiza o endereço formatado caso tenha mudado alguma parte
    const enderecoFormatado = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade}/${formData.estado} (${formData.cep})`;

    const { error } = await supabase
      .from('funcionarios')
      .update({ 
        ...formData, 
        endereco_completo: enderecoFormatado 
      })
      .eq('id', id); // Importante: Atualiza SÓ esse ID

    setSaving(false);

    if (error) {
      alert('Erro ao atualizar: ' + error.message);
    } else {
      alert('Dados atualizados com sucesso!');
      navigate(`/admin/funcionarios/${id}`); // Volta para os detalhes
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-beige overflow-hidden">
        <div className="bg-primary p-6 flex justify-between items-center">
          <h1 className="text-2xl font-serif text-white font-bold">Editar Prestador</h1>
          <Link to={`/admin/funcionarios/${id}`} className="text-white/80 hover:text-white flex gap-2 items-center text-sm">
            <ArrowLeft size={18} /> Cancelar
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* DADOS PESSOAIS */}
          <section>
            <h3 className="text-lg font-bold text-primary mb-4 border-b pb-2">Dados Pessoais</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-sage">Nome Completo</label>
                <input name="nome_completo" value={formData.nome_completo} onChange={handleChange} className="input-padrao" />
              </div>
              <div>
                <label className="text-xs font-bold text-sage">CPF</label>
                <input name="cpf" value={formData.cpf} onChange={handleChange} className="input-padrao bg-gray-50" readOnly />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs font-bold text-sage">RG</label>
                    <input name="rg" value={formData.rg || ''} onChange={handleChange} className="input-padrao" />
                </div>
                <div>
                    <label className="text-xs font-bold text-sage">Org. Emissor</label>
                    <input name="orgao_emissor" value={formData.orgao_emissor || ''} onChange={handleChange} placeholder="Ex: SSP/SC" className="input-padrao" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-sage">Nacionalidade</label>
                <input name="nacionalidade" value={formData.nacionalidade || ''} onChange={handleChange} className="input-padrao" />
              </div>
              <div>
                <label className="text-xs font-bold text-sage">Estado Civil</label>
                <select name="estado_civil" value={formData.estado_civil} onChange={handleChange} className="input-padrao bg-white">
                    <option value="">Selecione</option>
                    <option>Solteiro(a)</option>
                    <option>Casado(a)</option>
                    <option>Divorciado(a)</option>
                    <option>Viúvo(a)</option>
                    <option>União Estável</option>
                </select>
              </div>
            </div>
          </section>

          {/* ENDEREÇO */}
          <section className="bg-sage/5 p-4 rounded-xl border border-sage/20">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><MapPin size={18}/> Endereço</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <label className="text-xs font-bold text-sage">CEP</label>
                <input name="cep" value={formData.cep || ''} onChange={handleChange} onBlur={buscarCep} className="input-padrao" />
              </div>
              <div className="col-span-3">
                <label className="text-xs font-bold text-sage">Rua</label>
                <input name="logradouro" value={formData.logradouro || ''} onChange={handleChange} className="input-padrao" />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold text-sage">Número</label>
                <input name="numero" value={formData.numero || ''} onChange={handleChange} className="input-padrao" />
              </div>
              <div className="col-span-3">
                <label className="text-xs font-bold text-sage">Bairro</label>
                <input name="bairro" value={formData.bairro || ''} onChange={handleChange} className="input-padrao" />
              </div>
              <div className="col-span-3">
                <label className="text-xs font-bold text-sage">Cidade</label>
                <input name="cidade" value={formData.cidade || ''} onChange={handleChange} className="input-padrao" />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold text-sage">UF</label>
                <input name="estado" value={formData.estado || ''} onChange={handleChange} className="input-padrao" />
              </div>
            </div>
          </section>

          <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg">
            <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
      <style>{`
        .input-padrao { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; outline: none; }
        .input-padrao:focus { border-color: #4B5E4F; box-shadow: 0 0 0 2px rgba(75, 94, 79, 0.2); }
      `}</style>
    </div>
  );
}