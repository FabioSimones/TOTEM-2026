import { ApiError, type ApiErrorResponse } from "../types/api";
import type { RefreshResponse } from "../types/auth";
import { clearSession, getAccessToken, getRefreshToken, saveRefreshedSession } from "./tokenStorage";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Se false, não anexa o header Authorization mesmo havendo token salvo. */
  withAuth?: boolean;
}

/**
 * Renovação automática de sessão (TASK-063). Só é acionada para chamadas com `withAuth: true`
 * (o padrão) — chamadas com `withAuth: false` (login/refresh/logout/ativar-dispositivo) nunca
 * disparam isso, então não há risco de recursão nelas. A renovação funciona para sessões de usuário
 * e dispositivo; o backend identifica o titular pelo refresh token persistido.
 *
 * `refreshEmAndamento` evita que requisições 401 concorrentes disparem múltiplas renovações em
 * paralelo (o refresh token é de uso único — duas chamadas simultâneas desperdiçariam uma rotação
 * derrubando a outra); todas aguardam a mesma renovação em andamento.
 */
let refreshEmAndamento: Promise<boolean> | null = null;

async function tentarRenovarSessao(): Promise<boolean> {
  if (refreshEmAndamento) {
    return refreshEmAndamento;
  }

  refreshEmAndamento = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }
    try {
      const response = await apiFetchInternal<RefreshResponse>(
        "/api/auth/refresh",
        { method: "POST", body: { refreshToken }, withAuth: false },
        true,
      );
      return saveRefreshedSession(response);
    } catch {
      return false;
    }
  })();

  try {
    return await refreshEmAndamento;
  } finally {
    refreshEmAndamento = null;
  }
}

async function apiFetchInternal<TResponse>(
  path: string,
  options: ApiFetchOptions,
  jaTentouRenovar: boolean,
): Promise<TResponse> {
  const { body, withAuth = true, headers, ...rest } = options;

  const isFormData = body instanceof FormData;

  const requestHeaders = new Headers(headers);
  if (!isFormData) {
    // Para FormData, o browser define Content-Type com o boundary correto sozinho.
    requestHeaders.set("Content-Type", "application/json");
  }

  if (withAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && withAuth && !jaTentouRenovar) {
    const renovou = await tentarRenovarSessao();
    if (renovou) {
      return apiFetchInternal<TResponse>(path, options, true);
    }
    // Renovação falhou (sem refreshToken salvo, ou refreshToken também inválido/expirado/revogado):
    // limpa a sessão aqui: sessão de fato inválida. As telas continuam com seu próprio tratamento
    // de `error.status === 401` (chamando clearSession de novo, idempotente) para mostrar a mensagem
    // de "sessão expirada" e redirecionar ao login.
    clearSession();
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
