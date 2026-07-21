import { Navigate, Route, Routes } from "react-router-dom";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AtivarDispositivoPage } from "../pages/AtivarDispositivoPage";
import { TotemHomePage } from "../pages/totem/TotemHomePage";
import { CaixaHomePage } from "../pages/caixa/CaixaHomePage";
import { CozinhaHomePage } from "../pages/cozinha/CozinhaHomePage";
import { LoginPage } from "../pages/auth/LoginPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminDispositivosPage } from "../pages/admin/AdminDispositivosPage";
import { AdminRestaurantesPage } from "../pages/admin/AdminRestaurantesPage";
import { AdminCategoriasPage } from "../pages/admin/AdminCategoriasPage";
import { AdminProdutosPage } from "../pages/admin/AdminProdutosPage";
import { AdminUsuariosPage } from "../pages/admin/AdminUsuariosPage";
import { AdminPedidosPage } from "../pages/admin/AdminPedidosPage";
import { AdminLayout } from "../components/layout/AdminLayout";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { RoleGuard } from "../auth/RoleGuard";

export function AppRoutes() {
  return (
    <Routes>
      {/* TASK-117: entrada padrão do sistema é o fluxo de ativação de dispositivo (terminais físicos
          são o caso de uso mais comum ao abrir a URL raiz); usuários humanos acessam /login diretamente. */}
      <Route path="/" element={<Navigate to="/ativar-dispositivo" replace />} />

      {/* Login central de usuários humanos (SUPER_ADMIN, ADMIN_RESTAURANTE, operadores). */}
      <Route path="/login" element={<LoginPage />} />
      {/* Compatibilidade temporária — remover junto da migração completa do storage legado. */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />

      {/* Ativação de dispositivo: fluxo técnico de máquina, sempre separado do login de usuário. */}
      <Route path="/ativar-dispositivo" element={<AtivarDispositivoPage />} />

      {/* Totem/Caixa/Cozinha protegem a si mesmas internamente (sessão de DEVICE, não de USER). */}
      <Route path="/totem" element={<TotemHomePage />} />
      <Route path="/caixa" element={<CaixaHomePage />} />
      <Route path="/cozinha" element={<CozinhaHomePage />} />

      {/*
        TASK-118: rotas aninhadas com <Outlet/> — AdminLayout (sidebar + topbar) é montado uma
        única vez pela rota pai; ProtectedRoute continua envolvendo TODO o subárvore /admin/*
        exatamente como envolvia cada rota individualmente antes desta task (mesma proteção, sem
        duplicar a checagem por página). RoleGuard continua por rota filha, preservando o mesmo
        allowedRoles de antes.
      */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        {/* Compatibilidade: /admin/dashboard existia como rota própria antes da fusão dos dois
            "dashboards" (TASK-118) — redireciona para o destino único, /admin. */}
        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="dispositivos" element={<AdminDispositivosPage />} />
        <Route
          path="restaurantes"
          element={
            <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
              <AdminRestaurantesPage />
            </RoleGuard>
          }
        />
        <Route path="categorias" element={<AdminCategoriasPage />} />
        <Route path="produtos" element={<AdminProdutosPage />} />
        <Route
          path="usuarios"
          element={
            <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN_RESTAURANTE"]}>
              <AdminUsuariosPage />
            </RoleGuard>
          }
        />
        <Route path="pedidos" element={<AdminPedidosPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
