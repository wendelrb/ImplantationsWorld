import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/app/Dashboard";
import Implementations from "@/pages/app/Implementations";
import ImplementationDetail from "@/pages/app/ImplementationDetail";
import Clients from "@/pages/app/Clients";
import Templates from "@/pages/app/Templates";
import PublicStatus from "@/pages/public/PublicStatus";
import NotFound from "@/pages/NotFound";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app" replace /> },
  { path: "/login", element: <Login /> },

  // Rota pública — sem AppShell, sem autenticação. É o link que vai
  // pro cliente final via WhatsApp.
  { path: "/status/:token", element: <PublicStatus /> },

  {
    path: "/app",
    element: (
      <AppShell>
        <Dashboard />
      </AppShell>
    ),
  },
  {
    path: "/app/implantacoes",
    element: (
      <AppShell>
        <Implementations />
      </AppShell>
    ),
  },
  {
    path: "/app/implantacoes/:id",
    element: (
      <AppShell>
        <ImplementationDetail />
      </AppShell>
    ),
  },
  {
    path: "/app/clientes",
    element: (
      <AppShell>
        <Clients />
      </AppShell>
    ),
  },
  {
    path: "/app/templates",
    element: (
      <AppShell>
        <Templates />
      </AppShell>
    ),
  },
  { path: "*", element: <NotFound /> },
]);
