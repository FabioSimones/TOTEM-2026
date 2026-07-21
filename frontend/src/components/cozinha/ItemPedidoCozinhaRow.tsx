import type { ItemPedidoCozinhaResponse } from "../../types/cozinha";

interface ItemPedidoCozinhaRowProps {
  item: ItemPedidoCozinhaResponse;
}

export function ItemPedidoCozinhaRow({ item }: ItemPedidoCozinhaRowProps) {
  return (
    <li className="item-pedido-cozinha-row">
      <span>
        <strong className="item-pedido-cozinha-row__quantidade">{item.quantidade}x</strong> {item.nomeProduto}
        {item.observacao && <em className="item-pedido-cozinha-row__observacao"> ({item.observacao})</em>}
      </span>
    </li>
  );
}
