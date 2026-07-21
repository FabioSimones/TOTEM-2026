import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PedidoPendenteCaixaResponse } from "../../types/caixa";
import { PedidoPendenteCard } from "./PedidoPendenteCard";

const pedido: PedidoPendenteCaixaResponse = {
  pedidoId: 1,
  numeroPedido: "A1",
  statusPedido: "AGUARDANDO_PAGAMENTO_DINHEIRO",
  tipoConsumo: "LOCAL",
  clienteNome: "Cliente Teste",
  valorTotal: 25.9,
  criadoEm: "2026-01-01T12:00:00Z",
  atualizadoEm: "2026-01-01T12:00:00Z",
  acaoSugerida: "CONFIRMAR_PAGAMENTO",
  itens: [{ produtoId: 100, nomeProduto: "X-Burger", quantidade: 1, observacao: null, subtotal: 25.9 }],
};

describe("PedidoPendenteCard", () => {
  it("mostra número, status (texto, não enum), valor total e a ação sugerida", () => {
    render(
      <PedidoPendenteCard
        pedido={pedido}
        executando={false}
        erro={null}
        onConfirmarPagamento={vi.fn()}
        onEnviarCozinha={vi.fn()}
        onRetirarPedido={vi.fn()}
        onCancelarPedido={vi.fn()}
      />,
    );

    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("Aguardando pagamento no caixa")).toBeInTheDocument();
    expect(screen.getByText("R$ 25,90", { selector: ".pedido-pendente-card__total strong" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar dinheiro" })).toBeInTheDocument();
  });

  it("confirma via window.confirm antes de chamar onConfirmarPagamento", async () => {
    const onConfirmarPagamento = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    render(
      <PedidoPendenteCard
        pedido={pedido}
        executando={false}
        erro={null}
        onConfirmarPagamento={onConfirmarPagamento}
        onEnviarCozinha={vi.fn()}
        onRetirarPedido={vi.fn()}
        onCancelarPedido={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Confirmar dinheiro" }));

    expect(onConfirmarPagamento).toHaveBeenCalledWith(1, undefined);
  });

  it("desabilita a ação e mostra 'Aguarde...' enquanto executando", () => {
    render(
      <PedidoPendenteCard
        pedido={pedido}
        executando
        erro={null}
        onConfirmarPagamento={vi.fn()}
        onEnviarCozinha={vi.fn()}
        onRetirarPedido={vi.fn()}
        onCancelarPedido={vi.fn()}
      />,
    );

    const botaoAcao = screen.getByRole("button", { name: "Aguarde..." });
    expect(botaoAcao).toBeDisabled();
    expect(botaoAcao).toHaveAttribute("aria-busy", "true");
  });

  it("pedido PRONTO (MARCAR_RETIRADO) não mostra a opção de cancelamento", () => {
    render(
      <PedidoPendenteCard
        pedido={{ ...pedido, statusPedido: "PRONTO", acaoSugerida: "MARCAR_RETIRADO" }}
        executando={false}
        erro={null}
        onConfirmarPagamento={vi.fn()}
        onEnviarCozinha={vi.fn()}
        onRetirarPedido={vi.fn()}
        onCancelarPedido={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).not.toBeInTheDocument();
  });
});
