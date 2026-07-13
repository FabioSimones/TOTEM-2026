import { api } from "./api";
import type {
  AtivarDispositivoRequest,
  AtivarDispositivoResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  OperadorLoginRequest,
  OperadorLoginResponse,
  RefreshRequest,
  RefreshResponse,
} from "../types/auth";

/**
 * POST /api/auth/dispositivos/ativar — endpoint público, não exige token.
 */
export function ativarDispositivo(codigoAtivacao: string): Promise<AtivarDispositivoResponse> {
  const request: AtivarDispositivoRequest = { codigoAtivacao };
  return api.post<AtivarDispositivoResponse>("/api/auth/dispositivos/ativar", request, {
    withAuth: false,
  });
}

/** POST /api/auth/login — endpoint público, não exige token. Autenticação de usuário humano (admin/operador). */
export function login(request: LoginRequest): Promise<LoginResponse> {
  return api.post<LoginResponse>("/api/auth/login", request, { withAuth: false });
}

/**
 * POST /api/auth/refresh — endpoint público (valida o refreshToken no corpo, não exige Bearer).
 * Troca um refreshToken válido por um novo par accessToken/refreshToken (rotação: o informado é
 * revogado). Usado tanto por `api.ts` (renovação automática em 401) quanto manualmente, se necessário.
 */
export function refreshToken(request: RefreshRequest): Promise<RefreshResponse> {
  return api.post<RefreshResponse>("/api/auth/refresh", request, { withAuth: false });
}

/** POST /api/auth/logout — endpoint público, idempotente. Revoga o refreshToken informado. */
export function logout(request: LogoutRequest): Promise<void> {
  return api.post<void>("/api/auth/logout", request, { withAuth: false });
}

/**
 * POST /api/auth/operador/login (TASK-092) — identifica um operador humano dentro do dispositivo
 * CAIXA/COZINHA atual. Exige o Authorization do dispositivo (`withAuth` padrão, anexado
 * automaticamente por `api.ts` a partir de `totem.accessToken`) — nunca um token de operador.
 */
export function loginOperador(email: string, senha: string): Promise<OperadorLoginResponse> {
  const request: OperadorLoginRequest = { email, senha };
  return api.post<OperadorLoginResponse>("/api/auth/operador/login", request);
}
