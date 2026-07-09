/**
 * POST/PUT /api/admin/restaurantes — o backend nunca aceita `ativo` no
 * create/update (só via PATCH .../ativar|desativar). `cnpj` deve conter
 * exatamente 14 dígitos numéricos, sem formatação.
 */
export interface CriarRestauranteRequest {
  nome: string;
  cnpj: string;
  endereco?: string;
}

export interface AtualizarRestauranteRequest {
  nome: string;
  cnpj: string;
  endereco?: string;
}

/** GET/POST/PUT/PATCH /api/admin/restaurantes — resposta completa do backend. */
export interface RestauranteAdminResponse {
  id: number;
  nome: string;
  cnpj: string;
  endereco: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
