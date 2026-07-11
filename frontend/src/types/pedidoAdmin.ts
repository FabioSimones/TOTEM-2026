import type { FormaPagamento, StatusPagamento, StatusPedido, TipoConsumo } from "./totem";

/** Envelope de paginação genérico usado por listagens administrativas paginadas. */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** GET /api/admin/pedidos[?restauranteId=][&statusPedido=][&page=][&size=] */
export interface PedidoAdminResumoResponse {
  pedidoId: number;
  numeroPedido: string;
  restauranteId: number;
  restauranteNome: string;
  clienteNome: string | null;
  tipoConsumo: TipoConsumo;
  statusPedido: StatusPedido;
  valorTotal: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ItemPedidoAdminResponse {
  produtoId: number | null;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  observacao: string | null;
}

export interface PagamentoAdminResponse {
  id: number;
  formaPagamento: FormaPagamento;
  statusPagamento: StatusPagamento;
  valor: number;
  paymentProvider: string | null;
  externalPaymentId: string | null;
  criadoEm: string;
  pagoEm: string | null;
  canceladoEm: string | null;
}

export interface HistoricoPedidoAdminResponse {
  statusAnterior: StatusPedido | null;
  statusNovo: StatusPedido;
  dataAlteracao: string;
  observacao: string | null;
  alteradoPorUsuarioNome: string | null;
  alteradoPorDispositivoNome: string | null;
}

/** GET /api/admin/pedidos/{id} */
export interface PedidoAdminDetalheResponse extends PedidoAdminResumoResponse {
  itens: ItemPedidoAdminResponse[];
  pagamentos: PagamentoAdminResponse[];
  historico: HistoricoPedidoAdminResponse[];
}
