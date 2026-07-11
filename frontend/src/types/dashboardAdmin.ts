/** GET /api/admin/dashboard[?restauranteId=] */
export interface DashboardAdminResponse {
  restauranteId: number | null;
  restauranteNome: string | null;
  dataReferencia: string;
  totalPedidosHoje: number;
  pendentesPagamento: number;
  pagosAguardandoCozinha: number;
  emOperacao: number;
  prontosRetirada: number;
  retiradosHoje: number;
  canceladosHoje: number;
  expiradosHoje: number;
  valorPagoHoje: number;
}
