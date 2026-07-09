import { api } from "./api";
import type { AtualizarUsuarioRequest, CriarUsuarioRequest, UsuarioAdminResponse } from "../types/usuario";

/** GET /api/admin/usuarios[?restauranteId=] — exige token de usuário SUPER_ADMIN. */
export function listarUsuarios(restauranteId?: number): Promise<UsuarioAdminResponse[]> {
  const query = restauranteId !== undefined ? `?restauranteId=${restauranteId}` : "";
  return api.get<UsuarioAdminResponse[]>(`/api/admin/usuarios${query}`);
}

/** POST /api/admin/usuarios */
export function criarUsuario(request: CriarUsuarioRequest): Promise<UsuarioAdminResponse> {
  return api.post<UsuarioAdminResponse>("/api/admin/usuarios", request);
}

/** PUT /api/admin/usuarios/{id} — não aceita senha nem ativo. */
export function atualizarUsuario(id: number, request: AtualizarUsuarioRequest): Promise<UsuarioAdminResponse> {
  return api.put<UsuarioAdminResponse>(`/api/admin/usuarios/${id}`, request);
}

/** PATCH /api/admin/usuarios/{id}/ativar — sem corpo de requisição. */
export function ativarUsuario(id: number): Promise<UsuarioAdminResponse> {
  return api.patch<UsuarioAdminResponse>(`/api/admin/usuarios/${id}/ativar`);
}

/** PATCH /api/admin/usuarios/{id}/desativar — sem corpo de requisição. Backend bloqueia autodesativação. */
export function desativarUsuario(id: number): Promise<UsuarioAdminResponse> {
  return api.patch<UsuarioAdminResponse>(`/api/admin/usuarios/${id}/desativar`);
}
