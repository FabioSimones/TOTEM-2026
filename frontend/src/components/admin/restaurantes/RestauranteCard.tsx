import type { RestauranteAdminResponse } from "../../../types/restaurante";
import { formatarDataHora } from "../../../utils/dateTime";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";

interface RestauranteCardProps {
  restaurante: RestauranteAdminResponse;
  executando: boolean;
  erro: string | null;
  onEditar: (restaurante: RestauranteAdminResponse) => void;
  onAtivar: (id: number) => void;
  onDesativar: (id: number) => void;
}

function formatarCnpj(cnpj: string): string {
  if (cnpj.length !== 14) {
    return cnpj;
  }
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function RestauranteCard({ restaurante, executando, erro, onEditar, onAtivar, onDesativar }: RestauranteCardProps) {
  function handleClicarAcao() {
    if (restaurante.ativo) {
      if (!window.confirm(`Desativar o restaurante ${restaurante.nome}?`)) {
        return;
      }
      onDesativar(restaurante.id);
    } else {
      if (!window.confirm(`Ativar o restaurante ${restaurante.nome}?`)) {
        return;
      }
      onAtivar(restaurante.id);
    }
  }

  return (
    <article className="pedido-pendente-card">
      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">{restaurante.nome}</h3>
        <span
          className={
            "dispositivo-card__status" +
            (restaurante.ativo ? " dispositivo-card__status--ativo" : " dispositivo-card__status--revogado")
          }
        >
          {restaurante.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>

      <dl className="pedido-pendente-card__detalhes">
        <div>
          <dt>ID</dt>
          <dd>{restaurante.id}</dd>
        </div>
        <div>
          <dt>CNPJ</dt>
          <dd>{formatarCnpj(restaurante.cnpj)}</dd>
        </div>
        {restaurante.endereco && (
          <div>
            <dt>Endereço</dt>
            <dd>{restaurante.endereco}</dd>
          </div>
        )}
        <div>
          <dt>Criado em</dt>
          <dd>{formatarDataHora(restaurante.criadoEm)}</dd>
        </div>
        <div>
          <dt>Atualizado em</dt>
          <dd>{formatarDataHora(restaurante.atualizadoEm)}</dd>
        </div>
      </dl>

      <ErrorMessage message={erro} />

      <div className="dispositivo-form__acoes">
        <Button type="button" className="pedido-pendente-card__acao" onClick={() => onEditar(restaurante)} disabled={executando}>
          Editar
        </Button>

        <button
          type="button"
          className="restaurante-card__acao-secundaria"
          disabled={executando}
          onClick={handleClicarAcao}
        >
          {executando ? "Aguarde..." : restaurante.ativo ? "Desativar" : "Ativar"}
        </button>
      </div>
    </article>
  );
}
