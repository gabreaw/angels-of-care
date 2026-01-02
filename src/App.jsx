import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";

import Home from "./pages/Home";
import CadastroParceiro from "./pages/CadastroParceiro";
import CadastroExtra from "./pages/CadastroExtra";
import LoginPage from "./pages/LoginPage";

import Dashboard from "./pages/Dashboard";
import AdminListaFuncionarios from "./pages/AdminListaFuncionarios";
import AdminFuncionarios from "./pages/AdminFuncionarios";
import AdminDetalhes from "./pages/AdminDetalhes";
import AdminEditar from "./pages/AdminEditar";

import AdminPacientes from "./pages/AdminPacientes";
import AdminPacientesNovo from "./pages/AdminPacientesNovo";
import AdminPacientesDetalhes from "./pages/AdminPacientesDetalhes";
import AdminEscalas from "./pages/AdminEscalas";
import AdminConfirmacaoEscala from "./pages/AdminConfirmacaoEscala";

import ProviderHome from "./pages/ProviderHome";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProviderPaciente from "./pages/ProviderPaciente";
import ClientHome from "./pages/ClientHome";

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/seja-parceiro" element={<CadastroParceiro />} />
          <Route path="/seja-parceiro-extra" element={<CadastroExtra />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute restrictTo="admin" />}>
            <Route path="/admin" element={<Dashboard />} />

            <Route
              path="/admin/funcionarios"
              element={<AdminListaFuncionarios />}
            />
            <Route
              path="/admin/funcionarios/novo"
              element={<AdminFuncionarios />}
            />
            <Route path="/admin/funcionarios/:id" element={<AdminDetalhes />} />
            <Route
              path="/admin/funcionarios/:id/editar"
              element={<AdminEditar />}
            />

            <Route path="/admin/pacientes" element={<AdminPacientes />} />
            <Route
              path="/admin/pacientes/novo"
              element={<AdminPacientesNovo />}
            />
            <Route
              path="/admin/pacientes/:id"
              element={<AdminPacientesDetalhes />}
            />
            <Route path="/admin/escalas" element={<AdminEscalas />} />
            <Route
              path="/admin/escalas/confirmacao"
              element={<AdminConfirmacaoEscala />}
            />
          </Route>
          <Route element={<ProtectedRoute restrictTo="prestador" />}>
            <Route path="/app/home" element={<ProviderHome />} />
            <Route path="/app/pacientes/:id" element={<ProviderPaciente />} />
          </Route>
          <Route element={<ProtectedRoute restrictTo="cliente" />}>
            <Route path="/portal/home" element={<ClientHome />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
