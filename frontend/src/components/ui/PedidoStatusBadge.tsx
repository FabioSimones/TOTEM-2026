import type { StatusPedido } from "../../types/totem";
import { getPedidoStatusLabel } from "../../utils/pedidoStatus";

interface PedidoStatusBadgeProps {
  status: StatusPedido;
}

/**
 * TASK-119: extraído de `PedidoPendenteCard`/`PedidoCozinhaCard` — os dois já renderiam o mesmo
 * `<span className="pedido-pendente-card__status">{getPedidoStatusLabel(...)}</span>`, duplicado
 * em cada componente. O texto (não só a cor) já era a fonte da informação de status, preservado
 * aqui sem alteração de contrato visual.
 */
export function PedidoStatusBadge({ status }: PedidoStatusBadgeProps) {
  return <span className="pedido-pendente-card__status">{getPedidoStatusLabel(status)}</span>;
}
