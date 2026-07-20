import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Guard único para as rotas que exigem sessão de usuário humano — substitui o guard
 * `useEffect(() => { if (!getAccessToken() || !getStoredUsuario()) navigate(...) }, ...)` que
 * antes estava duplicado em 8 páginas administrativas (auditoria, achado de duplicação #1).
 *
 * Preserva a rota originalmente solicitada em `location.state.from`, para que o LoginPage possa
 * devolver o usuário ao destino correto após autenticar (em vez de sempre cair em `/admin`).
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
