import type { PedidoCozinhaResponse } from "../../types/cozinha";
import { getAcaoCozinhaDescription, getAcaoCozinhaLabel } from "../../utils/cozinhaStatus";
import { formatDateTimeBRL } from "../../utils/formatters";
import { getPedidoStatusLabel } from "../../utils/pedidoStatus";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { ItemPedidoCozinhaRow } from "./ItemPedidoCozinhaRow";

interface PedidoCozinhaCardProps {
  pedido: PedidoCozinhaResponse;
  executando: boolean;
  erro: string | null;
  onAvancarStatus: (pedidoId: number) => void;
}

const ROTULO_TIPO_CONSUMO: Record<PedidoCozinhaResponse["tipoConsumo"], string> = {
  LOCAL: "Comer no local",
  VIAGEM: "Para viagem",
};

export function PedidoCozinhaCard({ pedido, executando, erro, onAvancarStatus }: PedidoCozinhaCardProps) {
  const rotuloAcao = getAcaoCozinhaLabel(pedido.statusPedido);
  const descricaoAcao = getAcaoCozinhaDescription(pedido.statusPedido);

  function handleClicarAcao() {
    if (!rotuloAcao) {
      return;
    }
    if (!window.confirm(`${rotuloAcao} do pedido ${pedido.numeroPedido}?`)) {
      return;
    }
    onAvancarStatus(pedido.pedidoId);
  }

  return (
    <article className="pedido-pendente-card">
      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">{pedido.numeroPedido}</h3>
        <span className="pedido-pendente-card__status">{getPedidoStatusLabel(pedido.statusPedido)}</span>
      </div>

      {descricaoAcao && <p className="pedido-pendente-card__orientacao">{descricaoAcao}</p>}

      <dl className="pedido-pendente-card__detalhes">
        {pedido.clienteNome && (
          <div>
            <dt>Cliente</dt>
            <dd>{pedido.clienteNome}</dd>
          </div>
        )}
        <div>
          <dt>Tipo de consumo</dt>
          <dd>{ROTULO_TIPO_CONSUMO[pedido.tipoConsumo]}</dd>
        </div>
        <div>
          <dt>Criado em</dt>
          <dd>{formatDateTimeBRL(pedido.criadoEm)}</dd>
        </div>
      </dl>

      <ul className="pedido-pendente-card__itens">
        {pedido.itens.map((item) => (
          <ItemPedidoCozinhaRow key={item.produtoId} item={item} />
        ))}
      </ul>

      <ErrorMessage message={erro} />

      {rotuloAcao && (
        <Button type="button" className="pedido-pendente-card__acao" loading={executando} onClick={handleClicarAcao}>
          {rotuloAcao}
        </Button>
      )}
    </article>
  );
}
