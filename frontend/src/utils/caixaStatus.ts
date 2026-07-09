import type { AcaoCaixa } from "../types/caixa";

const ROTULOS_ACAO: Record<AcaoCaixa, string> = {
  CONFIRMAR_PAGAMENTO: "Confirmar dinheiro",
  ENVIAR_PARA_COZINHA: "Enviar para cozinha",
};

const DESCRICOES_ACAO: Record<AcaoCaixa, string> = {
  CONFIRMAR_PAGAMENTO: "Cliente escolheu pagar em dinheiro. Confirme o recebimento no caixa.",
  ENVIAR_PARA_COZINHA: "Pagamento confirmado. Envie o pedido para a cozinha.",
};

export function getAcaoCaixaLabel(acao: AcaoCaixa): string {
  return ROTULOS_ACAO[acao];
}

export function getAcaoCaixaDescription(acao: AcaoCaixa): string {
  return DESCRICOES_ACAO[acao];
}
