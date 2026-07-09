import { api } from "./api";
import type {
  AtivarDispositivoRequest,
  AtivarDispositivoResponse,
  LoginRequest,
  LoginResponse,
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
