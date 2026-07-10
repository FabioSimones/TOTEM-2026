import type { PedidoAdminResumoResponse } from "../../../types/pedidoAdmin";
import { formatCurrencyBRL, formatDateTimeBRL } from "../../../utils/formatters";
import { getPedidoStatusLabel } from "../../../utils/pedidoStatus";
import { Button } from "../../ui/Button";

interface PedidoAdminCardProps {
  pedido: PedidoAdminResumoResponse;
  mostrarRestaurante: boolean;
  onVerDetalhes: (pedidoId: number) => void;
}

const ROTULO_TIPO_CONSUMO: Record<PedidoAdminResumoResponse["tipoConsumo"], string> = {
  LOCAL: "Comer no local",
  VIAGEM: "Para viagem",
};

export function PedidoAdminCard({ pedido, mostrarRestaurante, onVerDetalhes }: PedidoAdminCardProps) {
  return (
    <article className="pedido-pendente-card">
      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">{pedido.numeroPedido}</h3>
        <span className="pedido-pendente-card__status">{getPedidoStatusLabel(pedido.statusPedido)}</span>
      </div>

      <dl className="pedido-pendente-card__detalhes">
        {mostrarRestaurante && (
          <div>
            <dt>Restaurante</dt>
            <dd>{pedido.restauranteNome}</dd>
          </div>
        )}
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

      <div className="pedido-pendente-card__total">
        <span>Total</span>
        <strong>{formatCurrencyBRL(pedido.valorTotal)}</strong>
      </div>

      <Button type="button" className="pedido-pendente-card__acao" onClick={() => onVerDetalhes(pedido.pedidoId)}>
        Ver detalhes
      </Button>
    </article>
  );
}
