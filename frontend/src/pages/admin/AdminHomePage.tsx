import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { clearSession, getAccessToken, getStoredUsuario } from "../../services/tokenStorage";
import type { UsuarioAutenticadoResponse } from "../../types/auth";
import { isSuperAdmin } from "../../utils/adminScope";

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
}

const AREAS_ADMIN: AreaAdmin[] = [
  { nome: "Restaurantes", rota: "/admin/restaurantes", apenasSuperAdmin: true },
  { nome: "Dispositivos", rota: "/admin/dispositivos" },
  { nome: "Categorias", rota: "/admin/categorias" },
  { nome: "Produtos", rota: "/admin/produtos" },
  { nome: "Usuários", rota: "/admin/usuarios", apenasSuperAdmin: true },
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

  function handleSair() {
    clearSession();
    navigate("/admin/login", { replace: true });
  }

  if (!usuario) {
    return null;
  }

  const superAdmin = isSuperAdmin(usuario);
  const areasVisiveis = AREAS_ADMIN.filter((area) => superAdmin || !area.apenasSuperAdmin);

  return (
    <AppLayout title="Painel Administrativo" description="Gestão de restaurantes, dispositivos, categorias, produtos e usuários.">
      <section className="admin-dashboard">
        <div className="admin-dashboard__usuario">
          <div>
            <p className="admin-dashboard__usuario-nome">{usuario.nome}</p>
            <p className="admin-dashboard__usuario-detalhe">{usuario.email}</p>
            <p className="admin-dashboard__usuario-detalhe">{ROTULO_PERFIL[usuario.perfil]}</p>
          </div>
          <button type="button" className="admin-dashboard__sair" onClick={handleSair}>
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
