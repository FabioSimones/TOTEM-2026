import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../auth/AuthProvider";
import { saveUserSession } from "../services/tokenStorage";
import type { LoginResponse, UsuarioAutenticadoResponse } from "../types/auth";
import { AppRoutes } from "./AppRoutes";

vi.mock("../services/adminRestauranteService", () => ({
  listarRestaurantes: vi.fn().mockResolvedValue([]),
}));
vi.mock("../services/adminUsuarioService", () => ({
  listarUsuarios: vi.fn().mockResolvedValue([]),
}));

function usuario(perfil: UsuarioAutenticadoResponse["perfil"]): LoginResponse {
  return {
    accessToken: "access-teste",
    refreshToken: "refresh-teste",
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshExpiresIn: 604800,
    usuario: {
      id: 1,
      nome: "Usuário Teste",
      email: "teste@totem.local",
      perfil,
      restauranteId: perfil === "SUPER_ADMIN" ? null : 1,
      ativo: true,
    },
  };
}

function renderRota(rotaInicial: string) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[rotaInicial]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("AppRoutes — TASK-117 (entrada padrão pela ativação de dispositivo)", () => {
  it("/ redireciona para /ativar-dispositivo", async () => {
    renderRota("/");

    expect(await screen.findByRole("heading", { name: "Ativar Dispositivo" })).toBeInTheDocument();
  });

  it("/login continua acessível diretamente e mostra o formulário de login central", async () => {
    renderRota("/login");

    expect(await screen.findByRole("heading", { name: "Acesse sua conta" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("/admin/login continua redirecionando para /login (compatibilidade)", async () => {
    renderRota("/admin/login");

    expect(await screen.findByRole("heading", { name: "Acesse sua conta" })).toBeInTheDocument();
  });
});

describe("AppRoutes — TASK-118 (RoleGuard continua protegendo mesmo dentro do AdminLayout)", () => {
  it("SUPER_ADMIN acessa /admin/restaurantes normalmente", async () => {
    saveUserSession(usuario("SUPER_ADMIN"));
    renderRota("/admin/restaurantes");

    expect(await screen.findByRole("heading", { level: 1, name: "Restaurantes" })).toBeInTheDocument();
    expect(screen.queryByText(/não tem permissão para acessar esta página/)).not.toBeInTheDocument();
  });

  it("ADMIN_RESTAURANTE acessando /admin/restaurantes diretamente continua bloqueado pelo RoleGuard", async () => {
    saveUserSession(usuario("ADMIN_RESTAURANTE"));
    renderRota("/admin/restaurantes");

    expect(await screen.findByText(/não tem permissão para acessar esta página/)).toBeInTheDocument();
    // O topbar (sidebar/layout) continua montado — só o conteúdo da rota é negado.
    expect(screen.getByRole("navigation", { name: "Navegação administrativa" })).toBeInTheDocument();
  });

  it("ADMIN_RESTAURANTE acessa /admin/usuarios normalmente (RoleGuard permite os dois perfis)", async () => {
    saveUserSession(usuario("ADMIN_RESTAURANTE"));
    renderRota("/admin/usuarios");

    expect(await screen.findByRole("heading", { level: 1, name: "Usuários" })).toBeInTheDocument();
  });
});
