import { api } from "./api";
import type { AtivarDispositivoRequest, AtivarDispositivoResponse } from "../types/auth";

/**
 * POST /api/auth/dispositivos/ativar — endpoint público, não exige token.
 */
export function ativarDispositivo(codigoAtivacao: string): Promise<AtivarDispositivoResponse> {
  const request: AtivarDispositivoRequest = { codigoAtivacao };
  return api.post<AtivarDispositivoResponse>("/api/auth/dispositivos/ativar", request, {
    withAuth: false,
  });
}
