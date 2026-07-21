import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import type { UsuarioAutenticadoResponse } from "../../types/auth";
import { AdminTopbar } from "./AdminTopbar";

const usuario: UsuarioAutenticadoResponse = {
  id: 1,
  nome: "Fábio Simões",
  email: "fabio@totem.local",
  perfil: "ADMIN_RESTAURANTE",
  restauranteId: 1,
  ativo: true,
};

function renderTopbar(rota: string, overrides: Partial<React.ComponentProps<typeof AdminTopbar>> = {}) {
  const onLogout = vi.fn();
  const onOpenMobileMenu = vi.fn();
  const ref = createRef<HTMLButtonElement>();
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[rota]}>
        <AdminTopbar
          usuario={usuario}
          onLogout={onLogout}
          onOpenMobileMenu={onOpenMobileMenu}
          mobileMenuOpen={false}
          navId="admin-sidebar-nav"
          hamburguerRef={ref}
          {...overrides}
        />
      </MemoryRouter>
    </ThemeProvider>,
  );
  return { onLogout, onOpenMobileMenu };
}

describe("AdminTopbar — título e descrição por rota (TASK-118)", () => {
  it("em /admin/produtos, mostra 'Produtos' como h1 e a descrição contextual", () => {
    renderTopbar("/admin/produtos");

    expect(screen.getByRole("heading", { level: 1, name: "Produtos" })).toBeInTheDocument();
    expect(screen.getByText("Gerencie itens, preços e disponibilidade")).toBeInTheDocument();
  });

  it("em /admin, mostra 'Dashboard'", () => {
    renderTopbar("/admin");

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
  });
});

describe("AdminTopbar — identificação do usuário", () => {
  it("mostra nome e perfil amigável (não o nome técnico do perfil)", () => {
    renderTopbar("/admin");

    expect(screen.getByText("Fábio Simões")).toBeInTheDocument();
    expect(screen.getByText("Administrador do restaurante")).toBeInTheDocument();
    expect(screen.queryByText("ADMIN_RESTAURANTE")).not.toBeInTheDocument();
  });
});

describe("AdminTopbar — ThemeToggle e logout", () => {
  it("ThemeToggle alterna o tema normalmente (componente reaproveitado, não duplicado)", async () => {
    const user = userEvent.setup();
    renderTopbar("/admin");

    const antes = document.documentElement.getAttribute("data-theme");
    await user.click(screen.getByRole("button", { name: /Alternar para modo/ }));

    expect(document.documentElement.getAttribute("data-theme")).not.toBe(antes);
  });

  it("botão 'Sair' é acessível por nome e chama onLogout", async () => {
    const user = userEvent.setup();
    const { onLogout } = renderTopbar("/admin");

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

describe("AdminTopbar — botão hambúrguer (mobile)", () => {
  it("tem aria-expanded/aria-controls e chama onOpenMobileMenu", async () => {
    const user = userEvent.setup();
    const { onOpenMobileMenu } = renderTopbar("/admin", { mobileMenuOpen: false });

    const botao = screen.getByRole("button", { name: "Abrir menu administrativo" });
    expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(botao).toHaveAttribute("aria-controls", "admin-sidebar-nav");

    await user.click(botao);
    expect(onOpenMobileMenu).toHaveBeenCalledTimes(1);
  });

  it("com mobileMenuOpen=true, o rótulo vira 'Fechar menu administrativo'", () => {
    renderTopbar("/admin", { mobileMenuOpen: true });

    expect(screen.getByRole("button", { name: "Fechar menu administrativo" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
