import type { StatusPedido, TipoConsumo } from "./totem";

/** GET /api/cozinha/pedidos — sem dados financeiros */
export interface ItemPedidoCozinhaResponse {
  produtoId: number;
  nomeProduto: string;
  quantidade: number;
  observacao: string | null;
}

export interface PedidoCozinhaResponse {
  pedidoId: number;
  numeroPedido: string;
  statusPedido: StatusPedido;
  tipoConsumo: TipoConsumo;
  clienteNome: string | null;
  criadoEm: string;
  atualizadoEm: string;
  itens: ItemPedidoCozinhaResponse[];
}

/** PATCH /api/cozinha/pedidos/{id}/status */
export interface AtualizarStatusPedidoCozinhaRequest {
  statusPedido: StatusPedido;
  observacao?: string;
}

export interface AtualizarStatusPedidoCozinhaResponse {
  pedidoId: number;
  numeroPedido: string;
  statusAnterior: StatusPedido;
  statusAtual: StatusPedido;
  atualizadoEm: string;
}
