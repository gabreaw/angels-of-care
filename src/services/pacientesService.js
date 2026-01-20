import { supabase } from "./supabaseClient";

/**
 * Service para operações com pacientes / evoluções
 */
export const pacientesService = {
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
    const { data, error } = await supabase.from("evolucoes").insert([payload]);
    if (error) throw error;
    return data;
  },

  async updateEvolucao(id, payload) {
    const { data, error } = await supabase
      .from("evolucoes")
      .update(payload)
      .eq("id", id);
    if (error) throw error;
    return data;
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
};
