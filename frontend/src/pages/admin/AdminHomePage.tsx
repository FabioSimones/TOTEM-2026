import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { logout } from "../../services/authService";
import { clearSession, getAccessToken, getRefreshToken, getStoredUsuario } from "../../services/tokenStorage";
import type { UsuarioAutenticadoResponse } from "../../types/auth";
import { isOperador, isSuperAdmin } from "../../utils/adminScope";

const ROTULO_PERFIL: Record<UsuarioAutenticadoResponse["perfil"], string> = {
  SUPER_ADMIN: "Super administrador",
  ADMIN_RESTAURANTE: "Administrador do restaurante",
  OPERADOR_CAIXA: "Operador de caixa",
  OPERADOR_COZINHA: "Operador de cozinha",
};

interface AreaAdmin {
  nome: string;
  rota?: string;
  /** true = exige SUPER_ADMIN (backend bloqueia os demais perfis com 403). */
  apenasSuperAdmin?: boolean;
  /**
   * true = some para OPERADOR_CAIXA/OPERADOR_COZINHA (TASK-090), mesmo esses perfis não sendo
   * "apenasSuperAdmin" — hoje só "Usuários" usa isso (SUPER_ADMIN e ADMIN_RESTAURANTE gerenciam,
   * operadores nunca acessam esse módulo).
   */
  ocultarParaOperador?: boolean;
}

const AREAS_ADMIN: AreaAdmin[] = [
  { nome: "Dashboard", rota: "/admin/dashboard" },
  { nome: "Restaurantes", rota: "/admin/restaurantes", apenasSuperAdmin: true },
  { nome: "Dispositivos", rota: "/admin/dispositivos" },
  { nome: "Categorias", rota: "/admin/categorias" },
  { nome: "Produtos", rota: "/admin/produtos" },
  { nome: "Usuários", rota: "/admin/usuarios", ocultarParaOperador: true },
  { nome: "Pedidos", rota: "/admin/pedidos" },
];

export function AdminHomePage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<UsuarioAutenticadoResponse | null>(null);

  useEffect(() => {
    const usuarioSalvo = getStoredUsuario();
    if (!getAccessToken() || !usuarioSalvo) {
      navigate("/admin/login", { replace: true });
      return;
    }
    setUsuario(usuarioSalvo);
  }, [navigate]);

  async function handleSair() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await logout({ refreshToken });
      } catch {
        // Best-effort: mesmo se o backend falhar (ex.: já expirado, rede indisponível),
        // a sessão local é sempre limpa — o usuário não pode ficar "preso" logado.
      }
    }
    clearSession();
    navigate("/admin/login", { replace: true });
  }

  if (!usuario) {
    return null;
  }

  const superAdmin = isSuperAdmin(usuario);
  const operador = isOperador(usuario);
  const areasVisiveis = AREAS_ADMIN.filter(
    (area) => (superAdmin || !area.apenasSuperAdmin) && (!operador || !area.ocultarParaOperador),
  );

  return (
    <AppLayout title="Painel Administrativo" description="Gestão de restaurantes, dispositivos, categorias, produtos, usuários e pedidos.">
      <section className="admin-dashboard">
        <div className="admin-dashboard__usuario">
          <div>
            <p className="admin-dashboard__usuario-nome">{usuario.nome}</p>
            <p className="admin-dashboard__usuario-detalhe">{usuario.email}</p>
            <p className="admin-dashboard__usuario-detalhe">{ROTULO_PERFIL[usuario.perfil]}</p>
          </div>
          <button type="button" className="admin-dashboard__sair" onClick={() => void handleSair()}>
            Sair
          </button>
        </div>

        {!superAdmin && (
          <p className="totem-estado">Você está operando apenas no restaurante vinculado à sua conta.</p>
        )}

        <div className="admin-dashboard__areas">
          {areasVisiveis.map((area) =>
            area.rota ? (
              <Link key={area.nome} to={area.rota} className="admin-dashboard__area-card admin-dashboard__area-card--link">
                <span>{area.nome}</span>
              </Link>
            ) : (
              <div key={area.nome} className="admin-dashboard__area-card">
                <span>{area.nome}</span>
                <span className="admin-dashboard__area-card-tag">Em breve</span>
              </div>
            ),
          )}
        </div>
      </section>
    </AppLayout>
  );
}
