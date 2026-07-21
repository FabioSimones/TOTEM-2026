import type { CategoriaCardapioResponse } from "../../types/totem";
import { CategoryIcon } from "./categoryIconResolver";
import { TotemMenuIcon } from "./TotemIcons";

export const TOTEM_TODAS_CATEGORIAS = "todas" as const;
export type TotemCategoriaSelecionada = number | typeof TOTEM_TODAS_CATEGORIAS;

interface TotemSidebarProps {
  categorias: CategoriaCardapioResponse[];
  categoriaSelecionada: TotemCategoriaSelecionada;
  onSelectCategoria: (categoria: TotemCategoriaSelecionada) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Drawer mobile: só relevante abaixo do breakpoint — `TotemLayout` controla o estado. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  navId: string;
}

/**
 * TASK-120: navegação de categorias da tela de autoatendimento. Mesma arquitetura de
 * `AdminSidebar` (colapsar/expandir no desktop, drawer no mobile), mas aqui a seleção filtra o
 * grid de produtos em vez de navegar para outra rota — por isso usa `button`/`aria-current` em vez
 * de `NavLink`.
 */
export function TotemSidebar({
  categorias,
  categoriaSelecionada,
  onSelectCategoria,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  navId,
}: TotemSidebarProps) {
  const classes =
    "totem-sidebar" +
    (collapsed ? " totem-sidebar--collapsed" : "") +
    (mobileOpen ? " totem-sidebar--mobile-open" : "");

  function selecionar(categoria: TotemCategoriaSelecionada) {
    onSelectCategoria(categoria);
    onCloseMobile();
  }

  return (
    <>
      <div className="totem-sidebar__backdrop" aria-hidden="true" onClick={onCloseMobile} hidden={!mobileOpen} />

      <aside
        className={"totem-sidebar-column" + (collapsed ? " totem-sidebar-column--collapsed" : "")}
      >
        <nav className={classes} aria-label="Categorias do cardápio" id={navId}>
          <div className="totem-sidebar__cabecalho">
            <button
              type="button"
              className="totem-sidebar__collapse-toggle"
              onClick={onToggleCollapsed}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expandir menu de categorias" : "Recolher menu de categorias"}
            >
              <TotemMenuIcon />
            </button>
            <span className="totem-sidebar__titulos">
              <span className="totem-sidebar__titulo">Cardápio</span>
              <span className="totem-sidebar__descricao">Escolha sua categoria</span>
            </span>
          </div>

          <ul className="totem-sidebar__lista">
            <li>
              <button
                type="button"
                className={
                  "totem-sidebar__item" +
                  (categoriaSelecionada === TOTEM_TODAS_CATEGORIAS ? " totem-sidebar__item--ativo" : "")
                }
                title="Todas"
                aria-current={categoriaSelecionada === TOTEM_TODAS_CATEGORIAS ? "true" : undefined}
                onClick={() => selecionar(TOTEM_TODAS_CATEGORIAS)}
              >
                <CategoryIcon categoryName="Todas" className="totem-sidebar__item-icone" />
                <span className="totem-sidebar__item-label">Todas</span>
              </button>
            </li>

            {categorias.map((categoria) => (
              <li key={categoria.id}>
                <button
                  type="button"
                  className={
                    "totem-sidebar__item" +
                    (categoriaSelecionada === categoria.id ? " totem-sidebar__item--ativo" : "")
                  }
                  title={categoria.nome}
                  aria-current={categoriaSelecionada === categoria.id ? "true" : undefined}
                  onClick={() => selecionar(categoria.id)}
                >
                  <CategoryIcon categoryName={categoria.nome} className="totem-sidebar__item-icone" />
                  <span className="totem-sidebar__item-label">{categoria.nome}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="totem-sidebar__rodape">
            <span className="totem-sidebar__rodape-texto">TotemFood</span>
          </div>
        </nav>
      </aside>
    </>
  );
}
