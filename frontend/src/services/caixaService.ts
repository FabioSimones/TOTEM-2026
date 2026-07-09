import { api } from "./api";
import type { PedidoPendenteCaixaResponse } from "../types/caixa";

/** GET /api/caixa/pedidos/pendentes — exige token de dispositivo CAIXA (anexado automaticamente por api.ts). */
export function listarPendencias(): Promise<PedidoPendenteCaixaResponse[]> {
  return api.get<PedidoPendenteCaixaResponse[]>("/api/caixa/pedidos/pendentes");
}
