import { Link } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../auth/useAuth";
import { getStoredDispositivo } from "../services/tokenStorage";

/**
 * Fallback para qualquer rota desconhecida (auditoria, achado #8 — o app antes renderizava uma
 * tela em branco). Não redireciona automaticamente para nenhuma área sem validar o contexto —
 * apenas oferece links seguros de retorno, conforme a sessão local disponível.
 */
export function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const dispositivo = getStoredDispositivo();
  const rotaDispositivo =
    dispositivo?.tipoDispositivo === "TOTEM" ||
    dispositivo?.tipoDispositivo === "CAIXA" ||
    dispositivo?.tipoDispositivo === "COZINHA"
      ? `/${dispositivo.tipoDispositivo.toLowerCase()}`
      : null;

  return (
    <AppLayout title="Página não encontrada" description="O endereço acessado não existe." centralizado>
      <p className="totem-estado">A página que você tentou acessar não existe.</p>
      <div className="admin-dashboard__areas">
        {isAuthenticated && (
          <Link to="/admin" className="admin-dashboard__area-card admin-dashboard__area-card--link">
            <span>Ir para o painel administrativo</span>
          </Link>
        )}
        {rotaDispositivo && (
          <Link to={rotaDispositivo} className="admin-dashboard__area-card admin-dashboard__area-card--link">
            <span>Ir para a interface deste dispositivo</span>
          </Link>
        )}
        <Link to="/login" className="admin-dashboard__area-card admin-dashboard__area-card--link">
          <span>Ir para o login</span>
        </Link>
        <Link to="/ativar-dispositivo" className="admin-dashboard__area-card admin-dashboard__area-card--link">
          <span>Ativar um dispositivo</span>
        </Link>
      </div>
    </AppLayout>
  );
}
