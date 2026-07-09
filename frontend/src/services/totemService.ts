import { api } from "./api";
import type { CardapioTotemResponse, CriarPedidoTotemRequest, PedidoTotemResponse } from "../types/totem";

/** GET /api/totem/cardapio — exige token de dispositivo TOTEM (anexado automaticamente por api.ts). */
export function buscarCardapio(): Promise<CardapioTotemResponse> {
  return api.get<CardapioTotemResponse>("/api/totem/cardapio");
}

/** POST /api/totem/pedidos — cria pedido a partir do carrinho local. Backend calcula preços/total. */
export function criarPedido(request: CriarPedidoTotemRequest): Promise<PedidoTotemResponse> {
  return api.post<PedidoTotemResponse>("/api/totem/pedidos", request);
}
