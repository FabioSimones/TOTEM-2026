import type { PagamentoTotemResponse } from "../../types/totem";
import { formatCurrencyBRL } from "../../utils/formatters";

interface PagamentoResultadoProps {
  resultado: PagamentoTotemResponse;
  onNovoPedido: () => void;
}

const ROTULO_FORMA_PAGAMENTO: Record<PagamentoTotemResponse["formaPagamento"], string> = {
  PIX: "Pix",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  DINHEIRO: "Dinheiro",
};

export function PagamentoResultado({ resultado, onNovoPedido }: PagamentoResultadoProps) {
  const aprovado = resultado.statusPagamento === "AUTORIZADO";

  return (
    <section
      className={
        "pagamento-resultado" +
        (aprovado ? " pagamento-resultado--aprovado" : " pagamento-resultado--pendente")
      }
    >
      <h2 className="pagamento-resultado__titulo">{aprovado ? "Pagamento aprovado!" : "Pagamento pendente"}</h2>

      <p className="pagamento-resultado__orientacao">
        {aprovado
          ? "Pagamento aprovado. Aguarde o envio para a cozinha."
          : "Pagamento em dinheiro aguardando confirmação no caixa. Dirija-se ao caixa para concluir o pagamento."}
      </p>

      <dl className="pagamento-resultado__detalhes">
        <div>
          <dt>Número do pedido</dt>
          <dd>{resultado.numeroPedido}</dd>
        </div>
        <div>
          <dt>Forma de pagamento</dt>
          <dd>{ROTULO_FORMA_PAGAMENTO[resultado.formaPagamento]}</dd>
        </div>
        <div>
          <dt>Status do pagamento</dt>
          <dd>{resultado.statusPagamento}</dd>
        </div>
        <div>
          <dt>Status do pedido</dt>
          <dd>{resultado.statusPedido}</dd>
        </div>
        {resultado.codigoAutorizacao && (
          <div>
            <dt>Código de autorização</dt>
            <dd>{resultado.codigoAutorizacao}</dd>
          </div>
        )}
        {resultado.referenciaExterna && (
          <div>
            <dt>Referência</dt>
            <dd>{resultado.referenciaExterna}</dd>
          </div>
        )}
      </dl>

      <div className="pagamento-resultado__valor">
        <span>Valor</span>
        <strong>{formatCurrencyBRL(resultado.valor)}</strong>
      </div>

      {resultado.mensagem && <p className="pagamento-resultado__mensagem">{resultado.mensagem}</p>}

      <button type="button" className="pagamento-resultado__novo-pedido" onClick={onNovoPedido}>
        Fazer novo pedido
      </button>
    </section>
  );
}
