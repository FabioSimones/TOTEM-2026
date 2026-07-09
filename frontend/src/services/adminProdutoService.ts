import { api } from "./api";
import type {
  AlterarDestaqueProdutoRequest,
  AlterarDisponibilidadeProdutoRequest,
  AtualizarProdutoRequest,
  CriarProdutoRequest,
  ProdutoAdminResponse,
} from "../types/produto";

interface FiltrosListarProdutos {
  restauranteId?: number;
  categoriaId?: number;
  disponivel?: boolean;
}

/** GET /api/admin/produtos[?restauranteId=&categoriaId=&disponivel=] — filtros opcionais combináveis. */
export function listarProdutos(filtros?: FiltrosListarProdutos): Promise<ProdutoAdminResponse[]> {
  const params = new URLSearchParams();
  if (filtros?.restauranteId !== undefined) {
    params.set("restauranteId", String(filtros.restauranteId));
  }
  if (filtros?.categoriaId !== undefined) {
    params.set("categoriaId", String(filtros.categoriaId));
  }
  if (filtros?.disponivel !== undefined) {
    params.set("disponivel", String(filtros.disponivel));
  }
  const query = params.toString();
  return api.get<ProdutoAdminResponse[]>(`/api/admin/produtos${query ? `?${query}` : ""}`);
}

/** POST /api/admin/produtos */
export function criarProduto(request: CriarProdutoRequest): Promise<ProdutoAdminResponse> {
  return api.post<ProdutoAdminResponse>("/api/admin/produtos", request);
}

/** PUT /api/admin/produtos/{id} — nunca envia disponivel/destaque (usar os PATCH dedicados). */
export function atualizarProduto(id: number, request: AtualizarProdutoRequest): Promise<ProdutoAdminResponse> {
  return api.put<ProdutoAdminResponse>(`/api/admin/produtos/${id}`, request);
}

/**
 * DELETE /api/admin/produtos/{id} — inativação lógica (define disponivel=false),
 * funcionalmente idêntica a `alterarDisponibilidadeProduto(id, { disponivel: false })`.
 * Exportada por completude/paridade com o backend, mas a UI desta task usa
 * exclusivamente o PATCH de disponibilidade (liga/desliga simétrico) para
 * evitar dois botões que fariam a mesma coisa — ver README.
 */
export function inativarProduto(id: number): Promise<ProdutoAdminResponse> {
  return api.delete<ProdutoAdminResponse>(`/api/admin/produtos/${id}`);
}

/** PATCH /api/admin/produtos/{id}/disponibilidade */
export function alterarDisponibilidadeProduto(
  id: number,
  request: AlterarDisponibilidadeProdutoRequest,
): Promise<ProdutoAdminResponse> {
  return api.patch<ProdutoAdminResponse>(`/api/admin/produtos/${id}/disponibilidade`, request);
}

/** PATCH /api/admin/produtos/{id}/destaque */
export function alterarDestaqueProduto(
  id: number,
  request: AlterarDestaqueProdutoRequest,
): Promise<ProdutoAdminResponse> {
  return api.patch<ProdutoAdminResponse>(`/api/admin/produtos/${id}/destaque`, request);
}
