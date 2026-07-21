import type { RefObject } from "react";
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";
import { LogoutIcon, MenuIcon } from "./AdminIcons";
import { encontrarItemPorRota } from "./adminNav";
import type { UsuarioAutenticadoResponse } from "../../types/auth";

const ROTULO_PERFIL: Record<UsuarioAutenticadoResponse["perfil"], string> = {
  SUPER_ADMIN: "Superadministrador",
  ADMIN_RESTAURANTE: "Administrador do restaurante",
  OPERADOR_CAIXA: "Operador de caixa",
  OPERADOR_COZINHA: "Operador de cozinha",
};

interface AdminTopbarProps {
  usuario: UsuarioAutenticadoResponse;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  mobileMenuOpen: boolean;
  navId: string;
  hamburguerRef: RefObject<HTMLButtonElement | null>;
}

/**
 * TASK-118: único lugar que decide o `h1`/descrição de cada tela `/admin/*` (via `ADMIN_NAV_ITEMS`,
 * `useLocation()`) — as páginas não renderizam título próprio, evitando dois `h1` na mesma tela.
 */
export function AdminTopbar({
  usuario,
  onLogout,
  onOpenMobileMenu,
  mobileMenuOpen,
  navId,
  hamburguerRef,
}: AdminTopbarProps) {
  const location = useLocation();
  const item = encontrarItemPorRota(location.pathname);
  const inicial = usuario.nome.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__left">
        <button
          ref={hamburguerRef}
          type="button"
          className="admin-topbar__menu-button"
          onClick={onOpenMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls={navId}
          aria-label={mobileMenuOpen ? "Fechar menu administrativo" : "Abrir menu administrativo"}
        >
          <MenuIcon />
        </button>

        <div className="admin-topbar__titles">
          <h1>{item?.label ?? "Painel Administrativo"}</h1>
          {item?.description && <p className="admin-topbar__description">{item.description}</p>}
        </div>
      </div>

      <div className="admin-topbar__right">
        <ThemeToggle />

        <div className="admin-topbar__user">
          <span className="admin-topbar__avatar" aria-hidden="true">
            {inicial}
          </span>
          <span className="admin-topbar__user-info">
            <span className="admin-topbar__user-name">{usuario.nome}</span>
            <span className="admin-topbar__user-role">{ROTULO_PERFIL[usuario.perfil]}</span>
          </span>
        </div>

        {/* aria-label explícito: em mobile o texto "Sair" fica visualmente oculto (CSS) para caber
            na topbar estreita — sem aria-label, o botão perderia o nome acessível nesse breakpoint. */}
        <button type="button" className="admin-topbar__logout" onClick={onLogout} aria-label="Sair">
          <LogoutIcon />
          <span aria-hidden="true">Sair</span>
        </button>
      </div>
    </header>
  );
}
