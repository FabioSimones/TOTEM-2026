import type {
  AtivarDispositivoResponse,
  DispositivoAutenticadoResponse,
  LoginResponse,
  RefreshResponse,
  UsuarioAutenticadoResponse,
} from "../types/auth";

/**
 * Armazenamento simples de sessão em localStorage — aceitável para este
 * estágio do MVP (sem múltiplas abas/dispositivos concorrentes a resolver).
 * Deve ser revisto se o projeto migrar para um fluxo de autenticação mais
 * robusto (ex: cookies httpOnly).
 *
 * Não armazena senha nem qualquer dado sensível além dos tokens de acesso/
 * renovação e dos campos mínimos de dispositivo/usuário necessários para a UI.
 *
 * `totem.accessToken` é compartilhado entre os dois tipos de sessão
 * (dispositivo Totem/Caixa/Cozinha OU usuário humano administrativo) — só
 * um dos dois (`totem.dispositivo` ou `totem.usuario`) deve estar
 * preenchido por vez, nunca os dois ao mesmo tempo. Ambos os tipos de sessão
 * usam `totem.refreshToken`, com o titular identificado pela resposta da API.
 */
const ACCESS_TOKEN_KEY = "totem.accessToken";
const REFRESH_TOKEN_KEY = "totem.refreshToken";
const DISPOSITIVO_KEY = "totem.dispositivo";
const USUARIO_KEY = "totem.usuario";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
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

export function getStoredUsuario(): UsuarioAutenticadoResponse | null {
  const raw = localStorage.getItem(USUARIO_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UsuarioAutenticadoResponse;
  } catch {
    return null;
  }
}

export function setStoredUsuario(usuario: UsuarioAutenticadoResponse): void {
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function clearStoredUsuario(): void {
  localStorage.removeItem(USUARIO_KEY);
}

/** Salva a sessão de usuário humano (login administrativo) a partir da resposta de POST /api/auth/login (ou /refresh). */
export function saveUserSession(response: LoginResponse): void {
  setAccessToken(response.accessToken);
  setRefreshToken(response.refreshToken);
  setStoredUsuario(response.usuario);
  clearStoredDispositivo();
}

/** Salva uma sessão operacional criada pela ativação do dispositivo. */
export function saveDeviceSession(response: AtivarDispositivoResponse): void {
  setAccessToken(response.accessToken);
  setRefreshToken(response.refreshToken);
  setStoredDispositivo(response.dispositivo);
  clearStoredUsuario();
}

/** Atualiza tokens e dados do titular após a rotação automática. */
export function saveRefreshedSession(response: RefreshResponse): boolean {
  setAccessToken(response.accessToken);
  setRefreshToken(response.refreshToken);
  if (response.usuario) {
    setStoredUsuario(response.usuario);
    clearStoredDispositivo();
    return true;
  }
  if (response.dispositivo) {
    setStoredDispositivo(response.dispositivo);
    clearStoredUsuario();
    return true;
  }
  clearSession();
  return false;
}

/** Limpa toda a sessão local (tokens + dispositivo + usuário). Uso básico de "logout". */
export function clearSession(): void {
  clearAccessToken();
  clearRefreshToken();
  clearStoredDispositivo();
  clearStoredUsuario();
}
