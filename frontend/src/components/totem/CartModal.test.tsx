import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CartItem } from "../../types/cart";
import { CartModal } from "./CartModal";

const itemMock: CartItem = {
  produtoId: 10,
  nome: "X-Burger Clássico",
  descricao: "Pão, hambúrguer, queijo",
  preco: 18.9,
  imagemUrl: null,
  quantidade: 2,
};

function renderModal(overrides: Partial<React.ComponentProps<typeof CartModal>> = {}) {
  const onFechar = vi.fn();
  const onEditarItem = vi.fn();
  const onRemove = vi.fn();
  const onClear = vi.fn();
  const onCreateOrder = vi.fn();

  render(
    <CartModal
      aberto
      onFechar={onFechar}
      itens={[]}
      totalEstimado={0}
      onEditarItem={onEditarItem}
      onRemove={onRemove}
      onClear={onClear}
      onCreateOrder={onCreateOrder}
      criandoPedido={false}
      erroPedido={null}
      {...overrides}
    />,
  );

  return { onFechar, onEditarItem, onRemove, onClear, onCreateOrder };
}

describe("CartModal", () => {
  it("não renderiza nada quando fechado", () => {
    renderModal({ aberto: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("vazio mostra a mensagem e 'Continuar escolhendo'", () => {
    renderModal();

    expect(screen.getByRole("dialog", { name: "Seu pedido" })).toBeInTheDocument();
    expect(
      screen.getByText("Seu carrinho está vazio. Escolha produtos no cardápio para adicionar aqui."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar escolhendo" })).toBeInTheDocument();
  });

  it("'Continuar escolhendo' chama onFechar", async () => {
    const user = userEvent.setup();
    const { onFechar } = renderModal();

    await user.click(screen.getByRole("button", { name: "Continuar escolhendo" }));

    expect(onFechar).toHaveBeenCalled();
  });

  it("com itens mostra a lista resumida (sem +/− nem observação sempre abertos) e o total", () => {
    renderModal({ itens: [itemMock], totalEstimado: 37.8 });

    expect(screen.getByText("X-Burger Clássico")).toBeInTheDocument();
    expect(screen.getByText("2 unidades")).toBeInTheDocument();
    expect(document.querySelector(".cart-summary__total strong")).toHaveTextContent("R$ 37,80");

    expect(screen.queryByRole("button", { name: /Aumentar quantidade/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Diminuir quantidade/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Observação")).not.toBeInTheDocument();
  });

  it("'Editar' chama onEditarItem com o item; 'Remover' chama onRemove com o produtoId", async () => {
    const user = userEvent.setup();
    const { onEditarItem, onRemove } = renderModal({ itens: [itemMock], totalEstimado: 37.8 });

    await user.click(screen.getByRole("button", { name: "Editar X-Burger Clássico" }));
    expect(onEditarItem).toHaveBeenCalledWith(itemMock);

    await user.click(screen.getByRole("button", { name: "Remover X-Burger Clássico do carrinho" }));
    expect(onRemove).toHaveBeenCalledWith(10);
  });

  it("mostra o tipo de consumo como grupo acessível (fieldset/legend) e o nome do cliente", () => {
    renderModal({ itens: [itemMock], totalEstimado: 37.8 });

    expect(screen.getByRole("group", { name: "Tipo de consumo" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Comer no local/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Para viagem/ })).not.toBeChecked();
    expect(screen.getByLabelText("Seu nome")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar pedido" })).toBeInTheDocument();
  });

  it("fechar (X) chama onFechar sem apagar o carrinho — quem decide o estado é o chamador", async () => {
    const user = userEvent.setup();
    const { onFechar } = renderModal({ itens: [itemMock], totalEstimado: 37.8 });

    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onFechar).toHaveBeenCalled();
  });

  it("mostra a ação de reativação quando a sessão expira durante a criação do pedido", () => {
    const onIrParaAtivacao = vi.fn();
    renderModal({ semAutorizacao: true, onIrParaAtivacao });

    expect(screen.getByRole("button", { name: "Ir para ativação de dispositivo" })).toBeInTheDocument();
  });

  it("não mostra a ação de reativação quando não há problema de sessão", () => {
    renderModal({ semAutorizacao: false });

    expect(screen.queryByRole("button", { name: "Ir para ativação de dispositivo" })).not.toBeInTheDocument();
  });
});
