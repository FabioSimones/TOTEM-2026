import type { PedidoCozinhaResponse } from "../../types/cozinha";
import { getAcaoCozinhaDescription, getAcaoCozinhaLabel } from "../../utils/cozinhaStatus";
import { formatarTempoDecorrido } from "../../utils/dateTime";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { PedidoStatusBadge } from "../ui/PedidoStatusBadge";
import { RelogioIcon } from "../layout/OperationalIcons";
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
      {/* TASK-119: prioridade da Cozinha é número → tempo de espera → itens → observações → status →
          ação — o tempo fica no cabeçalho, ao lado do número, para leitura imediata sem precisar
          abrir os detalhes do card. Mostra só o tempo decorrido, sem classificar como
          "atrasado"/"recente" (nenhuma regra desse tipo existe no backend hoje). */}
      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">{pedido.numeroPedido}</h3>
        <span className="pedido-cozinha-card__tempo">
          <RelogioIcon />
          {formatarTempoDecorrido(pedido.criadoEm)}
        </span>
      </div>

      {descricaoAcao && <p className="pedido-pendente-card__orientacao">{descricaoAcao}</p>}

      <ul className="pedido-pendente-card__itens">
        {pedido.itens.map((item) => (
          <ItemPedidoCozinhaRow key={item.produtoId} item={item} />
        ))}
      </ul>

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
      </dl>

      <div className="pedido-pendente-card__rodape">
        <PedidoStatusBadge status={pedido.statusPedido} />
      </div>

      <ErrorMessage message={erro} />

      {rotuloAcao && (
        <Button type="button" className="pedido-pendente-card__acao" loading={executando} onClick={handleClicarAcao}>
          {rotuloAcao}
        </Button>
      )}
    </article>
  );
}
