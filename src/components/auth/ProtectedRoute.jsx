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

      const { data: funcionario, error } = await supabase
        .from("funcionarios")
        .select("role")
        .eq("auth_id", user.id)
        .single();

      if (error || !funcionario) {
        console.error("Erro ao verificar permissão:", error);
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setUserRole(funcionario.role);
      if (!restrictTo || restrictTo === funcionario.role) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    if (restrictTo === "admin" && userRole === "prestador") {
      return <Navigate to="/app/home" replace />;
    }
    if (restrictTo === "prestador" && userRole === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
