import { api } from "./api";
import type { AtualizarDispositivoRequest, CriarDispositivoRequest, DispositivoAdminResponse } from "../types/dispositivo";

/** GET /api/admin/dispositivos — exige token de usuário SUPER_ADMIN ou ADMIN_RESTAURANTE. */
export function listarDispositivos(): Promise<DispositivoAdminResponse[]> {
  return api.get<DispositivoAdminResponse[]>("/api/admin/dispositivos");
}

/** POST /api/admin/dispositivos — backend gera codigoAtivacao; frontend nunca envia ativo/ativado. */
export function criarDispositivo(request: CriarDispositivoRequest): Promise<DispositivoAdminResponse> {
  return api.post<DispositivoAdminResponse>("/api/admin/dispositivos", request);
}

/** PUT /api/admin/dispositivos/{id} — não aceita restauranteId nem ativo/ativado/codigoAtivacao. */
export function atualizarDispositivo(
  id: number,
  request: AtualizarDispositivoRequest,
): Promise<DispositivoAdminResponse> {
  return api.put<DispositivoAdminResponse>(`/api/admin/dispositivos/${id}`, request);
}

/** PATCH /api/admin/dispositivos/{id}/revogar — sem corpo de requisição. */
export function revogarDispositivo(id: number): Promise<DispositivoAdminResponse> {
  return api.patch<DispositivoAdminResponse>(`/api/admin/dispositivos/${id}/revogar`);
}

/** PATCH /api/admin/dispositivos/{id}/ativar — sem corpo de requisição. */
export function reativarDispositivo(id: number): Promise<DispositivoAdminResponse> {
  return api.patch<DispositivoAdminResponse>(`/api/admin/dispositivos/${id}/ativar`);
}
