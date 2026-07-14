import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../types/api";
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from "./tokenStorage";
import { api } from "./api";

/**
 * Testa o comportamento real de renovação automática de sessão em `api.ts` (TASK-063/TASK-088)
 * mockando `fetch` diretamente — evita depender de rede/backend, mas ainda exercita a lógica de
 * verdade (nenhuma função interna foi extraída/mockada). `fetch` não é polyfill do jsdom aqui:
 * é o `fetch` nativo do Node substituído por um mock só para os testes.
 *
 * Observação: `api.ts` hoje não tem uma regra especial para "401 com operadorToken inválido limpa
 * só o operador" — o único caminho de 401 é a renovação de accessToken/refreshToken via
 * `tentarRenovarSessao`. Por isso esse cenário (mencionado no briefing da TASK-101) não é testado
 * aqui: não existe no código para exercitar, e inventar esse comportamento no teste sem ele existir
 * na implementação criaria um teste que não reflete a aplicação real.
 */

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("renovação automática de sessão em 401", () => {
  it("com refreshToken válido: chama /api/auth/refresh, salva a nova sessão e repete a requisição original", async () => {
    setAccessToken("access-antigo");
    setRefreshToken("refresh-antigo");

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
          usuario: { id: 1, nome: "Admin", email: "admin@totem.local", perfil: "SUPER_ADMIN", restauranteId: null, ativo: true },
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
    expect(getAccessToken()).toBe("access-novo");
    expect(getRefreshToken()).toBe("refresh-novo");
    // 1ª chamada ao recurso (401) + refresh + repetição da chamada original = 3.
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("em 403 não tenta renovar a sessão", async () => {
    setAccessToken("access-atual");
    setRefreshToken("refresh-atual");

    const fetchMock = vi.fn(async () => jsonResponse(403, { message: "Acesso negado" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.get("/api/admin/restaurantes")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Sessão de usuário/dispositivo não é afetada por 403 — só 401 aciona a renovação/limpeza.
    expect(getAccessToken()).toBe("access-atual");
  });

  it("em 401 sem refreshToken salvo, não chama /api/auth/refresh e limpa a sessão", async () => {
    setAccessToken("access-sem-refresh");
    // Nenhum refreshToken salvo neste caso.

    const fetchMock = vi.fn(async () => jsonResponse(401, { message: "Não autorizado" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.get("/api/admin/dashboard")).rejects.toBeInstanceOf(ApiError);
    // Só a chamada original — tentarRenovarSessao verifica getRefreshToken() e desiste antes de
    // chamar fetch de novo.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
