import { api } from "./api";
import type {
  AtualizarRestauranteRequest,
  CriarRestauranteRequest,
  RestauranteAdminResponse,
} from "../types/restaurante";

/** GET /api/admin/restaurantes — exige token de usuário SUPER_ADMIN. */
export function listarRestaurantes(): Promise<RestauranteAdminResponse[]> {
  return api.get<RestauranteAdminResponse[]>("/api/admin/restaurantes");
}

/**
 * GET /api/admin/restaurantes/{id} — exportada por completude/paridade com
 * o backend, mas não é chamada por nenhuma tela nesta task: as páginas
 * atuais sempre trabalham a partir da lista já carregada (`listarRestaurantes`),
 * nunca navegam para uma "página de detalhe" de um restaurante específico.
 */
export function buscarRestaurantePorId(id: number): Promise<RestauranteAdminResponse> {
  return api.get<RestauranteAdminResponse>(`/api/admin/restaurantes/${id}`);
}

/** POST /api/admin/restaurantes — backend nunca recebe `ativo` (sempre criado ativo). */
export function criarRestaurante(request: CriarRestauranteRequest): Promise<RestauranteAdminResponse> {
  return api.post<RestauranteAdminResponse>("/api/admin/restaurantes", request);
}

/** PUT /api/admin/restaurantes/{id} — backend nunca recebe `ativo` (usar ativar/desativar). */
export function atualizarRestaurante(
  id: number,
  request: AtualizarRestauranteRequest,
): Promise<RestauranteAdminResponse> {
  return api.put<RestauranteAdminResponse>(`/api/admin/restaurantes/${id}`, request);
}

/** PATCH /api/admin/restaurantes/{id}/ativar — sem corpo de requisição. */
export function ativarRestaurante(id: number): Promise<RestauranteAdminResponse> {
  return api.patch<RestauranteAdminResponse>(`/api/admin/restaurantes/${id}/ativar`);
}

/** PATCH /api/admin/restaurantes/{id}/desativar — sem corpo de requisição. */
export function desativarRestaurante(id: number): Promise<RestauranteAdminResponse> {
  return api.patch<RestauranteAdminResponse>(`/api/admin/restaurantes/${id}/desativar`);
}
