import type { PedidoTotemResponse } from "../../types/totem";
import { formatCurrencyBRL } from "../../utils/formatters";
import { getPedidoStatusDescription, getPedidoStatusLabel, isPedidoFinalizado } from "../../utils/pedidoStatus";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";

interface AcompanhamentoPedidoProps {
  pedido: PedidoTotemResponse;
  onAtualizar: () => void;
  atualizando: boolean;
  erro: string | null;
}

const ROTULO_TIPO_CONSUMO: Record<PedidoTotemResponse["tipoConsumo"], string> = {
  LOCAL: "Comer no local",
  VIAGEM: "Para viagem",
};

export function AcompanhamentoPedido({ pedido, onAtualizar, atualizando, erro }: AcompanhamentoPedidoProps) {
  const finalizado = isPedidoFinalizado(pedido.statusPedido);

  return (
    <section className="acompanhamento-pedido">
      <h2 className="acompanhamento-pedido__titulo">Acompanhe seu pedido</h2>

      <p className="acompanhamento-pedido__status">{getPedidoStatusLabel(pedido.statusPedido)}</p>
      <p className="acompanhamento-pedido__orientacao">{getPedidoStatusDescription(pedido.statusPedido)}</p>

      <dl className="acompanhamento-pedido__detalhes">
        <div>
          <dt>Número do pedido</dt>
          <dd>{pedido.numeroPedido}</dd>
        </div>
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
      </dl>

      <ul className="acompanhamento-pedido__itens">
        {pedido.itens.map((item) => (
          <li key={item.produtoId} className="acompanhamento-pedido__item">
            <span>
              {item.quantidade}x {item.nomeProduto}
              {item.observacao && <em className="acompanhamento-pedido__item-observacao"> ({item.observacao})</em>}
            </span>
            <span>{formatCurrencyBRL(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="acompanhamento-pedido__total">
        <span>Total</span>
        <strong>{formatCurrencyBRL(pedido.valorTotal)}</strong>
      </div>

      <ErrorMessage message={erro} />

      {!finalizado && (
        <Button type="button" className="acompanhamento-pedido__atualizar" loading={atualizando} onClick={onAtualizar}>
          Atualizar status
        </Button>
      )}
    </section>
  );
}
