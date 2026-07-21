import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useAdminSidebarCollapsed } from "../../hooks/useAdminSidebarCollapsed";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

const NAV_ID = "admin-sidebar-nav";

/**
 * TASK-118: casca administrativa (sidebar + topbar + conteúdo) — montada uma única vez pela rota
 * pai `/admin` em `AppRoutes.tsx`; as páginas filhas (`<Outlet/>`) só renderizam seu conteúdo, sem
 * `AppLayout`/cabeçalho próprio (ver `AdminTopbar`, responsável único pelo `h1` de cada tela).
 *
 * Sessão/redirecionamento já são responsabilidade de `ProtectedRoute` (que envolve esta rota) —
 * por isso `usuario` é tratado como praticamente sempre presente aqui, com um guard defensivo só
 * para satisfazer o tipo (`AuthProvider` garante `user`/`isAuthenticated` sempre em sincronia).
 */
export function AdminLayout() {
  const navigate = useNavigate();
  const { user: usuario, logout } = useAuth();
  const [collapsed, setCollapsed] = useAdminSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hamburguerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    // Copiado para uma variável local — o valor do ref no momento em que o efeito rodou, não o
    // valor (possivelmente diferente) que existiria quando a limpeza executar de fato.
    const botaoHamburguer = hamburguerRef.current;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      botaoHamburguer?.focus();
    };
  }, [mobileOpen]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className={"admin-layout" + (collapsed ? " admin-layout--collapsed" : "")}>
      <AdminSidebar
        perfil={usuario.perfil}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        navId={NAV_ID}
      />

      <div className="admin-layout__main">
        <AdminTopbar
          usuario={usuario}
          onLogout={() => void handleLogout()}
          onOpenMobileMenu={() => setMobileOpen((atual) => !atual)}
          mobileMenuOpen={mobileOpen}
          navId={NAV_ID}
          hamburguerRef={hamburguerRef}
        />

        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
