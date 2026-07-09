import type { StatusPedido } from "../types/totem";

const PROXIMO_STATUS: Partial<Record<StatusPedido, StatusPedido>> = {
  ENVIADO_PARA_COZINHA: "EM_PREPARO",
  EM_PREPARO: "PRONTO",
};

const ROTULOS_ACAO: Partial<Record<StatusPedido, string>> = {
  ENVIADO_PARA_COZINHA: "Iniciar preparo",
  EM_PREPARO: "Marcar como pronto",
};

const DESCRICOES_ACAO: Partial<Record<StatusPedido, string>> = {
  ENVIADO_PARA_COZINHA: "Pedido aguardando início do preparo.",
  EM_PREPARO: "Pedido em preparo. Marque como pronto quando finalizar.",
};

/** Próximo status ao avançar o pedido na cozinha, ou `null` se não houver ação aqui. */
export function getProximoStatusCozinha(status: StatusPedido): StatusPedido | null {
  return PROXIMO_STATUS[status] ?? null;
}

export function getAcaoCozinhaLabel(status: StatusPedido): string | null {
  return ROTULOS_ACAO[status] ?? null;
}

export function getAcaoCozinhaDescription(status: StatusPedido): string | null {
  return DESCRICOES_ACAO[status] ?? null;
}
