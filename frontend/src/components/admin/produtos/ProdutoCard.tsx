import { useEffect, useState } from "react";
import type { CategoriaAdminResponse } from "../../../types/categoria";
import type { ProdutoAdminResponse } from "../../../types/produto";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import { formatCurrencyBRL } from "../../../utils/formatters";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";

interface ProdutoCardProps {
  produto: ProdutoAdminResponse;
  restaurantes: RestauranteAdminResponse[];
  categorias: CategoriaAdminResponse[];
  executando: boolean;
  erro: string | null;
  onEditar: (produto: ProdutoAdminResponse) => void;
  onAlternarDisponibilidade: (id: number, disponivel: boolean) => void;
  onAlternarDestaque: (id: number, destaque: boolean) => void;
}

export function ProdutoCard({
  produto,
  restaurantes,
  categorias,
  executando,
  erro,
  onEditar,
  onAlternarDisponibilidade,
  onAlternarDestaque,
}: ProdutoCardProps) {
  const nomeRestaurante = restaurantes.find((r) => r.id === produto.restauranteId)?.nome ?? `#${produto.restauranteId}`;
  const nomeCategoria = categorias.find((c) => c.id === produto.categoriaId)?.nome ?? `#${produto.categoriaId}`;

  const [imagemFalhouAoCarregar, setImagemFalhouAoCarregar] = useState(false);

  useEffect(() => {
    setImagemFalhouAoCarregar(false);
  }, [produto.imagemUrl]);

  return (
    <article className="pedido-pendente-card">
      {produto.imagemUrl && !imagemFalhouAoCarregar ? (
        <img
          className="produto-card__imagem"
          src={produto.imagemUrl}
          alt={produto.nome}
          loading="lazy"
          onError={() => setImagemFalhouAoCarregar(true)}
        />
      ) : (
        <div className="produto-card__imagem produto-card__imagem--placeholder" aria-hidden="true">
          🍔
        </div>
      )}

      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">{produto.nome}</h3>
        <span
          className={
            "dispositivo-card__status" +
            (produto.disponivel ? " dispositivo-card__status--ativo" : " dispositivo-card__status--revogado")
          }
        >
          {produto.disponivel ? "Disponível" : "Indisponível"}
        </span>
      </div>

      {(produto.destaque || produto.recomendado) && (
        <div className="produto-card__selos">
          {produto.destaque && <span className="produto-card__selo produto-card__selo--destaque">Destaque</span>}
          {produto.recomendado && (
            <span className="produto-card__selo produto-card__selo--recomendado">Recomendado</span>
          )}
        </div>
      )}

      <dl className="pedido-pendente-card__detalhes">
        <div>
          <dt>Restaurante</dt>
          <dd>{nomeRestaurante}</dd>
        </div>
        <div>
          <dt>Categoria</dt>
          <dd>{nomeCategoria}</dd>
        </div>
        <div>
          <dt>Preço</dt>
          <dd>{formatCurrencyBRL(produto.preco)}</dd>
        </div>
        {produto.ordemExibicao != null && (
          <div>
            <dt>Ordem de exibição</dt>
            <dd>{produto.ordemExibicao}</dd>
          </div>
        )}
      </dl>

      {produto.descricao && <p className="produto-card__descricao">{produto.descricao}</p>}

      <ErrorMessage message={erro} />

      <div className="dispositivo-form__acoes">
        <Button
          type="button"
          className="pedido-pendente-card__acao"
          onClick={() => onEditar(produto)}
          disabled={executando}
        >
          Editar
        </Button>

        <Button
          type="button"
          variant="secondary"
          loading={executando}
          onClick={() => onAlternarDisponibilidade(produto.id, !produto.disponivel)}
        >
          {produto.disponivel ? "Marcar indisponível" : "Marcar disponível"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          loading={executando}
          onClick={() => onAlternarDestaque(produto.id, !produto.destaque)}
        >
          {produto.destaque ? "Remover destaque" : "Marcar destaque"}
        </Button>
      </div>
    </article>
  );
}
