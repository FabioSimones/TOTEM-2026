import { ApiError, type ApiErrorResponse } from "../types/api";
import type { RefreshResponse } from "../types/auth";
import {
  clearDeviceSession,
  clearUserSession,
  getDeviceAccessToken,
  getDeviceRefreshToken,
  getOperadorToken,
  getUserAccessToken,
  getUserRefreshToken,
  saveRefreshedDeviceSession,
  saveRefreshedUserSession,
} from "./tokenStorage";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

type AuthContext = "user" | "device";

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Se false, não anexa nenhum header de autenticação mesmo havendo token salvo. */
  withAuth?: boolean;
}

/**
 * Decide qual sessão (USER ou DEVICE) autentica a requisição, a partir do prefixo do path.
 * `/api/admin/**` sempre usa o token de usuário; Totem/Caixa/Cozinha e o login de operador
 * (que exige Bearer do dispositivo) sempre usam o token de dispositivo. Qualquer outro path
 * autenticado (ex.: futuros endpoints administrativos) cai no contexto de usuário por padrão —
 * ajuste esta função ao adicionar novos grupos de rota com contexto próprio.
 */
function resolveAuthContext(path: string): AuthContext {
  if (
    path.startsWith("/api/totem/") ||
    path.startsWith("/api/caixa/") ||
    path.startsWith("/api/cozinha/") ||
    path === "/api/auth/operador/login"
  ) {
    return "device";
  }
  return "user";
}

/** X-Operador-Token só faz sentido nas rotas operacionais de Caixa/Cozinha — nunca em /api/admin/**, /api/totem/** ou nos endpoints de /api/auth/**. */
function deveAnexarTokenOperador(path: string): boolean {
  return path.startsWith("/api/caixa/") || path.startsWith("/api/cozinha/");
}

/**
 * Renovação automática de sessão (TASK-063), separada por contexto: uma requisição autenticada
 * como usuário só pode renovar com o refresh token de usuário, e uma requisição de dispositivo só
 * com o refresh token de dispositivo — nunca um substitui o outro. `refreshEmAndamento` é mantido
 * por contexto para evitar que duas requisições 401 concorrentes do MESMO contexto disparem
 * renovações em paralelo (o refresh token é de uso único), sem que o contexto USER bloqueie ou
 * seja bloqueado pelo contexto DEVICE.
 */
const refreshEmAndamento: Record<AuthContext, Promise<boolean> | null> = {
  user: null,
  device: null,
};

async function refreshUserSession(): Promise<boolean> {
  if (refreshEmAndamento.user) {
    return refreshEmAndamento.user;
  }

  refreshEmAndamento.user = (async () => {
    const refreshToken = getUserRefreshToken();
    if (!refreshToken) {
      return false;
    }
    try {
      const response = await apiFetchInternal<RefreshResponse>(
        "/api/auth/refresh",
        { method: "POST", body: { refreshToken }, withAuth: false },
        true,
      );
      return saveRefreshedUserSession(response);
    } catch {
      return false;
    }
  })();

  try {
    return await refreshEmAndamento.user;
  } finally {
    refreshEmAndamento.user = null;
  }
}

async function refreshDeviceSession(): Promise<boolean> {
  if (refreshEmAndamento.device) {
    return refreshEmAndamento.device;
  }

  refreshEmAndamento.device = (async () => {
    const refreshToken = getDeviceRefreshToken();
    if (!refreshToken) {
      return false;
    }
    try {
      const response = await apiFetchInternal<RefreshResponse>(
        "/api/auth/refresh",
        { method: "POST", body: { refreshToken }, withAuth: false },
        true,
      );
      return saveRefreshedDeviceSession(response);
    } catch {
      return false;
    }
  })();

  try {
    return await refreshEmAndamento.device;
  } finally {
    refreshEmAndamento.device = null;
  }
}

async function apiFetchInternal<TResponse>(
  path: string,
  options: ApiFetchOptions,
  jaTentouRenovar: boolean,
): Promise<TResponse> {
  const { body, withAuth = true, headers, ...rest } = options;

  const isFormData = body instanceof FormData;
  const context = resolveAuthContext(path);

  const requestHeaders = new Headers(headers);
  if (!isFormData) {
    // Para FormData, o browser define Content-Type com o boundary correto sozinho.
    requestHeaders.set("Content-Type", "application/json");
  }

  if (withAuth) {
    const token = context === "user" ? getUserAccessToken() : getDeviceAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
    if (deveAnexarTokenOperador(path)) {
      const operadorToken = getOperadorToken();
      if (operadorToken) {
        requestHeaders.set("X-Operador-Token", operadorToken);
      }
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && withAuth && !jaTentouRenovar) {
    const renovou = context === "user" ? await refreshUserSession() : await refreshDeviceSession();
    if (renovou) {
      return apiFetchInternal<TResponse>(path, options, true);
    }
    // Renovação falhou (sem refreshToken salvo, ou refreshToken também inválido/expirado/revogado):
    // encerra somente a sessão do contexto correspondente — uma falha de refresh de dispositivo
    // nunca apaga a sessão de usuário, e vice-versa. As telas continuam com seu próprio tratamento
    // de `error.status === 401` (chamando clearUserSession/clearDeviceSession de novo, idempotente)
    // para mostrar a mensagem de "sessão expirada" e redirecionar.
    if (context === "user") {
      clearUserSession();
    } else {
      clearDeviceSession();
    }
  }

  if (!response.ok) {
    let errorBody: ApiErrorResponse | undefined;
    try {
      errorBody = (await response.json()) as ApiErrorResponse;
    } catch {
      // resposta de erro sem corpo JSON (ex: 401 sem payload) — segue sem detalhe
    }
    throw new ApiError(
      response.status,
      errorBody?.message ?? `Falha na requisição (HTTP ${response.status})`,
      errorBody,
    );
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

/**
 * Cliente HTTP centralizado. Todas as chamadas às APIs do backend devem
 * passar por aqui — nenhuma tela deve chamar fetch/axios diretamente.
 */
export async function apiFetch<TResponse>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TResponse> {
  return apiFetchInternal<TResponse>(path, options, false);
}

export const api = {
  get: <TResponse>(path: string, options?: ApiFetchOptions) =>
    apiFetch<TResponse>(path, { ...options, method: "GET" }),

  post: <TResponse>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<TResponse>(path, { ...options, method: "POST", body }),

  put: <TResponse>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<TResponse>(path, { ...options, method: "PUT", body }),

  patch: <TResponse>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<TResponse>(path, { ...options, method: "PATCH", body }),

  delete: <TResponse>(path: string, options?: ApiFetchOptions) =>
    apiFetch<TResponse>(path, { ...options, method: "DELETE" }),
};
