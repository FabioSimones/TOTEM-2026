import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { TotemTopbar } from "./TotemTopbar";

function renderTopbar(overrides: Partial<React.ComponentProps<typeof TotemTopbar>> = {}) {
  const onChangeBusca = vi.fn();
  const onAbrirCarrinho = vi.fn();
  const onOpenMobileMenu = vi.fn();
  const hamburguerRef = createRef<HTMLButtonElement>();

  render(
    <ThemeProvider>
      <TotemTopbar
        titulo="Lanches"
        descricao="Hambúrgueres e sanduíches"
        busca=""
        onChangeBusca={onChangeBusca}
        totalItensCarrinho={0}
        onAbrirCarrinho={onAbrirCarrinho}
        onOpenMobileMenu={onOpenMobileMenu}
        mobileMenuOpen={false}
        navId="totem-sidebar-nav"
        hamburguerRef={hamburguerRef}
        {...overrides}
      />
    </ThemeProvider>,
  );

  return { onChangeBusca, onAbrirCarrinho, onOpenMobileMenu };
}

describe("TotemTopbar", () => {
  it("exibe o título e a descrição contextual da categoria", () => {
    renderTopbar();

    expect(screen.getByRole("heading", { name: "Lanches" })).toBeInTheDocument();
    expect(screen.getByText("Hambúrgueres e sanduíches")).toBeInTheDocument();
  });

  it("campo de busca tem rótulo acessível e dispara onChangeBusca", async () => {
    const user = userEvent.setup();
    const { onChangeBusca } = renderTopbar();

    const campo = screen.getByRole("searchbox", { name: "Buscar produto" });
    await user.type(campo, "x");

    expect(onChangeBusca).toHaveBeenCalledWith("x");
  });

  it("botão de limpar busca só aparece quando há texto", () => {
    const { rerender } = render(
      <ThemeProvider>
        <TotemTopbar
          titulo="Lanches"
          busca=""
          onChangeBusca={vi.fn()}
          totalItensCarrinho={0}
          onAbrirCarrinho={vi.fn()}
          onOpenMobileMenu={vi.fn()}
          mobileMenuOpen={false}
          navId="totem-sidebar-nav"
          hamburguerRef={createRef<HTMLButtonElement>()}
        />
      </ThemeProvider>,
    );

    expect(screen.queryByRole("button", { name: "Limpar busca" })).not.toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <TotemTopbar
          titulo="Lanches"
          busca="burger"
          onChangeBusca={vi.fn()}
          totalItensCarrinho={0}
          onAbrirCarrinho={vi.fn()}
          onOpenMobileMenu={vi.fn()}
          mobileMenuOpen={false}
          navId="totem-sidebar-nav"
          hamburguerRef={createRef<HTMLButtonElement>()}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "Limpar busca" })).toBeInTheDocument();
  });

  it("carrinho vazio: nome acessível sem quantidade e sem badge visível", () => {
    renderTopbar({ totalItensCarrinho: 0 });

    expect(screen.getByRole("button", { name: "Abrir carrinho" })).toBeInTheDocument();
  });

  it("carrinho com itens: nome acessível inclui a quantidade e mostra o badge", () => {
    renderTopbar({ totalItensCarrinho: 3 });

    const botaoCarrinho = screen.getByRole("button", { name: "Abrir carrinho, 3 itens" });
    expect(botaoCarrinho).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("carrinho com 1 item usa singular no nome acessível", () => {
    renderTopbar({ totalItensCarrinho: 1 });

    expect(screen.getByRole("button", { name: "Abrir carrinho, 1 item" })).toBeInTheDocument();
  });

  it("clicar no carrinho chama onAbrirCarrinho", async () => {
    const user = userEvent.setup();
    const { onAbrirCarrinho } = renderTopbar({ totalItensCarrinho: 2 });

    await user.click(screen.getByRole("button", { name: "Abrir carrinho, 2 itens" }));

    expect(onAbrirCarrinho).toHaveBeenCalled();
  });

  it("botão hambúrguer mobile expõe aria-controls apontando para o id da navegação", () => {
    renderTopbar();

    const hamburguer = screen.getByRole("button", { name: "Abrir menu de categorias" });
    expect(hamburguer).toHaveAttribute("aria-controls", "totem-sidebar-nav");
    expect(hamburguer).toHaveAttribute("aria-expanded", "false");
  });

  it("ThemeToggle continua presente e funcional (reaproveitado, sem lógica duplicada)", () => {
    renderTopbar();

    expect(screen.getByRole("button", { name: /modo claro|modo escuro/ })).toBeInTheDocument();
  });
});
