import { supabase } from "./supabaseClient";

/**
 * Service para operações com pacientes / evoluções / plantoes / sinais / medicamentos / historico
 * Centraliza chamadas ao Supabase, tratamento de erros e upload de arquivos.
 */
export const pacientesService = {
  async fetchPaciente(id) {
    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async fetchAllRelated(pacienteId, options = {}) {
    const limitEvolucoes = options.limitEvolucoes ?? 100;
    const limitSinais = options.limitSinais ?? 20;

    const [histRes, medRes, sinaisRes, evoRes, plantoesRes, funcRes] =
      await Promise.all([
        supabase
          .from("historico_clinico")
          .select("*")
          .eq("paciente_id", pacienteId)
          .order("created_at", { ascending: false }),
        supabase
          .from("medicamentos")
          .select("*")
          .eq("paciente_id", pacienteId)
          .order("created_at", { ascending: false }),
        supabase
          .from("sinais_vitais")
          .select("*")
          .eq("paciente_id", pacienteId)
          .order("data_afericao", { ascending: false })
          .limit(limitSinais),
        supabase
          .from("evolucoes")
          .select("*")
          .eq("paciente_id", pacienteId)
          .order("data_registro", { ascending: false })
          .limit(limitEvolucoes),
        supabase
          .from("plantoes")
          .select("*, funcionarios(nome_completo)")
          .eq("paciente_id", pacienteId)
          .order("data_plantao", { ascending: true }),
        supabase
          .from("funcionarios")
          .select("id, nome_completo")
          .eq("status", "ativo")
          .order("nome_completo"),
      ]);

    const errors = [histRes, medRes, sinaisRes, evoRes, plantoesRes, funcRes]
      .map((r) => r.error)
      .filter(Boolean);
    if (errors.length) {
      throw errors[0];
    }

    return {
      historico: histRes.data || [],
      medicamentos: medRes.data || [],
      sinais: sinaisRes.data || [],
      evolucoes: evoRes.data || [],
      plantoes: plantoesRes.data || [],
      funcionarios: funcRes.data || [],
    };
  },

  async fetchEvolucoes(pacienteId) {
    const { data, error } = await supabase
      .from("evolucoes")
      .select("*")
      .eq("paciente_id", pacienteId)
      .order("data_registro", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createEvolucao(payload) {
    const { data, error } = await supabase
      .from("evolucoes")
      .insert([payload])
      .select();
    if (error) throw error;
    return data && data[0];
  },

  async updateEvolucao(id, payload) {
    const { data, error } = await supabase
      .from("evolucoes")
      .update(payload)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data && data[0];
  },

  async deleteEvolucao(id) {
    const { data, error } = await supabase
      .from("evolucoes")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return data;
  },

  async uploadEvolucaoArquivo(folder, file) {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("evolucoes")
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("evolucoes")
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  },

  async deleteFromTable(table, id) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async createHistorico(payload) {
    const { data, error } = await supabase
      .from("historico_clinico")
      .insert([payload])
      .select();
    if (error) throw error;
    return data && data[0];
  },

  async createMedicamento(payload) {
    const { data, error } = await supabase
      .from("medicamentos")
      .insert([payload])
      .select();
    if (error) throw error;
    return data && data[0];
  },

  async createSinais(payload) {
    const { data, error } = await supabase
      .from("sinais_vitais")
      .insert([payload])
      .select();
    if (error) throw error;
    return data && data[0];
  },

  async createPlantao(payload) {
    const { data, error } = await supabase
      .from("plantoes")
      .insert([payload])
      .select("*, funcionarios(nome_completo)");
    if (error) throw error;
    return data && data[0];
  },

  async updatePlantao(id, payload) {
    const { data, error } = await supabase
      .from("plantoes")
      .update(payload)
      .eq("id", id)
      .select("*, funcionarios(nome_completo)");
    if (error) throw error;
    return data && data[0];
  },

  async updatePaciente(id, updates) {
    const { data, error } = await supabase
      .from("pacientes")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data && data[0];
  },
};
