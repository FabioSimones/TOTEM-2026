import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTotemSidebarCollapsed } from "../../hooks/useTotemSidebarCollapsed";
import type { CategoriaCardapioResponse } from "../../types/totem";
import { TotemSidebar, type TotemCategoriaSelecionada } from "./TotemSidebar";
import { TotemTopbar } from "./TotemTopbar";

const NAV_ID = "totem-sidebar-nav";

interface TotemLayoutProps {
  categorias: CategoriaCardapioResponse[];
  categoriaSelecionada: TotemCategoriaSelecionada;
  onSelectCategoria: (categoria: TotemCategoriaSelecionada) => void;
  titulo: string;
  descricao?: string | null;
  busca: string;
  onChangeBusca: (valor: string) => void;
  totalItensCarrinho: number;
  /** TASK-120.1: abre o `CartModal` — o carrinho deixou de ser um painel lateral fixo. */
  onAbrirCarrinho: () => void;
  children?: ReactNode;
}

/**
 * TASK-120: casca da tela de autoatendimento (sidebar de categorias + topbar + conteúdo) — próprio
 * do Totem, não reaproveita `AdminLayout`/`OperationalLayout` diretamente (o Totem é voltado ao
 * cliente, não ao operador/administrador), mas segue a mesma arquitetura de colapso/drawer já
 * validada em `AdminLayout` (Escape fecha, scroll do fundo bloqueado, foco devolvido ao hambúrguer).
 */
export function TotemLayout({
  categorias,
  categoriaSelecionada,
  onSelectCategoria,
  titulo,
  descricao,
  busca,
  onChangeBusca,
  totalItensCarrinho,
  onAbrirCarrinho,
  children,
}: TotemLayoutProps) {
  const [collapsed, setCollapsed] = useTotemSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hamburguerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

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

  return (
    <div className={"totem-shell" + (collapsed ? " totem-shell--collapsed" : "")}>
      <TotemSidebar
        categorias={categorias}
        categoriaSelecionada={categoriaSelecionada}
        onSelectCategoria={onSelectCategoria}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        navId={NAV_ID}
      />

      <div className="totem-shell__main">
        <TotemTopbar
          titulo={titulo}
          descricao={descricao}
          busca={busca}
          onChangeBusca={onChangeBusca}
          totalItensCarrinho={totalItensCarrinho}
          onAbrirCarrinho={onAbrirCarrinho}
          onOpenMobileMenu={() => setMobileOpen((atual) => !atual)}
          mobileMenuOpen={mobileOpen}
          navId={NAV_ID}
          hamburguerRef={hamburguerRef}
        />

        <main className="totem-shell__content">{children}</main>
      </div>
    </div>
  );
}
