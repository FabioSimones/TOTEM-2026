import type { CartItem } from "../../types/cart";
import { formatCurrencyBRL } from "../../utils/formatters";

interface CartItemRowProps {
  item: CartItem;
  onIncrement: (produtoId: number) => void;
  onDecrement: (produtoId: number) => void;
  onRemove: (produtoId: number) => void;
  onChangeObservacao: (produtoId: number, observacao: string) => void;
}

export function CartItemRow({ item, onIncrement, onDecrement, onRemove, onChangeObservacao }: CartItemRowProps) {
  const subtotal = item.preco * item.quantidade;

  return (
    <li className="cart-item-row">
      <div className="cart-item-row__principal">
        <span className="cart-item-row__nome">{item.nome}</span>
        <span className="cart-item-row__subtotal">{formatCurrencyBRL(subtotal)}</span>
      </div>

      <div className="cart-item-row__controles">
        <button
          type="button"
          className="cart-item-row__qtd-botao"
          onClick={() => onDecrement(item.produtoId)}
          aria-label={`Diminuir quantidade de ${item.nome}`}
        >
          −
        </button>
        <span className="cart-item-row__qtd" aria-live="polite">
          {item.quantidade}
        </span>
        <button
          type="button"
          className="cart-item-row__qtd-botao"
          onClick={() => onIncrement(item.produtoId)}
          aria-label={`Aumentar quantidade de ${item.nome}`}
        >
          +
        </button>
        <button
          type="button"
          className="cart-item-row__remover"
          onClick={() => onRemove(item.produtoId)}
          aria-label={`Remover ${item.nome} do carrinho`}
        >
          Remover
        </button>
      </div>

      <label className="cart-item-row__observacao">
        Observação
        <input
          type="text"
          value={item.observacao ?? ""}
          onChange={(event) => onChangeObservacao(item.produtoId, event.target.value)}
          placeholder="Ex.: Sem cebola"
        />
      </label>
    </li>
  );
}
