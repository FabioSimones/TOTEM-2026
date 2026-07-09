import { api } from "./api";
import type {
  CardapioTotemResponse,
  CriarPedidoTotemRequest,
  IniciarPagamentoTotemRequest,
  PagamentoTotemResponse,
  PedidoTotemResponse,
} from "../types/totem";

/** GET /api/totem/cardapio — exige token de dispositivo TOTEM (anexado automaticamente por api.ts). */
export function buscarCardapio(): Promise<CardapioTotemResponse> {
  return api.get<CardapioTotemResponse>("/api/totem/cardapio");
}

/** POST /api/totem/pedidos — cria pedido a partir do carrinho local. Backend calcula preços/total. */
export function criarPedido(request: CriarPedidoTotemRequest): Promise<PedidoTotemResponse> {
  return api.post<PedidoTotemResponse>("/api/totem/pedidos", request);
}

/** POST /api/totem/pedidos/{id}/pagamento — backend define valor/status; frontend só escolhe a forma. */
export function iniciarPagamento(
  pedidoId: number,
  request: IniciarPagamentoTotemRequest,
): Promise<PagamentoTotemResponse> {
  return api.post<PagamentoTotemResponse>(`/api/totem/pedidos/${pedidoId}/pagamento`, request);
}

/** GET /api/totem/pedidos/{id} — consulta o status atual do pedido (atualização manual/polling). */
export function consultarPedido(pedidoId: number): Promise<PedidoTotemResponse> {
  return api.get<PedidoTotemResponse>(`/api/totem/pedidos/${pedidoId}`);
}
