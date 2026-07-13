import type { PedidoAdminDetalheResponse } from "../../../types/pedidoAdmin";
import { formatarDataHora } from "../../../utils/dateTime";
import { formatCurrencyBRL } from "../../../utils/formatters";
import { getPedidoStatusLabel } from "../../../utils/pedidoStatus";
import { Button } from "../../ui/Button";

interface PedidoAdminDetalheProps {
  pedido: PedidoAdminDetalheResponse;
  onFechar: () => void;
}

const ROTULO_FORMA_PAGAMENTO: Record<PedidoAdminDetalheResponse["pagamentos"][number]["formaPagamento"], string> = {
  PIX: "Pix",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  DINHEIRO: "Dinheiro",
};

const ROTULO_STATUS_PAGAMENTO: Record<PedidoAdminDetalheResponse["pagamentos"][number]["statusPagamento"], string> = {
  PENDENTE: "Pendente",
  AUTORIZADO: "Autorizado",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
  ESTORNADO: "Estornado",
};

export function PedidoAdminDetalhe({ pedido, onFechar }: PedidoAdminDetalheProps) {
  return (
    <article className="pedido-pendente-card pedido-admin-detalhe">
      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">Pedido {pedido.numeroPedido}</h3>
        <span className="pedido-pendente-card__status">{getPedidoStatusLabel(pedido.statusPedido)}</span>
      </div>

      <dl className="pedido-pendente-card__detalhes">
        <div>
          <dt>Restaurante</dt>
          <dd>{pedido.restauranteNome}</dd>
        </div>
        {pedido.clienteNome && (
          <div>
            <dt>Cliente</dt>
            <dd>{pedido.clienteNome}</dd>
          </div>
        )}
        <div>
          <dt>Criado em</dt>
          <dd>{formatarDataHora(pedido.criadoEm)}</dd>
        </div>
        <div>
          <dt>Atualizado em</dt>
          <dd>{formatarDataHora(pedido.atualizadoEm)}</dd>
        </div>
      </dl>

      <section className="pedido-admin-detalhe__secao">
        <h4>Itens</h4>
        <ul className="pedido-pendente-card__itens">
          {pedido.itens.map((item, indice) => (
            <li key={`${item.produtoId ?? "sem-produto"}-${indice}`} className="item-pedido-caixa-row">
              <span>
                {item.quantidade}x {item.nomeProduto}
                {item.observacao && <em className="item-pedido-caixa-row__observacao"> ({item.observacao})</em>}
              </span>
              <span>{formatCurrencyBRL(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="pedido-pendente-card__total">
          <span>Total</span>
          <strong>{formatCurrencyBRL(pedido.valorTotal)}</strong>
        </div>
      </section>

      <section className="pedido-admin-detalhe__secao">
        <h4>Pagamentos</h4>
        {pedido.pagamentos.length === 0 ? (
          <p className="totem-estado">Nenhum pagamento registrado.</p>
        ) : (
          <ul className="pedido-admin-detalhe__lista">
            {pedido.pagamentos.map((pagamento) => (
              <li key={pagamento.id} className="pedido-admin-detalhe__item">
                <span>
                  {ROTULO_FORMA_PAGAMENTO[pagamento.formaPagamento]} — {ROTULO_STATUS_PAGAMENTO[pagamento.statusPagamento]}
                </span>
                <span>{formatCurrencyBRL(pagamento.valor)}</span>
                <span className="pedido-admin-detalhe__item-data">{formatarDataHora(pagamento.criadoEm)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pedido-admin-detalhe__secao">
        <h4>Histórico de status</h4>
        <ul className="pedido-admin-detalhe__lista">
          {pedido.historico.map((entrada, indice) => (
            <li key={indice} className="pedido-admin-detalhe__item">
              <span>
                {entrada.statusAnterior ? `${getPedidoStatusLabel(entrada.statusAnterior)} → ` : ""}
                {getPedidoStatusLabel(entrada.statusNovo)}
              </span>
              <span className="pedido-admin-detalhe__item-data">{formatarDataHora(entrada.dataAlteracao)}</span>
              {(entrada.alteradoPorUsuarioNome || entrada.alteradoPorDispositivoNome) && (
                <span className="pedido-admin-detalhe__item-data">
                  {entrada.alteradoPorUsuarioNome ?? entrada.alteradoPorDispositivoNome}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Button type="button" onClick={onFechar}>
        Fechar detalhes
      </Button>
    </article>
  );
}
