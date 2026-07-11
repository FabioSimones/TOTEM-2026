import { api } from "./api";
import type { PageResponse, PedidoAdminDetalheResponse, PedidoAdminResumoResponse } from "../types/pedidoAdmin";
import type { StatusPedido } from "../types/totem";

interface FiltrosPedidoAdmin {
  restauranteId?: number;
  statusPedido?: StatusPedido;
  page?: number;
  size?: number;
}

/** GET /api/admin/pedidos[?restauranteId=][&statusPedido=][&page=][&size=] — exige token de usuário SUPER_ADMIN ou ADMIN_RESTAURANTE. */
export function listarPedidos(filtros?: FiltrosPedidoAdmin): Promise<PageResponse<PedidoAdminResumoResponse>> {
  const params = new URLSearchParams();
  if (filtros?.restauranteId !== undefined) {
    params.set("restauranteId", String(filtros.restauranteId));
  }
  if (filtros?.statusPedido !== undefined) {
    params.set("statusPedido", filtros.statusPedido);
  }
  if (filtros?.page !== undefined) {
    params.set("page", String(filtros.page));
  }
  if (filtros?.size !== undefined) {
    params.set("size", String(filtros.size));
  }
  const query = params.toString();
  return api.get<PageResponse<PedidoAdminResumoResponse>>(`/api/admin/pedidos${query ? `?${query}` : ""}`);
}

/** GET /api/admin/pedidos/{id} — retorna dados gerais, itens, pagamentos e histórico de status. */
export function buscarPedido(id: number): Promise<PedidoAdminDetalheResponse> {
  return api.get<PedidoAdminDetalheResponse>(`/api/admin/pedidos/${id}`);
}
