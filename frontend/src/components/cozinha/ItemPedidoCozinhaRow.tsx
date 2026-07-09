import type { ItemPedidoCozinhaResponse } from "../../types/cozinha";

interface ItemPedidoCozinhaRowProps {
  item: ItemPedidoCozinhaResponse;
}

export function ItemPedidoCozinhaRow({ item }: ItemPedidoCozinhaRowProps) {
  return (
    <li className="item-pedido-cozinha-row">
      <span>
        {item.quantidade}x {item.nomeProduto}
        {item.observacao && <em className="item-pedido-cozinha-row__observacao"> ({item.observacao})</em>}
      </span>
    </li>
  );
}
