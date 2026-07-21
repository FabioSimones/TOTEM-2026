import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PedidoCozinhaResponse } from "../../types/cozinha";
import { PedidoCozinhaCard } from "./PedidoCozinhaCard";

const pedido: PedidoCozinhaResponse = {
  pedidoId: 2,
  numeroPedido: "A2",
  statusPedido: "ENVIADO_PARA_COZINHA",
  tipoConsumo: "LOCAL",
  clienteNome: "Cliente Teste",
  criadoEm: new Date(Date.now() - 5 * 60000).toISOString().replace("Z", ""),
  atualizadoEm: new Date().toISOString().replace("Z", ""),
  itens: [{ produtoId: 100, nomeProduto: "X-Burger", quantidade: 2, observacao: "sem cebola" }],
};

describe("PedidoCozinhaCard", () => {
  it("mostra número, status (texto), tempo decorrido e a ação 'Iniciar preparo'", () => {
    render(<PedidoCozinhaCard pedido={pedido} executando={false} erro={null} onAvancarStatus={vi.fn()} />);

    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("Enviado para a cozinha")).toBeInTheDocument();
    expect(screen.getByText(/min/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar preparo" })).toBeInTheDocument();
  });

  it("mostra a quantidade e a observação do item", () => {
    render(<PedidoCozinhaCard pedido={pedido} executando={false} erro={null} onAvancarStatus={vi.fn()} />);

    expect(screen.getByText(/2x/)).toBeInTheDocument();
    expect(screen.getByText(/sem cebola/)).toBeInTheDocument();
  });

  it("confirma via window.confirm antes de avançar o status", async () => {
    const onAvancarStatus = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    render(<PedidoCozinhaCard pedido={pedido} executando={false} erro={null} onAvancarStatus={onAvancarStatus} />);
    await user.click(screen.getByRole("button", { name: "Iniciar preparo" }));

    expect(onAvancarStatus).toHaveBeenCalledWith(2);
  });

  it("pedido PRONTO não mostra nenhuma ação (fim do fluxo da Cozinha)", () => {
    render(
      <PedidoCozinhaCard
        pedido={{ ...pedido, statusPedido: "PRONTO" }}
        executando={false}
        erro={null}
        onAvancarStatus={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
