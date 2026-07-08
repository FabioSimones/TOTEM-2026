import type { DispositivoAutenticadoResponse } from "../types/auth";

/**
 * Armazenamento simples de sessão em localStorage — aceitável para este
 * estágio do MVP (sem múltiplas abas/dispositivos concorrentes a resolver,
 * sem refresh token). Deve ser revisto se o projeto migrar para um fluxo
 * de autenticação mais robusto (ex: cookies httpOnly, refresh token).
 *
 * Não armazena senha nem qualquer dado sensível além do token de acesso
 * e dos campos mínimos do dispositivo necessários para a UI (nome, tipo).
 */
const ACCESS_TOKEN_KEY = "totem.accessToken";
const DISPOSITIVO_KEY = "totem.dispositivo";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getStoredDispositivo(): DispositivoAutenticadoResponse | null {
  const raw = localStorage.getItem(DISPOSITIVO_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as DispositivoAutenticadoResponse;
  } catch {
    return null;
  }
}

export function setStoredDispositivo(dispositivo: DispositivoAutenticadoResponse): void {
  localStorage.setItem(DISPOSITIVO_KEY, JSON.stringify(dispositivo));
}

export function clearStoredDispositivo(): void {
  localStorage.removeItem(DISPOSITIVO_KEY);
}

/** Limpa toda a sessão local (token + dispositivo). Uso básico de "logout". */
export function clearSession(): void {
  clearAccessToken();
  clearStoredDispositivo();
}
