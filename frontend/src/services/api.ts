import { ApiError, type ApiErrorResponse } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const TOKEN_STORAGE_KEY = "totem.accessToken";

/**
 * Armazenamento simples do token em localStorage. Não é um fluxo de
 * autenticação completo (sem refresh) — apenas o suficiente para o
 * cliente HTTP anexar o header Authorization quando houver token.
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Se false, não anexa o header Authorization mesmo havendo token salvo. */
  withAuth?: boolean;
}

/**
 * Cliente HTTP centralizado. Todas as chamadas às APIs do backend devem
 * passar por aqui — nenhuma tela deve chamar fetch/axios diretamente.
 */
export async function apiFetch<TResponse>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TResponse> {
  const { body, withAuth = true, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  if (withAuth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
