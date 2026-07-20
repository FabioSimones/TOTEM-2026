import type { ReactNode } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import type { PerfilUsuario } from "../types/auth";
import { useAuth } from "./useAuth";

interface RoleGuardProps {
  allowedRoles: PerfilUsuario[];
  children: ReactNode;
}

/**
 * Restringe uma rota já protegida por `ProtectedRoute` a um subconjunto de perfis (ex.:
 * `/admin/restaurantes` só para SUPER_ADMIN). Isto só melhora a experiência — o backend
 * (`@PreAuthorize`) continua sendo a autoridade final de autorização; em caso de divergência
 * (ex.: role manipulada no storage), o backend responde 403 e a chamada falha normalmente.
 * Diferente de um 401, este componente nunca limpa a sessão: o usuário está autenticado, só não
 * tem permissão para esta área específica.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    return (
      <AppLayout title="Acesso restrito" description="Você não tem permissão para acessar esta área.">
        <p className="totem-estado">
          Seu perfil não tem permissão para acessar esta página. Se você acredita que isso é um
          engano, procure um administrador.
        </p>
      </AppLayout>
    );
  }

  return <>{children}</>;
}
