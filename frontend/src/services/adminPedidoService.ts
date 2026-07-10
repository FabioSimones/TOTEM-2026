import { api } from "./api";
import type { PedidoAdminDetalheResponse, PedidoAdminResumoResponse } from "../types/pedidoAdmin";
import type { StatusPedido } from "../types/totem";

interface FiltrosPedidoAdmin {
  restauranteId?: number;
  statusPedido?: StatusPedido;
}

/** GET /api/admin/pedidos[?restauranteId=][&statusPedido=] — exige token de usuário SUPER_ADMIN ou ADMIN_RESTAURANTE. */
export function listarPedidos(filtros?: FiltrosPedidoAdmin): Promise<PedidoAdminResumoResponse[]> {
  const params = new URLSearchParams();
  if (filtros?.restauranteId !== undefined) {
    params.set("restauranteId", String(filtros.restauranteId));
  }
  if (filtros?.statusPedido !== undefined) {
    params.set("statusPedido", filtros.statusPedido);
  }
  const query = params.toString();
  return api.get<PedidoAdminResumoResponse[]>(`/api/admin/pedidos${query ? `?${query}` : ""}`);
}

/** GET /api/admin/pedidos/{id} — retorna dados gerais, itens, pagamentos e histórico de status. */
export function buscarPedido(id: number): Promise<PedidoAdminDetalheResponse> {
  return api.get<PedidoAdminDetalheResponse>(`/api/admin/pedidos/${id}`);
}
