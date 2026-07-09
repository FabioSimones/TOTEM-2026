import type { StatusPedido } from "../types/totem";

const ROTULOS: Record<StatusPedido, string> = {
  CRIADO: "Pedido criado",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  AGUARDANDO_PAGAMENTO_DINHEIRO: "Aguardando pagamento no caixa",
  PAGO: "Pagamento confirmado",
  ENVIADO_PARA_COZINHA: "Enviado para a cozinha",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto para retirada",
  RETIRADO: "Retirado",
  CANCELADO: "Cancelado",
  EXPIRADO: "Expirado",
};

const DESCRICOES: Record<StatusPedido, string> = {
  CRIADO: "Pedido criado. Aguarde o pagamento.",
  AGUARDANDO_PAGAMENTO: "Pagamento em processamento.",
  AGUARDANDO_PAGAMENTO_DINHEIRO: "Dirija-se ao caixa para confirmar o pagamento em dinheiro.",
  PAGO: "Pagamento confirmado. Aguarde o envio para a cozinha.",
  ENVIADO_PARA_COZINHA: "Pedido enviado para a cozinha.",
  EM_PREPARO: "Seu pedido está em preparo.",
  PRONTO: "Seu pedido está pronto para retirada.",
  RETIRADO: "Pedido retirado. Obrigado!",
  CANCELADO: "Pedido cancelado.",
  EXPIRADO: "Pedido expirado.",
};

const STATUS_FINALIZADOS: readonly StatusPedido[] = ["RETIRADO", "CANCELADO", "EXPIRADO"];

export function getPedidoStatusLabel(status: StatusPedido): string {
  return ROTULOS[status];
}

export function getPedidoStatusDescription(status: StatusPedido): string {
  return DESCRICOES[status];
}

export function isPedidoFinalizado(status: StatusPedido): boolean {
  return STATUS_FINALIZADOS.includes(status);
}
