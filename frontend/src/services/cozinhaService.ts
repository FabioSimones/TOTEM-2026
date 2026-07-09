import { api } from "./api";
import type {
  AtualizarStatusPedidoCozinhaRequest,
  AtualizarStatusPedidoCozinhaResponse,
  PedidoCozinhaResponse,
} from "../types/cozinha";

/** GET /api/cozinha/pedidos — exige token de dispositivo COZINHA (anexado automaticamente por api.ts). */
export function listarPedidosCozinha(): Promise<PedidoCozinhaResponse[]> {
  return api.get<PedidoCozinhaResponse[]>("/api/cozinha/pedidos");
}

/** PATCH /api/cozinha/pedidos/{id}/status — só avança ENVIADO_PARA_COZINHA→EM_PREPARO ou EM_PREPARO→PRONTO. */
export function atualizarStatusPedidoCozinha(
  pedidoId: number,
  request: AtualizarStatusPedidoCozinhaRequest,
): Promise<AtualizarStatusPedidoCozinhaResponse> {
  return api.patch<AtualizarStatusPedidoCozinhaResponse>(`/api/cozinha/pedidos/${pedidoId}/status`, request);
}
