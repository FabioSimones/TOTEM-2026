import { ApiError, type ApiErrorResponse } from "../types/api";
import { getAccessToken } from "./tokenStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

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
    const token = getAccessToken();
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
