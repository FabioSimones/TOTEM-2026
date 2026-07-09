import type { PedidoTotemResponse } from "../../types/totem";
import { formatCurrencyBRL } from "../../utils/formatters";
import { Button } from "../ui/Button";

interface PedidoCriadoResumoProps {
  pedido: PedidoTotemResponse;
  onNovoPedido: () => void;
}

const ROTULO_TIPO_CONSUMO: Record<PedidoTotemResponse["tipoConsumo"], string> = {
  LOCAL: "Comer no local",
  VIAGEM: "Para viagem",
};

export function PedidoCriadoResumo({ pedido, onNovoPedido }: PedidoCriadoResumoProps) {
  return (
    <section className="pedido-resumo">
      <h2 className="pedido-resumo__titulo">Pedido criado com sucesso!</h2>

      <dl className="pedido-resumo__detalhes">
        <div>
          <dt>Número do pedido</dt>
          <dd>{pedido.numeroPedido}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{pedido.statusPedido}</dd>
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

      <ul className="pedido-resumo__itens">
        {pedido.itens.map((item) => (
          <li key={item.produtoId} className="pedido-resumo__item">
            <span>
              {item.quantidade}x {item.nomeProduto}
              {item.observacao && <em className="pedido-resumo__item-observacao"> ({item.observacao})</em>}
            </span>
            <span>{formatCurrencyBRL(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="pedido-resumo__total">
        <span>Total confirmado</span>
        <strong>{formatCurrencyBRL(pedido.valorTotal)}</strong>
      </div>

      <Button
        type="button"
        className="pedido-resumo__pagamento"
        disabled
        title="O pagamento será implementado em uma próxima task"
      >
        Ir para pagamento
      </Button>

      <button type="button" className="pedido-resumo__novo-pedido" onClick={onNovoPedido}>
        Fazer novo pedido
      </button>
    </section>
  );
}
