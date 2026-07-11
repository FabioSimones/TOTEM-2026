import { api } from "./api";
import type { DashboardAdminResponse } from "../types/dashboardAdmin";

interface FiltrosDashboardAdmin {
  restauranteId?: number;
}

/** GET /api/admin/dashboard[?restauranteId=] — exige token de usuário SUPER_ADMIN ou ADMIN_RESTAURANTE. */
export function obterDashboard(filtros?: FiltrosDashboardAdmin): Promise<DashboardAdminResponse> {
  const params = new URLSearchParams();
  if (filtros?.restauranteId !== undefined) {
    params.set("restauranteId", String(filtros.restauranteId));
  }
  const query = params.toString();
  return api.get<DashboardAdminResponse>(`/api/admin/dashboard${query ? `?${query}` : ""}`);
}
