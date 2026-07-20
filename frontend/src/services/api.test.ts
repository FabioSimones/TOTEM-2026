import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../types/api";
import {
  getDeviceAccessToken,
  getDeviceRefreshToken,
  getOperadorToken,
  getUserAccessToken,
  getUserRefreshToken,
  saveDeviceSession,
  saveOperadorSession,
  saveUserSession,
} from "./tokenStorage";
import { api } from "./api";

/**
 * Testa o comportamento real de renovação automática de sessão em `api.ts` (TASK-063/TASK-088,
 * e a separação de contexto USER/DEVICE da auditoria de autenticação) mockando `fetch`
 * diretamente — evita depender de rede/backend, mas ainda exercita a lógica de verdade (nenhuma
 * função interna foi extraída/mockada). `fetch` não é polyfill do jsdom aqui: é o `fetch` nativo
 * do Node substituído por um mock só para os testes.
 */

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const usuarioMock = {
  id: 1,
  nome: "Admin",
  email: "admin@totem.local",
  perfil: "SUPER_ADMIN" as const,
  restauranteId: null,
  ativo: true,
};

const dispositivoMock = {
  id: 10,
  nome: "Totem 1",
  codigoIdentificacao: "TOTEM-01",
  tipoDispositivo: "TOTEM" as const,
  restauranteId: 1,
  ativo: true,
  ultimoAcesso: null,
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("seleção de token por contexto (USER vs. DEVICE)", () => {
  it("/api/admin/** usa o token de usuário, mesmo com uma sessão de dispositivo também salva", async () => {
    saveUserSession({
      accessToken: "access-usuario",
      refreshToken: "refresh-usuario",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      usuario: usuarioMock,
    });
    saveDeviceSession({
      accessToken: "access-dispositivo",
      refreshToken: "refresh-dispositivo",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      dispositivo: dispositivoMock,
    });

    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer access-usuario");
      return jsonResponse(200, { ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.get("/api/admin/dashboard");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("/api/totem/** usa o token de dispositivo, mesmo com uma sessão de usuário também salva", async () => {
    saveUserSession({
      accessToken: "access-usuario",
      refreshToken: "refresh-usuario",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      usuario: usuarioMock,
    });
    saveDeviceSession({
      accessToken: "access-dispositivo",
      refreshToken: "refresh-dispositivo",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      dispositivo: dispositivoMock,
    });

    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer access-dispositivo");
      return jsonResponse(200, { ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.get("/api/totem/cardapio");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("X-Operador-Token só é anexado em /api/caixa/** e /api/cozinha/**, nunca em /api/admin/** ou /api/totem/**", async () => {
    saveDeviceSession({
      accessToken: "access-dispositivo",
      refreshToken: "refresh-dispositivo",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      dispositivo: dispositivoMock,
    });
    saveOperadorSession({
      operadorToken: "operador-token",
      expiresIn: 1800,
      operador: { id: 5, nome: "Operador", email: "operador@totem.local", perfil: "OPERADOR_CAIXA", restauranteId: 1 },
    });
    expect(getOperadorToken()).toBe("operador-token");

    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("X-Operador-Token")).toBeNull();
      return jsonResponse(200, { ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.get("/api/totem/cardapio");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("renovação automática de sessão em 401", () => {
  it("contexto USER: chama /api/auth/refresh com o refresh token de usuário e salva a nova sessão de usuário", async () => {
    saveUserSession({
      accessToken: "access-antigo",
      refreshToken: "refresh-antigo",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      usuario: usuarioMock,
    });

    let chamadasRecurso = 0;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/auth/refresh")) {
        return jsonResponse(200, {
          accessToken: "access-novo",
          refreshToken: "refresh-novo",
          tokenType: "Bearer",
          expiresIn: 3600,
          refreshExpiresIn: 604800,
          usuario: usuarioMock,
          dispositivo: null,
        });
      }
      chamadasRecurso += 1;
      if (chamadasRecurso === 1) {
        return jsonResponse(401, { message: "Não autorizado" });
      }
      return jsonResponse(200, { ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await api.get<{ ok: boolean }>("/api/admin/dashboard");

    expect(resultado).toEqual({ ok: true });
    expect(getUserAccessToken()).toBe("access-novo");
    expect(getUserRefreshToken()).toBe("refresh-novo");
    // 1ª chamada ao recurso (401) + refresh + repetição da chamada original = 3.
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("contexto DEVICE: falha de refresh limpa só a sessão de dispositivo, nunca a de usuário", async () => {
    saveUserSession({
      accessToken: "access-usuario",
      refreshToken: "refresh-usuario",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      usuario: usuarioMock,
    });
    saveDeviceSession({
      accessToken: "access-dispositivo-expirado",
      refreshToken: "refresh-dispositivo-expirado",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      dispositivo: dispositivoMock,
    });

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/auth/refresh")) {
        return jsonResponse(401, { message: "Refresh token inválido" });
      }
      return jsonResponse(401, { message: "Não autorizado" });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.get("/api/totem/cardapio")).rejects.toBeInstanceOf(ApiError);

    expect(getDeviceAccessToken()).toBeNull();
    expect(getDeviceRefreshToken()).toBeNull();
    // A sessão de usuário, de contexto diferente, não é tocada pela falha de refresh do dispositivo.
    expect(getUserAccessToken()).toBe("access-usuario");
  });

  it("em 403 não tenta renovar a sessão", async () => {
    saveUserSession({
      accessToken: "access-atual",
      refreshToken: "refresh-atual",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      usuario: usuarioMock,
    });

    const fetchMock = vi.fn(async () => jsonResponse(403, { message: "Acesso negado" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.get("/api/admin/restaurantes")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Sessão de usuário/dispositivo não é afetada por 403 — só 401 aciona a renovação/limpeza.
    expect(getUserAccessToken()).toBe("access-atual");
  });

  it("em 401 sem refreshToken salvo, não chama /api/auth/refresh e limpa a sessão de usuário", async () => {
    // Nenhum refreshToken salvo neste caso — saveUserSession não é chamado.
    const fetchMock = vi.fn(async () => jsonResponse(401, { message: "Não autorizado" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.get("/api/admin/dashboard")).rejects.toBeInstanceOf(ApiError);
    // Só a chamada original — refreshUserSession verifica getUserRefreshToken() e desiste antes de
    // chamar fetch de novo.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getUserAccessToken()).toBeNull();
  });
});
