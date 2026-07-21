import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CategoriaCardapioResponse } from "../../types/totem";
import { TOTEM_TODAS_CATEGORIAS, TotemSidebar } from "./TotemSidebar";

const categorias: CategoriaCardapioResponse[] = [
  { id: 1, nome: "Lanches", descricao: null, ordemExibicao: 1, produtos: [] },
  { id: 2, nome: "Bebidas", descricao: null, ordemExibicao: 2, produtos: [] },
];

function renderSidebar(overrides: Partial<React.ComponentProps<typeof TotemSidebar>> = {}) {
  const onSelectCategoria = vi.fn();
  const onToggleCollapsed = vi.fn();
  const onCloseMobile = vi.fn();

  const utils = render(
    <TotemSidebar
      categorias={categorias}
      categoriaSelecionada={1}
      onSelectCategoria={onSelectCategoria}
      collapsed={false}
      onToggleCollapsed={onToggleCollapsed}
      mobileOpen={false}
      onCloseMobile={onCloseMobile}
      navId="totem-sidebar-nav"
      {...overrides}
    />,
  );

  return { onSelectCategoria, onToggleCollapsed, onCloseMobile, container: utils.container };
}

describe("TotemSidebar", () => {
  it("renderiza a opção Todas e as categorias reais recebidas", () => {
    renderSidebar();

    expect(screen.getByRole("button", { name: "Todas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lanches" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bebidas" })).toBeInTheDocument();
  });

  it("marca a categoria selecionada com aria-current", () => {
    renderSidebar({ categoriaSelecionada: 2 });

    expect(screen.getByRole("button", { name: "Bebidas" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Lanches" })).not.toHaveAttribute("aria-current");
  });

  it("chama onSelectCategoria e onCloseMobile ao clicar em uma categoria", async () => {
    const user = userEvent.setup();
    const { onSelectCategoria, onCloseMobile } = renderSidebar();

    await user.click(screen.getByRole("button", { name: "Bebidas" }));

    expect(onSelectCategoria).toHaveBeenCalledWith(2);
    expect(onCloseMobile).toHaveBeenCalled();
  });

  it("permite selecionar 'Todas' explicitamente", async () => {
    const user = userEvent.setup();
    const { onSelectCategoria } = renderSidebar();

    await user.click(screen.getByRole("button", { name: "Todas" }));

    expect(onSelectCategoria).toHaveBeenCalledWith(TOTEM_TODAS_CATEGORIAS);
  });

  it("botão de colapsar expõe aria-expanded e aria-label dinâmico", async () => {
    const user = userEvent.setup();
    const { onToggleCollapsed } = renderSidebar({ collapsed: false });

    const toggle = screen.getByRole("button", { name: "Recolher menu de categorias" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(toggle);
    expect(onToggleCollapsed).toHaveBeenCalled();
  });

  it("quando recolhida, mantém o nome acessível das categorias (title) mesmo com o texto oculto visualmente", () => {
    renderSidebar({ collapsed: true });

    expect(screen.getByRole("button", { name: "Expandir menu de categorias" })).toBeInTheDocument();
    // O texto continua na árvore de acessibilidade (não usa display:none), só fica clip-oculto por CSS.
    expect(screen.getByRole("button", { name: "Lanches" })).toBeInTheDocument();
  });

  it("TASK-120.2: categorias diferentes renderizam ícones semanticamente diferentes, nunca o antigo '+'", () => {
    renderSidebar();

    const svgTodas = screen.getByRole("button", { name: "Todas" }).querySelector("svg");
    const svgLanches = screen.getByRole("button", { name: "Lanches" }).querySelector("svg");
    const svgBebidas = screen.getByRole("button", { name: "Bebidas" }).querySelector("svg");

    expect(svgTodas?.outerHTML).not.toBe(svgLanches?.outerHTML);
    expect(svgLanches?.outerHTML).not.toBe(svgBebidas?.outerHTML);
    expect(svgTodas?.outerHTML).not.toBe(svgBebidas?.outerHTML);

    // Nenhum deles é o antigo ícone de "+" (quadrado com uma cruz dentro).
    for (const svg of [svgTodas, svgLanches, svgBebidas]) {
      expect(svg?.outerHTML).not.toContain("M8.5 12h7M12 8.5v7");
    }
  });

  it("categoria com nome desconhecido ainda recebe um ícone (fallback), nunca fica sem ícone", () => {
    renderSidebar({
      categorias: [
        ...categorias,
        { id: 3, nome: "Categoria Inventada XYZ", descricao: null, ordemExibicao: 3, produtos: [] },
      ],
    });

    const svg = screen.getByRole("button", { name: "Categoria Inventada XYZ" }).querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("ícones continuam semanticamente diferentes com a sidebar recolhida", () => {
    renderSidebar({ collapsed: true });

    const svgLanches = screen.getByRole("button", { name: "Lanches" }).querySelector("svg");
    const svgBebidas = screen.getByRole("button", { name: "Bebidas" }).querySelector("svg");
    expect(svgLanches?.outerHTML).not.toBe(svgBebidas?.outerHTML);
  });

  it("estrutura: cabeçalho, lista de categorias e rodapé são regiões separadas (a lista é a única rolável)", () => {
    const { container } = renderSidebar();

    const nav = container.querySelector("nav.totem-sidebar");
    const cabecalho = container.querySelector(".totem-sidebar__cabecalho");
    const lista = container.querySelector(".totem-sidebar__lista");
    const rodape = container.querySelector(".totem-sidebar__rodape");

    expect(nav).toBeInTheDocument();
    expect(cabecalho).toBeInTheDocument();
    expect(lista).toBeInTheDocument();
    expect(rodape).toBeInTheDocument();
    // Os três são filhos diretos do <nav>, na ordem cabeçalho → lista → rodapé.
    expect(Array.from(nav?.children ?? [])).toEqual([cabecalho, lista, rodape]);
  });

  it("TASK-120.5: o <nav> fica dentro de um wrapper de coluna (.totem-sidebar-column) que acompanha a altura do conteúdo", () => {
    const { container } = renderSidebar();

    const coluna = container.querySelector(".totem-sidebar-column");
    const nav = container.querySelector("nav.totem-sidebar");

    expect(coluna).toBeInTheDocument();
    expect(nav).toBeInTheDocument();
    // O <nav> (conteúdo sticky) é filho da coluna (dona do fundo/borda visual) — não o contrário.
    expect(coluna?.contains(nav)).toBe(true);
  });

  it("TASK-120.5: recolhida, a coluna também recebe a classe de estado recolhido", () => {
    const { container } = renderSidebar({ collapsed: true });

    const coluna = container.querySelector(".totem-sidebar-column");
    expect(coluna).toHaveClass("totem-sidebar-column--collapsed");
    expect(container.querySelector("nav.totem-sidebar")).toHaveClass("totem-sidebar--collapsed");
  });
});
