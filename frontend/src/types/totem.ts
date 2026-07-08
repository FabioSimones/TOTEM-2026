export type StatusPedido =
  | "CRIADO"
  | "AGUARDANDO_PAGAMENTO"
  | "AGUARDANDO_PAGAMENTO_DINHEIRO"
  | "PAGO"
  | "ENVIADO_PARA_COZINHA"
  | "EM_PREPARO"
  | "PRONTO"
  | "RETIRADO"
  | "CANCELADO"
  | "EXPIRADO";

export type TipoConsumo = "LOCAL" | "VIAGEM";

export type FormaPagamento = "PIX" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "DINHEIRO";

export type StatusPagamento = "PENDENTE" | "AUTORIZADO" | "RECUSADO" | "CANCELADO" | "ESTORNADO";

/** GET /api/totem/cardapio */
export interface ProdutoCardapioResponse {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagemUrl: string | null;
  destaque: boolean;
  recomendado: boolean;
  ordemExibicao: number | null;
}

export interface CategoriaCardapioResponse {
  id: number;
  nome: string;
  descricao: string | null;
  ordemExibicao: number | null;
  produtos: ProdutoCardapioResponse[];
}

export interface CardapioTotemResponse {
  restauranteId: number;
  categorias: CategoriaCardapioResponse[];
}

/** POST /api/totem/pedidos */
export interface ItemPedidoTotemRequest {
  produtoId: number;
  quantidade: number;
  observacao?: string;
}

export interface CriarPedidoTotemRequest {
  tipoConsumo: TipoConsumo;
  clienteNome?: string;
  itens: ItemPedidoTotemRequest[];
}

export interface ItemPedidoTotemResponse {
  produtoId: number;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  observacao: string | null;
}

export interface PedidoTotemResponse {
  pedidoId: number;
  numeroPedido: string;
  statusPedido: StatusPedido;
  tipoConsumo: TipoConsumo;
  clienteNome: string | null;
  valorTotal: number;
  itens: ItemPedidoTotemResponse[];
  criadoEm: string;
}

/** POST /api/totem/pedidos/{id}/pagamento */
export interface IniciarPagamentoTotemRequest {
  formaPagamento: FormaPagamento;
}

export interface PagamentoTotemResponse {
  pedidoId: number;
  numeroPedido: string;
  statusPedido: StatusPedido;
  pagamentoId: number;
  formaPagamento: FormaPagamento;
  statusPagamento: StatusPagamento;
  valor: number;
  codigoAutorizacao: string | null;
  referenciaExterna: string | null;
  mensagem: string | null;
  criadoEm: string;
}
