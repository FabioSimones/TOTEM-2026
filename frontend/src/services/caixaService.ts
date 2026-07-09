import { api } from "./api";
import type {
  ConfirmarPagamentoDinheiroRequest,
  ConfirmarPagamentoDinheiroResponse,
  EnviarPedidoCozinhaResponse,
  PedidoPendenteCaixaResponse,
} from "../types/caixa";

/** GET /api/caixa/pedidos/pendentes — exige token de dispositivo CAIXA (anexado automaticamente por api.ts). */
export function listarPendencias(): Promise<PedidoPendenteCaixaResponse[]> {
  return api.get<PedidoPendenteCaixaResponse[]>("/api/caixa/pedidos/pendentes");
}

/** POST /api/caixa/pedidos/{id}/confirmar-pagamento — valor/forma/status vêm do pedido já persistido. */
export function confirmarPagamentoDinheiro(
  pedidoId: number,
  request: ConfirmarPagamentoDinheiroRequest,
): Promise<ConfirmarPagamentoDinheiroResponse> {
  return api.post<ConfirmarPagamentoDinheiroResponse>(`/api/caixa/pedidos/${pedidoId}/confirmar-pagamento`, request);
}

/** POST /api/caixa/pedidos/{id}/enviar-cozinha — sem corpo de requisição. */
export function enviarPedidoParaCozinha(pedidoId: number): Promise<EnviarPedidoCozinhaResponse> {
  return api.post<EnviarPedidoCozinhaResponse>(`/api/caixa/pedidos/${pedidoId}/enviar-cozinha`);
}
