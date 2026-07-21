import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { AuthProvider } from "../../auth/AuthProvider";
import { saveUserSession } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { DashboardAdminResponse } from "../../types/dashboardAdmin";
import type { LoginResponse } from "../../types/auth";
import { AdminDashboardPage } from "./AdminDashboardPage";

const { obterDashboardMock, logoutMock } = vi.hoisted(() => ({
  obterDashboardMock: vi.fn(),
  logoutMock: vi.fn(),
}));

vi.mock("../../services/adminDashboardService", () => ({
  obterDashboard: obterDashboardMock,
}));

vi.mock("../../services/authService", () => ({
  login: vi.fn(),
  logout: logoutMock,
}));

const usuarioSuperAdmin: LoginResponse["usuario"] = {
  id: 1,
  nome: "Fábio",
  email: "fabio@totem.local",
  perfil: "SUPER_ADMIN",
  restauranteId: null,
  ativo: true,
};

const loginResponse: LoginResponse = {
  accessToken: "access-usuario",
  refreshToken: "refresh-usuario",
  tokenType: "Bearer",
  expiresIn: 3600,
  refreshExpiresIn: 604800,
  usuario: usuarioSuperAdmin,
};

const resumoMock: DashboardAdminResponse = {
  restauranteId: null,
  restauranteNome: null,
  dataReferencia: "2026-07-20",
  totalPedidosHoje: 7,
  pendentesPagamento: 1,
  pagosAguardandoCozinha: 2,
  emOperacao: 1,
  prontosRetirada: 0,
  retiradosHoje: 3,
  canceladosHoje: 0,
  expiradosHoje: 0,
  valorPagoHoje: 189.5,
};

function renderPagina() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter>
          <AdminDashboardPage />
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

describe("AdminDashboardPage — boas-vindas (TASK-118)", () => {
  it("saudação usa o nome do usuário autenticado", async () => {
    obterDashboardMock.mockResolvedValue(resumoMock);
    renderPagina();

    expect(await screen.findByText("Bem-vindo, Fábio!")).toBeInTheDocument();
  });
});

describe("AdminDashboardPage — indicadores reais, sem dado fictício", () => {
  it("mostra exatamente os valores retornados pelo serviço, nenhum número hardcoded", async () => {
    obterDashboardMock.mockResolvedValue(resumoMock);
    renderPagina();

    expect(await screen.findByText("7")).toBeInTheDocument(); // totalPedidosHoje
    expect(screen.getByText("R$ 189,50")).toBeInTheDocument(); // valorPagoHoje formatado
    // Números "de demonstração" clássicos (12/34/1.248/87) nunca devem aparecer.
    expect(screen.queryByText("12")).not.toBeInTheDocument();
    expect(screen.queryByText("1.248")).not.toBeInTheDocument();
    expect(screen.queryByText("87")).not.toBeInTheDocument();
  });

  it("estado de carregamento é exibido antes da resposta chegar", () => {
    obterDashboardMock.mockReturnValue(new Promise(() => {})); // nunca resolve nesta asserção
    renderPagina();

    expect(screen.getAllByText("Carregando…").length).toBeGreaterThan(0);
  });

  it("falha na consulta mostra erro e 'Tentar novamente', mas o hero de boas-vindas continua visível", async () => {
    obterDashboardMock.mockRejectedValue(new ApiError(500, "Falha interna"));
    renderPagina();

    expect(await screen.findByText("Falha interna")).toBeInTheDocument();
    expect(screen.getByText("Bem-vindo, Fábio!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("401 encerra a sessão de usuário (AuthProvider.logout) sem lançar erro — quem redireciona para /login é o ProtectedRoute, não esta página", async () => {
    obterDashboardMock.mockRejectedValue(new ApiError(401, "Não autenticado"));
    logoutMock.mockResolvedValue(undefined);
    renderPagina();

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    // Depois do logout, `useAuth().user` fica null — a própria página se torna vazia (guard
    // defensivo) até o `ProtectedRoute` (pai) perceber `isAuthenticated=false` e redirecionar.
    // O importante aqui é que nada lança exceção nem deixa a árvore em estado inconsistente.
  });
});
