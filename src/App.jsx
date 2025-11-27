import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// Páginas Públicas
import Home from "./pages/Home";
import CadastroParceiro from "./pages/CadastroParceiro";
import LoginPage from "./pages/LoginPage";

// Páginas Privadas (Admin)
import Dashboard from "./pages/Dashboard";
import AdminListaFuncionarios from "./pages/AdminListaFuncionarios";
import AdminFuncionarios from "./pages/AdminFuncionarios";
import AdminDetalhes from "./pages/AdminDetalhes";
import AdminEditar from "./pages/AdminEditar";

// Importações de Pacientes (ADICIONADO AQUI)
import AdminPacientes from "./pages/AdminPacientes"; // <--- A Lista
import AdminPacientesNovo from "./pages/AdminPacientesNovo"; // <--- O Cadastro

import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* === ÁREA PÚBLICA === */}
          <Route path="/" element={<Home />} />
          <Route path="/seja-parceiro" element={<CadastroParceiro />} />
          <Route path="/login" element={<LoginPage />} />

          {/* === ÁREA RESTRITA (ADMIN) === */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Dashboard />} />

            {/* Gestão de Prestadores */}
            <Route path="/admin/funcionarios" element={<AdminListaFuncionarios />} />
            <Route path="/admin/funcionarios/novo" element={<AdminFuncionarios />} />
            <Route path="/admin/funcionarios/:id" element={<AdminDetalhes />} />
            <Route path="/admin/funcionarios/:id/editar" element={<AdminEditar />} />

            {/* Gestão de Pacientes (ADICIONADO AQUI) */}
            <Route path="/admin/pacientes" element={<AdminPacientes />} />
            <Route path="/admin/pacientes/novo" element={<AdminPacientesNovo />} />
            
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}