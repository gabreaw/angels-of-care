import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function ProtectedRoute({ restrictTo }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    checkPermission();
  }, []);

  async function checkPermission() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      let roleEncontrada = null;

      const { data: funcionario } = await supabase
        .from("funcionarios")
        .select("role")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (funcionario) {
        roleEncontrada = funcionario.role; 
      } else {
        const { data: paciente } = await supabase
          .from("pacientes")
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (paciente) {
          roleEncontrada = "cliente";
        }
      }

      setUserRole(roleEncontrada);

      if (!roleEncontrada) {
        setIsAuthorized(false); 
      } else if (!restrictTo || restrictTo === roleEncontrada) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error("Erro de permissão:", error);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    if (userRole === "cliente") return <Navigate to="/portal/home" replace />;
    if (userRole === "prestador") return <Navigate to="/app/home" replace />;
    if (userRole === "admin") return <Navigate to="/admin" replace />;

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
