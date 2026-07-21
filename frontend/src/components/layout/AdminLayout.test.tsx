import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { AuthProvider } from "../../auth/AuthProvider";
import { saveUserSession } from "../../services/tokenStorage";
import type { LoginResponse } from "../../types/auth";
import { AdminLayout } from "./AdminLayout";

const { logoutMock } = vi.hoisted(() => ({ logoutMock: vi.fn() }));
vi.mock("../../services/authService", () => ({
  login: vi.fn(),
  logout: logoutMock,
}));

const loginResponse: LoginResponse = {
  accessToken: "access-usuario",
  refreshToken: "refresh-usuario",
  tokenType: "Bearer",
  expiresIn: 3600,
  refreshExpiresIn: 604800,
  usuario: {
    id: 1,
    nome: "Super Admin",
    email: "admin@totem.local",
    perfil: "SUPER_ADMIN",
    restauranteId: null,
    ativo: true,
  },
};

function renderLayout(rotaInicial = "/admin/produtos") {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[rotaInicial]}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<p>Conteúdo do dashboard</p>} />
              <Route path="produtos" element={<p>Conteúdo de produtos</p>} />
            </Route>
            <Route path="/login" element={<p>Página de login</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  saveUserSession(loginResponse);
});

describe("AdminLayout — composição (TASK-118)", () => {
  it("renderiza sidebar, topbar e o conteúdo da rota filha (Outlet)", async () => {
    renderLayout("/admin/produtos");

    expect(await screen.findByRole("navigation", { name: "Navegação administrativa" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Produtos" })).toBeInTheDocument();
    expect(screen.getByText("Conteúdo de produtos")).toBeInTheDocument();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });
});

describe("AdminLayout — recolher/expandir a sidebar", () => {
  it("clicar no botão recolhe a sidebar, atualiza aria-expanded e persiste em localStorage", async () => {
    const user = userEvent.setup();
    const { container } = renderLayout();

    const botao = await screen.findByRole("button", { name: "Recolher menu administrativo" });
    expect(container.querySelector(".admin-layout--collapsed")).toBeNull();

    await user.click(botao);

    expect(await screen.findByRole("button", { name: "Expandir menu administrativo" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(container.querySelector(".admin-layout--collapsed")).not.toBeNull();
    expect(localStorage.getItem("totem.admin.sidebarCollapsed")).toBe("true");
  });
});

describe("AdminLayout — logout", () => {
  it("chama AuthProvider.logout() e navega para /login, sem apagar a sessão de dispositivo", async () => {
    const user = userEvent.setup();
    logoutMock.mockResolvedValue(undefined);
    renderLayout();

    await user.click(await screen.findByRole("button", { name: "Sair" }));

    await waitFor(() => expect(screen.getByText("Página de login")).toBeInTheDocument());
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});

describe("AdminLayout — drawer mobile", () => {
  it("Escape fecha o drawer e devolve o foco ao botão hambúrguer", async () => {
    const user = userEvent.setup();
    const { container } = renderLayout();

    const hamburguer = await screen.findByRole("button", { name: "Abrir menu administrativo" });
    await user.click(hamburguer);

    expect(container.querySelector(".admin-sidebar--mobile-open")).not.toBeNull();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(container.querySelector(".admin-sidebar--mobile-open")).toBeNull());
    expect(hamburguer).toHaveFocus();
  });
});
