/**
 * POST/PUT /api/admin/categorias — o frontend nunca envia `ativa`: no
 * create o backend usa `true` por padrão quando omitido; no update, se
 * omitido, o backend preserva o valor atual. Inativação é feita só via
 * DELETE /api/admin/categorias/{id} (inativação lógica).
 */
export interface CriarCategoriaRequest {
  restauranteId: number;
  nome: string;
  descricao?: string;
  ordemExibicao?: number;
}

/** PUT /api/admin/categorias/{id} — restauranteId não pode ser alterado por edição. */
export interface AtualizarCategoriaRequest {
  nome: string;
  descricao?: string;
  ordemExibicao?: number;
}

/** GET/POST/PUT/DELETE /api/admin/categorias — resposta completa do backend (sem criadoEm/atualizadoEm). */
export interface CategoriaAdminResponse {
  id: number;
  restauranteId: number;
  nome: string;
  descricao: string | null;
  ordemExibicao: number | null;
  ativa: boolean;
}
