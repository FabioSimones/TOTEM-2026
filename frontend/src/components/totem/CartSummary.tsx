import type { CartItem } from "../../types/cart";
import { formatCurrencyBRL } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { CartItemRow } from "./CartItemRow";

interface CartSummaryProps {
  itens: CartItem[];
  totalEstimado: number;
  onIncrement: (produtoId: number) => void;
  onDecrement: (produtoId: number) => void;
  onRemove: (produtoId: number) => void;
  onChangeObservacao: (produtoId: number, observacao: string) => void;
  onClear: () => void;
}

export function CartSummary({
  itens,
  totalEstimado,
  onIncrement,
  onDecrement,
  onRemove,
  onChangeObservacao,
  onClear,
}: CartSummaryProps) {
  return (
    <aside className="cart-summary">
      <h2 className="cart-summary__titulo">Seu pedido</h2>

      {itens.length === 0 ? (
        <p className="cart-summary__vazio">Seu carrinho está vazio. Adicione produtos do cardápio ao lado.</p>
      ) : (
        <>
          <ul className="cart-summary__lista">
            {itens.map((item) => (
              <CartItemRow
                key={item.produtoId}
                item={item}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onRemove={onRemove}
                onChangeObservacao={onChangeObservacao}
              />
            ))}
          </ul>

          <div className="cart-summary__total">
            <span>Total estimado</span>
            <strong>{formatCurrencyBRL(totalEstimado)}</strong>
          </div>

          <p className="cart-summary__aviso">
            O valor final será confirmado pelo restaurante ao criar o pedido.
          </p>

          <Button
            type="button"
            className="cart-summary__finalizar"
            disabled
            title="Criação de pedido será implementada em uma próxima task"
          >
            Finalizar pedido
          </Button>

          <button type="button" className="cart-summary__limpar" onClick={onClear}>
            Limpar carrinho
          </button>
        </>
      )}
    </aside>
  );
}
