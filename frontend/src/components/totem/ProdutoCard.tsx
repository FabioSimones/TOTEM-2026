import type { ProdutoCardapioResponse } from "../../types/totem";
import { formatCurrencyBRL } from "../../utils/formatters";
import { Button } from "../ui/Button";

interface ProdutoCardProps {
  produto: ProdutoCardapioResponse;
}

export function ProdutoCard({ produto }: ProdutoCardProps) {
  return (
    <article className="produto-card">
      {produto.imagemUrl ? (
        <img className="produto-card__imagem" src={produto.imagemUrl} alt={produto.nome} loading="lazy" />
      ) : (
        <div className="produto-card__imagem produto-card__imagem--placeholder" aria-hidden="true">
          🍔
        </div>
      )}

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
          <Button
            type="button"
            className="produto-card__botao"
            disabled
            title="Carrinho será implementado em uma próxima task"
          >
            Adicionar
          </Button>
        </div>
      </div>
    </article>
  );
}
