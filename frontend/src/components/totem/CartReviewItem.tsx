import type { CartItem } from "../../types/cart";
import { formatCurrencyBRL } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { ProductImage } from "./ProductImage";

interface CartReviewItemProps {
  item: CartItem;
  onEditar: (item: CartItem) => void;
  onRemover: (produtoId: number) => void;
}

/**
 * TASK-120.3: resumo visual de um item do carrinho — somente leitura (sem +/− nem campo de
 * observação sempre abertos); a edição pontual é feita sob demanda pelo `ProductSelectionModal`
 * (botão "Editar"). TASK-120.4: imagem/fallback migrados para `ProductImage`, a mesma fonte de
 * verdade usada por `ProdutoCard`/`ProductSelectionModal` — antes deste componente tinha seu
 * próprio SVG de fallback (`FaUtensils` direto), agora centralizado.
 */
export function CartReviewItem({ item, onEditar, onRemover }: CartReviewItemProps) {
  const subtotal = item.preco * item.quantidade;

  return (
    <li className="cart-review-item">
      <ProductImage src={item.imagemUrl} productName={item.nome} size="thumbnail" />

      <div className="cart-review-item__info">
        <span className="cart-review-item__nome">{item.nome}</span>
        <span className="cart-review-item__quantidade">
          {item.quantidade} {item.quantidade === 1 ? "unidade" : "unidades"}
        </span>
        {item.observacao && <span className="cart-review-item__observacao">Obs.: {item.observacao}</span>}
      </div>

      <div className="cart-review-item__valores">
        <strong className="cart-review-item__subtotal">{formatCurrencyBRL(subtotal)}</strong>
        <div className="cart-review-item__acoes">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onEditar(item)}
            aria-label={`Editar ${item.nome}`}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => onRemover(item.produtoId)}
            aria-label={`Remover ${item.nome} do carrinho`}
          >
            Remover
          </Button>
        </div>
      </div>
    </li>
  );
}
