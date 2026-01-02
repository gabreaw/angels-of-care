import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const { data: funcionario } = await supabase
        .from("funcionarios")
        .select("role")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (funcionario) {
        if (funcionario.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/app/home");
        }
        return;
      }
      const { data: cliente } = await supabase
        .from("pacientes")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (cliente) {
        navigate("/portal/home");
        return;
      }

      throw new Error("Usuário sem perfil associado.");
    } catch (error) {
      alert("Erro ao entrar: " + error.message);
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-beige">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-primary font-bold">
            Acesso Restrito
          </h2>
          <p className="text-darkText/60 mt-2">Bem-vindo ao Angels of Care.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-darkText mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-darkText mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#3A4A3E] text-white font-bold py-3 rounded-lg transition-all shadow-lg"
          >
            {loading ? "Entrando..." : "Acessar"}
          </button>
        </form>
      </div>
    </div>
  );
}
