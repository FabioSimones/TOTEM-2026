import { useState } from "react";
import type { PedidoPendenteCaixaResponse } from "../../types/caixa";
import { getAcaoCaixaDescription, getAcaoCaixaLabel } from "../../utils/caixaStatus";
import { formatarDataHora } from "../../utils/dateTime";
import { formatCurrencyBRL } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { PedidoStatusBadge } from "../ui/PedidoStatusBadge";
import { ItemPedidoCaixaRow } from "./ItemPedidoCaixaRow";

interface PedidoPendenteCardProps {
  pedido: PedidoPendenteCaixaResponse;
  executando: boolean;
  erro: string | null;
  onConfirmarPagamento: (pedidoId: number, observacao?: string) => void;
  onEnviarCozinha: (pedidoId: number) => void;
  onRetirarPedido: (pedidoId: number) => void;
  onCancelarPedido: (pedidoId: number, motivo: string) => void;
}

/** PRONTO (acaoSugerida=MARCAR_RETIRADO) não está entre os status canceláveis pelo Caixa. */
const ACOES_SEM_CANCELAMENTO = new Set<PedidoPendenteCaixaResponse["acaoSugerida"]>(["MARCAR_RETIRADO"]);

const ROTULO_TIPO_CONSUMO: Record<PedidoPendenteCaixaResponse["tipoConsumo"], string> = {
  LOCAL: "Comer no local",
  VIAGEM: "Para viagem",
};

export function PedidoPendenteCard({
  pedido,
  executando,
  erro,
  onConfirmarPagamento,
  onEnviarCozinha,
  onRetirarPedido,
  onCancelarPedido,
}: PedidoPendenteCardProps) {
  const [observacao, setObservacao] = useState("");
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [erroValidacaoCancelamento, setErroValidacaoCancelamento] = useState<string | null>(null);

  const podeCancelar = !ACOES_SEM_CANCELAMENTO.has(pedido.acaoSugerida);

  function handleClicarAcao() {
    switch (pedido.acaoSugerida) {
      case "CONFIRMAR_PAGAMENTO":
        if (!window.confirm(`Confirmar pagamento em dinheiro do pedido ${pedido.numeroPedido}?`)) {
          return;
        }
        onConfirmarPagamento(pedido.pedidoId, observacao.trim() || undefined);
        return;
      case "ENVIAR_PARA_COZINHA":
        if (!window.confirm(`Enviar o pedido ${pedido.numeroPedido} para a cozinha?`)) {
          return;
        }
        onEnviarCozinha(pedido.pedidoId);
        return;
      case "MARCAR_RETIRADO":
        if (!window.confirm(`Marcar o pedido ${pedido.numeroPedido} como retirado?`)) {
          return;
        }
        onRetirarPedido(pedido.pedidoId);
        return;
    }
  }

  function handleClicarCancelar() {
    const motivo = motivoCancelamento.trim();
    if (motivo.length < 3) {
      setErroValidacaoCancelamento("Informe o motivo do cancelamento (mínimo 3 caracteres).");
      return;
    }
    if (!window.confirm(`Cancelar o pedido ${pedido.numeroPedido}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setErroValidacaoCancelamento(null);
    onCancelarPedido(pedido.pedidoId, motivo);
  }

  return (
    <article className="pedido-pendente-card">
      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">{pedido.numeroPedido}</h3>
        <PedidoStatusBadge status={pedido.statusPedido} />
      </div>

      <p className="pedido-pendente-card__orientacao">{getAcaoCaixaDescription(pedido.acaoSugerida)}</p>

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
          <dd>{formatarDataHora(pedido.criadoEm)}</dd>
        </div>
        <div>
          <dt>Atualizado em</dt>
          <dd>{formatarDataHora(pedido.atualizadoEm)}</dd>
        </div>
      </dl>

      <ul className="pedido-pendente-card__itens">
        {pedido.itens.map((item) => (
          <ItemPedidoCaixaRow key={item.produtoId} item={item} />
        ))}
      </ul>

      <div className="pedido-pendente-card__total">
        <span>Total</span>
        <strong>{formatCurrencyBRL(pedido.valorTotal)}</strong>
      </div>

      {pedido.acaoSugerida === "CONFIRMAR_PAGAMENTO" && (
        <label className="pedido-pendente-card__observacao">
          Observação (opcional)
          <input
            type="text"
            value={observacao}
            onChange={(event) => setObservacao(event.target.value)}
            placeholder="Ex.: Cliente pagou com nota de R$ 100"
            disabled={executando}
          />
        </label>
      )}

      <ErrorMessage message={erro} />

      <Button type="button" className="pedido-pendente-card__acao" loading={executando} onClick={handleClicarAcao}>
        {getAcaoCaixaLabel(pedido.acaoSugerida)}
      </Button>

      {podeCancelar && (
        <div className="pedido-pendente-card__cancelamento">
          <label className="pedido-pendente-card__observacao">
            Motivo do cancelamento
            <input
              type="text"
              value={motivoCancelamento}
              onChange={(event) => setMotivoCancelamento(event.target.value)}
              placeholder="Ex.: Cliente desistiu do pedido"
              disabled={executando}
            />
          </label>

          <ErrorMessage message={erroValidacaoCancelamento} />

          <Button type="button" variant="danger" fullWidth disabled={executando} onClick={handleClicarCancelar}>
            Cancelar pedido
          </Button>
        </div>
      )}
    </article>
  );
}
