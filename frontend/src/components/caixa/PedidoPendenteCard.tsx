import type { PedidoPendenteCaixaResponse } from "../../types/caixa";
import { getAcaoCaixaDescription, getAcaoCaixaLabel } from "../../utils/caixaStatus";
import { formatCurrencyBRL, formatDateTimeBRL } from "../../utils/formatters";
import { getPedidoStatusLabel } from "../../utils/pedidoStatus";
import { Button } from "../ui/Button";
import { ItemPedidoCaixaRow } from "./ItemPedidoCaixaRow";

interface PedidoPendenteCardProps {
  pedido: PedidoPendenteCaixaResponse;
}

const ROTULO_TIPO_CONSUMO: Record<PedidoPendenteCaixaResponse["tipoConsumo"], string> = {
  LOCAL: "Comer no local",
  VIAGEM: "Para viagem",
};

export function PedidoPendenteCard({ pedido }: PedidoPendenteCardProps) {
  return (
    <article className="pedido-pendente-card">
      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">{pedido.numeroPedido}</h3>
        <span className="pedido-pendente-card__status">{getPedidoStatusLabel(pedido.statusPedido)}</span>
      </div>

      <p className="pedido-pendente-card__orientacao">{getAcaoCaixaDescription(pedido.acaoSugerida)}</p>

      <dl className="pedido-pendente-card__detalhes">
        {pedido.clienteNome && (
          <div>
            <dt>Cliente</dt>
            <dd>{pedido.clienteNome}</dd>
          </div>
        )}
        <div>
          <dt>Tipo de consumo</dt>
          <dd>{ROTULO_TIPO_CONSUMO[pedido.tipoConsumo]}</dd>
        </div>
        <div>
          <dt>Criado em</dt>
          <dd>{formatDateTimeBRL(pedido.criadoEm)}</dd>
        </div>
        <div>
          <dt>Atualizado em</dt>
          <dd>{formatDateTimeBRL(pedido.atualizadoEm)}</dd>
        </div>
      </dl>

      <ul className="pedido-pendente-card__itens">
        {pedido.itens.map((item) => (
          <ItemPedidoCaixaRow key={item.produtoId} item={item} />
        ))}
      </ul>

      <div className="pedido-pendente-card__total">
        <span>Total</span>
        <strong>{formatCurrencyBRL(pedido.valorTotal)}</strong>
      </div>

      <Button
        type="button"
        className="pedido-pendente-card__acao"
        disabled
        title="Esta ação será implementada em uma próxima task"
      >
        {getAcaoCaixaLabel(pedido.acaoSugerida)}
      </Button>
    </article>
  );
}
