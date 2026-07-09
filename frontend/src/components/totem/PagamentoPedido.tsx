import { useState } from "react";
import type { FormaPagamento, PedidoTotemResponse } from "../../types/totem";
import { formatCurrencyBRL } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";

interface PagamentoPedidoProps {
  pedido: PedidoTotemResponse;
  onPay: (formaPagamento: FormaPagamento) => void;
  pagando: boolean;
  erro: string | null;
}

const OPCOES_FORMA_PAGAMENTO: { valor: FormaPagamento; rotulo: string }[] = [
  { valor: "PIX", rotulo: "Pix" },
  { valor: "CARTAO_CREDITO", rotulo: "Cartão de crédito" },
  { valor: "CARTAO_DEBITO", rotulo: "Cartão de débito" },
  { valor: "DINHEIRO", rotulo: "Dinheiro" },
];

export function PagamentoPedido({ pedido, onPay, pagando, erro }: PagamentoPedidoProps) {
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");

  return (
    <section className="pagamento-pedido">
      <h2 className="pagamento-pedido__titulo">Pagamento do pedido {pedido.numeroPedido}</h2>

      <div className="pagamento-pedido__valor">
        <span>Valor a pagar</span>
        <strong>{formatCurrencyBRL(pedido.valorTotal)}</strong>
      </div>

      <div className="pagamento-pedido__opcoes">
        <span className="pagamento-pedido__opcoes-rotulo">Forma de pagamento</span>
        <div className="pagamento-pedido__opcoes-grid">
          {OPCOES_FORMA_PAGAMENTO.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={
                "pagamento-pedido__opcao" +
                (formaPagamento === opcao.valor ? " pagamento-pedido__opcao--ativa" : "")
              }
              aria-pressed={formaPagamento === opcao.valor}
              onClick={() => setFormaPagamento(opcao.valor)}
              disabled={pagando}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      <ErrorMessage message={erro} />

      <Button
        type="button"
        className="pagamento-pedido__confirmar"
        loading={pagando}
        onClick={() => onPay(formaPagamento)}
      >
        Confirmar pagamento
      </Button>
    </section>
  );
}
