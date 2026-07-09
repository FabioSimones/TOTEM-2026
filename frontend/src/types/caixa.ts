import type { FormaPagamento, StatusPagamento, StatusPedido, TipoConsumo } from "./totem";

export type AcaoCaixa = "CONFIRMAR_PAGAMENTO" | "ENVIAR_PARA_COZINHA" | "MARCAR_RETIRADO";

/** GET /api/caixa/pedidos/pendentes */
export interface ItemPedidoPendenteCaixaResponse {
  produtoId: number;
  nomeProduto: string;
  quantidade: number;
  observacao: string | null;
  subtotal: number;
}

export interface PedidoPendenteCaixaResponse {
  pedidoId: number;
  numeroPedido: string;
  statusPedido: StatusPedido;
  tipoConsumo: TipoConsumo;
  clienteNome: string | null;
  valorTotal: number;
  criadoEm: string;
  atualizadoEm: string;
  acaoSugerida: AcaoCaixa;
  itens: ItemPedidoPendenteCaixaResponse[];
}

/** POST /api/caixa/pedidos/{id}/confirmar-pagamento */
export interface ConfirmarPagamentoDinheiroRequest {
  observacao?: string;
}

export interface ConfirmarPagamentoDinheiroResponse {
  pedidoId: number;
  numeroPedido: string;
  statusPedido: StatusPedido;
  pagamentoId: number;
  formaPagamento: FormaPagamento;
  statusPagamento: StatusPagamento;
  valor: number;
  confirmadoEm: string;
}

/** POST /api/caixa/pedidos/{id}/enviar-cozinha — sem corpo de requisição. */
export interface EnviarPedidoCozinhaResponse {
  pedidoId: number;
  numeroPedido: string;
  statusPedido: StatusPedido;
  valorTotal: number;
  enviadoParaCozinhaEm: string;
}

/**
 * POST /api/caixa/pedidos/{id}/retirar — sem corpo de requisição.
 * Só é aceito pelo backend para pedido em status PRONTO. A partir da
 * TASK-040, GET /pedidos/pendentes também retorna pedidos PRONTO
 * (acaoSugerida=MARCAR_RETIRADO), então este tipo já é usado pela UI.
 */
export interface RetirarPedidoResponse {
  pedidoId: number;
  numeroPedido: string;
  statusAnterior: StatusPedido;
  statusAtual: StatusPedido;
  atualizadoEm: string;
}

/** POST /api/caixa/pedidos/{id}/cancelar */
export interface CancelarPedidoRequest {
  motivo: string;
}

export interface CancelarPedidoResponse {
  pedidoId: number;
  numeroPedido: string;
  statusAnterior: StatusPedido;
  statusAtual: StatusPedido;
  motivo: string;
  atualizadoEm: string;
}
