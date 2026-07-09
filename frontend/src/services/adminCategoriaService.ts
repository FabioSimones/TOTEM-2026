import { api } from "./api";
import type { AtualizarCategoriaRequest, CategoriaAdminResponse, CriarCategoriaRequest } from "../types/categoria";

/** GET /api/admin/categorias[?restauranteId=] — exige token de usuário SUPER_ADMIN ou ADMIN_RESTAURANTE. */
export function listarCategorias(restauranteId?: number): Promise<CategoriaAdminResponse[]> {
  const query = restauranteId !== undefined ? `?restauranteId=${restauranteId}` : "";
  return api.get<CategoriaAdminResponse[]>(`/api/admin/categorias${query}`);
}

/** POST /api/admin/categorias — backend nunca recebe `ativa` (usa true por padrão). */
export function criarCategoria(request: CriarCategoriaRequest): Promise<CategoriaAdminResponse> {
  return api.post<CategoriaAdminResponse>("/api/admin/categorias", request);
}

/** PUT /api/admin/categorias/{id} — backend nunca recebe `ativa` (preserva o valor atual) nem `restauranteId`. */
export function atualizarCategoria(
  id: number,
  request: AtualizarCategoriaRequest,
): Promise<CategoriaAdminResponse> {
  return api.put<CategoriaAdminResponse>(`/api/admin/categorias/${id}`, request);
}

/** DELETE /api/admin/categorias/{id} — inativação lógica, sem corpo de requisição. */
export function inativarCategoria(id: number): Promise<CategoriaAdminResponse> {
  return api.delete<CategoriaAdminResponse>(`/api/admin/categorias/${id}`);
}
