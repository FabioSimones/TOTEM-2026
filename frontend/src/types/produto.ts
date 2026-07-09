/**
 * POST /api/admin/produtos — disponivel/destaque/recomendado são opcionais;
 * se omitidos o backend usa true/false/false por padrão.
 */
export interface CriarProdutoRequest {
  restauranteId: number;
  categoriaId: number;
  nome: string;
  descricao?: string;
  preco: number;
  imagemUrl?: string;
  disponivel?: boolean;
  destaque?: boolean;
  recomendado?: boolean;
  ordemExibicao?: number;
}

/**
 * PUT /api/admin/produtos/{id} — sem restauranteId (não muda por edição).
 * O frontend nunca envia disponivel/destaque aqui: cada um tem um PATCH
 * dedicado, e se omitidos no PUT o backend preserva o valor atual. Já
 * `recomendado` não tem endpoint próprio, por isso continua editável aqui.
 */
export interface AtualizarProdutoRequest {
  categoriaId: number;
  nome: string;
  descricao?: string;
  preco: number;
  imagemUrl?: string;
  recomendado?: boolean;
  ordemExibicao?: number;
}

/** GET/POST/PUT/DELETE /api/admin/produtos — resposta completa do backend. */
export interface ProdutoAdminResponse {
  id: number;
  restauranteId: number;
  categoriaId: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagemUrl: string | null;
  disponivel: boolean;
  destaque: boolean;
  recomendado: boolean;
  ordemExibicao: number | null;
  criadoEm: string;
  atualizadoEm: string;
}

/** PATCH /api/admin/produtos/{id}/disponibilidade */
export interface AlterarDisponibilidadeProdutoRequest {
  disponivel: boolean;
}

/** PATCH /api/admin/produtos/{id}/destaque */
export interface AlterarDestaqueProdutoRequest {
  destaque: boolean;
}
