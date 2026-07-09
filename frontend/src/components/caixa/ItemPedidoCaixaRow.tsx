import type { ItemPedidoPendenteCaixaResponse } from "../../types/caixa";
import { formatCurrencyBRL } from "../../utils/formatters";

interface ItemPedidoCaixaRowProps {
  item: ItemPedidoPendenteCaixaResponse;
}

export function ItemPedidoCaixaRow({ item }: ItemPedidoCaixaRowProps) {
  return (
    <li className="item-pedido-caixa-row">
      <span>
        {item.quantidade}x {item.nomeProduto}
        {item.observacao && <em className="item-pedido-caixa-row__observacao"> ({item.observacao})</em>}
      </span>
      <span>{formatCurrencyBRL(item.subtotal)}</span>
    </li>
  );
}
