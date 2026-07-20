import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoginResponse, UsuarioAutenticadoResponse } from "../types/auth";
import {
  getDeviceAccessToken,
  getOperadorToken,
  getStoredDispositivo,
  getStoredUsuario,
  getUserAccessToken,
  saveDeviceSession,
  saveOperadorSession,
  saveUserSession,
} from "../services/tokenStorage";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";

const { loginMock, logoutMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  logoutMock: vi.fn(),
}));

vi.mock("../services/authService", () => ({
  login: loginMock,
  logout: logoutMock,
}));

const usuario: UsuarioAutenticadoResponse = {
  id: 1,
  nome: "Super Admin",
  email: "admin@totem.local",
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
  usuario,
};

function Sonda() {
  const { user, isAuthenticated, isLoading, hasRole, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user?.email ?? "nenhum"}</span>
      <span data-testid="has-role">{String(hasRole(["SUPER_ADMIN"]))}</span>
      <button type="button" onClick={() => void login({ email: usuario.email, senha: "senha" })}>
        login
      </button>
      <button type="button" onClick={() => void logout()}>
        logout
      </button>
    </div>
  );
}

function renderSonda() {
  return render(
    <AuthProvider>
      <Sonda />
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("AuthProvider.restoreSession", () => {
  it("restaura uma sessão válida (token + dados de usuário presentes)", async () => {
    saveUserSession(loginResponse);

    renderSonda();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("user")).toHaveTextContent("admin@totem.local");
  });

  it("trata combinação inconsistente (token sem dados de usuário) como não autenticada e limpa a sessão", async () => {
    localStorage.setItem("totem.user.accessToken", "token-orfao");
    // Sem totem.user.data correspondente — combinação inconsistente.

    renderSonda();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(getUserAccessToken()).toBeNull();
  });

  it("trata combinação inconsistente (dados de usuário sem token) como não autenticada e limpa a sessão", async () => {
    localStorage.setItem("totem.user.data", JSON.stringify(usuario));
    // Sem totem.user.accessToken correspondente.

    renderSonda();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(getStoredUsuario()).toBeNull();
  });

  it("sem nenhuma sessão salva, não autentica e não lança erro", async () => {
    renderSonda();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user")).toHaveTextContent("nenhum");
  });
});

describe("AuthProvider.login", () => {
  it("salva a sessão de usuário e atualiza o estado reativo", async () => {
    loginMock.mockResolvedValue(loginResponse);
    const { getByRole } = renderSonda();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    getByRole("button", { name: "login" }).click();

    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("true"));
    expect(screen.getByTestId("has-role")).toHaveTextContent("true");
    expect(getUserAccessToken()).toBe("access-usuario");
  });
});

describe("AuthProvider.logout — isolamento de contexto (TASK-116)", () => {
  it("logout de usuário NÃO apaga uma sessão de dispositivo nem de operador já salvas", async () => {
    saveUserSession(loginResponse);
    saveDeviceSession({
      accessToken: "access-dispositivo",
      refreshToken: "refresh-dispositivo",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      dispositivo: {
        id: 1,
        nome: "Caixa 1",
        codigoIdentificacao: "CAIXA-1",
        tipoDispositivo: "CAIXA",
        restauranteId: 1,
        ativo: true,
        ultimoAcesso: null,
      },
    });
    saveOperadorSession({
      operadorToken: "operador-token",
      expiresIn: 1800,
      operador: { id: 9, nome: "Operador", email: "operador@totem.local", perfil: "OPERADOR_CAIXA", restauranteId: 1 },
    });
    logoutMock.mockResolvedValue(undefined);

    const { getByRole } = renderSonda();
    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("true"));

    getByRole("button", { name: "logout" }).click();

    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("false"));
    expect(getUserAccessToken()).toBeNull();
    // Dispositivo e operador continuam intactos — logout de usuário isola o contexto USER.
    expect(getDeviceAccessToken()).toBe("access-dispositivo");
    expect(getStoredDispositivo()?.tipoDispositivo).toBe("CAIXA");
    expect(getOperadorToken()).toBe("operador-token");
  });
});
