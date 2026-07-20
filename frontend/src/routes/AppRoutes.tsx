import { Navigate, Route, Routes } from "react-router-dom";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AtivarDispositivoPage } from "../pages/AtivarDispositivoPage";
import { TotemHomePage } from "../pages/totem/TotemHomePage";
import { CaixaHomePage } from "../pages/caixa/CaixaHomePage";
import { CozinhaHomePage } from "../pages/cozinha/CozinhaHomePage";
import { LoginPage } from "../pages/auth/LoginPage";
import { AdminHomePage } from "../pages/admin/AdminHomePage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminDispositivosPage } from "../pages/admin/AdminDispositivosPage";
import { AdminRestaurantesPage } from "../pages/admin/AdminRestaurantesPage";
import { AdminCategoriasPage } from "../pages/admin/AdminCategoriasPage";
import { AdminProdutosPage } from "../pages/admin/AdminProdutosPage";
import { AdminUsuariosPage } from "../pages/admin/AdminUsuariosPage";
import { AdminPedidosPage } from "../pages/admin/AdminPedidosPage";
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

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dispositivos"
        element={
          <ProtectedRoute>
            <AdminDispositivosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/restaurantes"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
              <AdminRestaurantesPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categorias"
        element={
          <ProtectedRoute>
            <AdminCategoriasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/produtos"
        element={
          <ProtectedRoute>
            <AdminProdutosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN_RESTAURANTE"]}>
              <AdminUsuariosPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pedidos"
        element={
          <ProtectedRoute>
            <AdminPedidosPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
