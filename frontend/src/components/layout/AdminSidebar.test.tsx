import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AdminSidebar } from "./AdminSidebar";

function renderSidebar(overrides: Partial<React.ComponentProps<typeof AdminSidebar>> = {}) {
  const onToggleCollapsed = vi.fn();
  const onCloseMobile = vi.fn();
  const props = {
    perfil: "SUPER_ADMIN" as const,
    collapsed: false,
    onToggleCollapsed,
    mobileOpen: false,
    onCloseMobile,
    navId: "admin-sidebar-nav",
    ...overrides,
  };
  const utils = render(
    <MemoryRouter initialEntries={["/admin/produtos"]}>
      <AdminSidebar {...props} />
    </MemoryRouter>,
  );
  return { ...utils, onToggleCollapsed, onCloseMobile };
}

describe("AdminSidebar — visibilidade por perfil (TASK-118)", () => {
  it("SUPER_ADMIN vê todos os 7 itens, incluindo Restaurantes", () => {
    renderSidebar({ perfil: "SUPER_ADMIN" });

    for (const nome of ["Dashboard", "Restaurantes", "Dispositivos", "Categorias", "Produtos", "Usuários", "Pedidos"]) {
      expect(screen.getByRole("link", { name: nome })).toBeInTheDocument();
    }
  });

  it("ADMIN_RESTAURANTE não vê o link Restaurantes (mesma regra do RoleGuard/backend)", () => {
    renderSidebar({ perfil: "ADMIN_RESTAURANTE" });

    expect(screen.queryByRole("link", { name: "Restaurantes" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Usuários" })).toBeInTheDocument();
  });
});

describe("AdminSidebar — item ativo e navegação", () => {
  it("o link da rota atual (/admin/produtos) tem aria-current='page'", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Produtos" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("clicar num item chama onCloseMobile (fecha o drawer, inofensivo em desktop)", async () => {
    const user = userEvent.setup();
    const { onCloseMobile } = renderSidebar();

    await user.click(screen.getByRole("link", { name: "Categorias" }));

    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });
});

describe("AdminSidebar — modo recolhido mantém nome acessível", () => {
  it("com collapsed=true, o link continua com nome acessível (aria-label) e title", () => {
    renderSidebar({ collapsed: true });

    const link = screen.getByRole("link", { name: "Dispositivos" });
    expect(link).toHaveAttribute("title", "Dispositivos");
  });
});

describe("AdminSidebar — botão de recolher/expandir", () => {
  it("aria-expanded reflete o estado atual e o rótulo alterna", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminSidebar
          perfil="SUPER_ADMIN"
          collapsed={false}
          onToggleCollapsed={vi.fn()}
          mobileOpen={false}
          onCloseMobile={vi.fn()}
          navId="admin-sidebar-nav"
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Recolher menu administrativo" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    rerender(
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminSidebar
          perfil="SUPER_ADMIN"
          collapsed
          onToggleCollapsed={vi.fn()}
          mobileOpen={false}
          onCloseMobile={vi.fn()}
          navId="admin-sidebar-nav"
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Expandir menu administrativo" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

describe("AdminSidebar — backdrop mobile", () => {
  it("clicar no backdrop chama onCloseMobile", async () => {
    const user = userEvent.setup();
    const { container, onCloseMobile } = renderSidebar({ mobileOpen: true });

    const backdrop = container.querySelector(".admin-sidebar__backdrop");
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as Element);

    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });
});
