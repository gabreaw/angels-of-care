import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async"; // <--- Importante

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

// Importações de Pacientes
import AdminPacientes from "./pages/AdminPacientes";
import AdminPacientesNovo from "./pages/AdminPacientesNovo";
import AdminPacientesDetalhes from "./pages/AdminPacientesDetalhes";

import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Angels of Care | Cuidadores de Idosos em Chapecó</title>
        <meta
          name="description"
          content="Cuidado humanizado para idosos, pós-operatório e gestantes em Chapecó/SC. Profissionais verificados e atendimento domiciliar 24h."
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.angelsofcare.com.br/" />
        <meta
          property="og:title"
          content="Angels of Care - Cuidado que conforta"
        />
        <meta
          property="og:description"
          content="Precisa de cuidador em Chapecó? Conheça nossa equipe qualificada. Atendimento domiciliar e hospitalar."
        />
        <meta
          property="og:image"
          content="https://www.angelsofcare.com.br/imagem-de-capa.jpg"
        />

        <meta name="theme-color" content="#4B5E4F" />
      </Helmet>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/seja-parceiro" element={<CadastroParceiro />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
