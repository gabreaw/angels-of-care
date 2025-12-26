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
      // 1. Tenta fazer login no sistema de Autenticação
      const {
        data: { user },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. Se logou, vai na tabela de funcionários ver quem é essa pessoa
      const { data: funcionario, error: funcError } = await supabase
        .from("funcionarios")
        .select("role")
        .eq("auth_id", user.id)
        .single();

      // Se não achou o funcionário vinculado ao login
      if (funcError || !funcionario) {
        throw new Error(
          "Usuário não vinculado a nenhum perfil de funcionário."
        );
      }

      // 3. Redirecionamento Baseado no Cargo (Role)
      if (funcionario.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/app/home"); // Área do Prestador
      }
    } catch (error) {
      alert("Erro ao entrar: " + error.message);
      // Se deu erro na verificação do cargo, desloga para não ficar preso
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
          <p className="text-darkText/60 mt-2">
            Insira suas credenciais para continuar.
          </p>
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
            className="w-full bg-primary hover:bg-[#3A4A3E] text-white font-bold py-3 rounded-lg transition-all shadow-lg flex justify-center"
          >
            {loading ? "Verificando..." : "Acessar Painel"}
          </button>
        </form>
      </div>
    </div>
  );
}
