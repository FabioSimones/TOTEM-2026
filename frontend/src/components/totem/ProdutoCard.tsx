import type { ProdutoCardapioResponse } from "../../types/totem";
import { formatCurrencyBRL } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { ProductImage } from "./ProductImage";

interface ProdutoCardProps {
  produto: ProdutoCardapioResponse;
  /** TASK-120.1: abre o `ProductSelectionModal` — não adiciona ao carrinho diretamente. */
  onSelecionar?: (produto: ProdutoCardapioResponse) => void;
}

export function ProdutoCard({ produto, onSelecionar }: ProdutoCardProps) {
  return (
    <article className="produto-card">
      <ProductImage src={produto.imagemUrl} productName={produto.nome} size="card" />

      <div className="produto-card__corpo">
        {(produto.destaque || produto.recomendado) && (
          <div className="produto-card__selos">
            {produto.destaque && <span className="produto-card__selo produto-card__selo--destaque">Destaque</span>}
            {produto.recomendado && (
              <span className="produto-card__selo produto-card__selo--recomendado">Recomendado</span>
            )}
          </div>
        )}

        <h3 className="produto-card__nome">{produto.nome}</h3>
        {produto.descricao && <p className="produto-card__descricao">{produto.descricao}</p>}

        <div className="produto-card__rodape">
          <span className="produto-card__preco">{formatCurrencyBRL(produto.preco)}</span>
          <Button type="button" className="produto-card__botao" onClick={() => onSelecionar?.(produto)}>
            Adicionar
          </Button>
        </div>
      </div>
    </article>
  );
}
