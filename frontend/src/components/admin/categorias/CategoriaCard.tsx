import type { CategoriaAdminResponse } from "../../../types/categoria";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";

interface CategoriaCardProps {
  categoria: CategoriaAdminResponse;
  restaurantes: RestauranteAdminResponse[];
  executando: boolean;
  erro: string | null;
  onEditar: (categoria: CategoriaAdminResponse) => void;
  onInativar: (id: number) => void;
}

export function CategoriaCard({ categoria, restaurantes, executando, erro, onEditar, onInativar }: CategoriaCardProps) {
  const nomeRestaurante = restaurantes.find((r) => r.id === categoria.restauranteId)?.nome ?? `#${categoria.restauranteId}`;

  function handleInativar() {
    if (!window.confirm(`Inativar a categoria ${categoria.nome}?`)) {
      return;
    }
    onInativar(categoria.id);
  }

  return (
    <article className="pedido-pendente-card">
      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">{categoria.nome}</h3>
        <span
          className={
            "dispositivo-card__status" +
            (categoria.ativa ? " dispositivo-card__status--ativo" : " dispositivo-card__status--revogado")
          }
        >
          {categoria.ativa ? "Ativa" : "Inativa"}
        </span>
      </div>

      <dl className="pedido-pendente-card__detalhes">
        <div>
          <dt>Restaurante</dt>
          <dd>{nomeRestaurante}</dd>
        </div>
        {categoria.descricao && (
          <div>
            <dt>Descrição</dt>
            <dd>{categoria.descricao}</dd>
          </div>
        )}
        {categoria.ordemExibicao != null && (
          <div>
            <dt>Ordem de exibição</dt>
            <dd>{categoria.ordemExibicao}</dd>
          </div>
        )}
      </dl>

      <ErrorMessage message={erro} />

      <div className="dispositivo-form__acoes">
        <Button
          type="button"
          className="pedido-pendente-card__acao"
          onClick={() => onEditar(categoria)}
          disabled={executando}
        >
          Editar
        </Button>

        {categoria.ativa && (
          <Button type="button" variant="secondary" loading={executando} onClick={handleInativar}>
            Inativar
          </Button>
        )}
      </div>
    </article>
  );
}
