import { NavLink } from "react-router-dom";
import type { PerfilUsuario } from "../../types/auth";
import { ChevronLeftIcon } from "./AdminIcons";
import { itensVisiveisParaPerfil } from "./adminNav";

interface AdminSidebarProps {
  perfil: PerfilUsuario;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Drawer mobile: só relevante abaixo do breakpoint — `AdminLayout` controla o estado. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  navId: string;
}

/**
 * TASK-118: navegação principal do Admin. A visibilidade dos itens (`itensVisiveisParaPerfil`) é
 * só uma conveniência de UX — as rotas continuam protegidas por `ProtectedRoute`/`RoleGuard`
 * independente do que aparece aqui (auditoria da task: link oculto nunca substitui autorização).
 */
export function AdminSidebar({
  perfil,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  navId,
}: AdminSidebarProps) {
  const itens = itensVisiveisParaPerfil(perfil);
  const classes =
    "admin-sidebar" +
    (collapsed ? " admin-sidebar--collapsed" : "") +
    (mobileOpen ? " admin-sidebar--mobile-open" : "");

  return (
    <>
      {/* Backdrop mobile — só existe/captura clique quando o drawer está aberto. */}
      <div
        className="admin-sidebar__backdrop"
        aria-hidden="true"
        onClick={onCloseMobile}
        hidden={!mobileOpen}
      />

      <nav className={classes} aria-label="Navegação administrativa" id={navId}>
        <div className="admin-sidebar__brand">
          <button
            type="button"
            className="admin-sidebar__collapse-toggle"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expandir menu administrativo" : "Recolher menu administrativo"}
          >
            <ChevronLeftIcon
              className="admin-sidebar__collapse-icon"
              style={{ transform: collapsed ? "rotate(180deg)" : undefined }}
            />
          </button>
          <span className="admin-sidebar__brand-text">
            <span className="admin-sidebar__brand-name">TotemFood</span>
            <span className="admin-sidebar__brand-tagline">Sistema de gestão</span>
          </span>
        </div>

        <ul className="admin-sidebar__list">
          {itens.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/admin"}
                title={item.label}
                aria-label={item.label}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  "admin-sidebar__link" + (isActive ? " admin-sidebar__link--active" : "")
                }
              >
                <item.icon className="admin-sidebar__icon" />
                <span className="admin-sidebar__label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
