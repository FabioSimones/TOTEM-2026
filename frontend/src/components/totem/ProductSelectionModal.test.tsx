import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProdutoCardapioResponse } from "../../types/totem";
import { ProductSelectionModal } from "./ProductSelectionModal";

const produtoMock: ProdutoCardapioResponse = {
  id: 10,
  nome: "X-Burger Clássico",
  descricao: "Pão, hambúrguer, queijo",
  preco: 18.9,
  imagemUrl: null,
  destaque: false,
  recomendado: false,
  ordemExibicao: 1,
};

describe("ProductSelectionModal", () => {
  it("não renderiza nada quando produto é null", () => {
    render(<ProductSelectionModal produto={null} onFechar={vi.fn()} onConfirmar={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mostra nome, descrição e preço unitário do produto", () => {
    render(<ProductSelectionModal produto={produtoMock} onFechar={vi.fn()} onConfirmar={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "X-Burger Clássico" })).toBeInTheDocument();
    expect(screen.getByText("Pão, hambúrguer, queijo")).toBeInTheDocument();
    // Com quantidade 1, preço unitário e subtotal coincidem — busca só no bloco de preço unitário.
    expect(document.querySelector(".product-selection-modal__preco-unitario")).toHaveTextContent("R$ 18,90");
  });

  it("quantidade começa em 1 e o subtotal reflete o preço unitário", () => {
    render(<ProductSelectionModal produto={produtoMock} onFechar={vi.fn()} onConfirmar={vi.fn()} />);

    expect(screen.getByText("1", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Diminuir quantidade" })).toBeDisabled();
  });

  it("aumenta a quantidade e recalcula o subtotal", async () => {
    const user = userEvent.setup();
    render(<ProductSelectionModal produto={produtoMock} onFechar={vi.fn()} onConfirmar={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));

    expect(screen.getByText("3", { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?56,70/)).toBeInTheDocument();
  });

  it("diminui a quantidade sem cair abaixo de 1", async () => {
    const user = userEvent.setup();
    render(<ProductSelectionModal produto={produtoMock} onFechar={vi.fn()} onConfirmar={vi.fn()} />);

    const diminuir = screen.getByRole("button", { name: "Diminuir quantidade" });
    await user.click(diminuir);
    await user.click(diminuir);

    expect(screen.getByText("1", { exact: true })).toBeInTheDocument();
    expect(diminuir).toBeDisabled();
  });

  it("preserva a observação digitada e envia no confirmar", async () => {
    const user = userEvent.setup();
    const onConfirmar = vi.fn();
    render(<ProductSelectionModal produto={produtoMock} onFechar={vi.fn()} onConfirmar={onConfirmar} />);

    await user.type(screen.getByLabelText("Observação do item"), "sem cebola");
    await user.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));

    expect(onConfirmar).toHaveBeenCalledWith(produtoMock, 1, "sem cebola");
  });

  it("confirmar chama onConfirmar com produto/quantidade/observação e fecha o modal", async () => {
    const user = userEvent.setup();
    const onConfirmar = vi.fn();
    const onFechar = vi.fn();
    render(<ProductSelectionModal produto={produtoMock} onFechar={onFechar} onConfirmar={onConfirmar} />);

    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    await user.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));

    expect(onConfirmar).toHaveBeenCalledWith(produtoMock, 2, "");
    expect(onFechar).toHaveBeenCalled();
  });

  it("cancelar não chama onConfirmar", async () => {
    const user = userEvent.setup();
    const onConfirmar = vi.fn();
    const onFechar = vi.fn();
    render(<ProductSelectionModal produto={produtoMock} onFechar={onFechar} onConfirmar={onConfirmar} />);

    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onConfirmar).not.toHaveBeenCalled();
    expect(onFechar).toHaveBeenCalled();
  });

  it("reseta quantidade/observação ao trocar de produto — responsabilidade de quem chama, via key", async () => {
    // Mesma técnica usada em produção (TotemHomePage: `key={produtoSelecionado?.id}`) — o reset é
    // garantido por remontar o componente, não por um efeito interno (ver comentário no componente).
    const user = userEvent.setup();
    const { rerender } = render(
      <ProductSelectionModal key={produtoMock.id} produto={produtoMock} onFechar={vi.fn()} onConfirmar={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    await user.type(screen.getByLabelText("Observação do item"), "sem cebola");
    expect(screen.getByText("2", { exact: true })).toBeInTheDocument();

    const outroProduto: ProdutoCardapioResponse = { ...produtoMock, id: 20, nome: "Refrigerante" };
    rerender(<ProductSelectionModal key={outroProduto.id} produto={outroProduto} onFechar={vi.fn()} onConfirmar={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Refrigerante" })).toBeInTheDocument();
    expect(screen.getByText("1", { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText("Observação do item")).toHaveValue("");
  });

  describe("modo editar (TASK-120.3)", () => {
    it("abre com quantidade e observação atuais do item, e botão 'Salvar alterações'", () => {
      render(
        <ProductSelectionModal
          produto={produtoMock}
          modo="editar"
          quantidadeInicial={3}
          observacaoInicial="Sem cebola"
          onFechar={vi.fn()}
          onConfirmar={vi.fn()}
        />,
      );

      expect(screen.getByText("3", { exact: true })).toBeInTheDocument();
      expect(screen.getByLabelText("Observação do item")).toHaveValue("Sem cebola");
      expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Adicionar ao carrinho" })).not.toBeInTheDocument();
    });

    it("salvar alterações chama onConfirmar com os novos valores e fecha", async () => {
      const user = userEvent.setup();
      const onConfirmar = vi.fn();
      const onFechar = vi.fn();
      render(
        <ProductSelectionModal
          produto={produtoMock}
          modo="editar"
          quantidadeInicial={2}
          observacaoInicial="Sem cebola"
          onFechar={onFechar}
          onConfirmar={onConfirmar}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
      await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

      expect(onConfirmar).toHaveBeenCalledWith(produtoMock, 3, "Sem cebola");
      expect(onFechar).toHaveBeenCalled();
    });

    it("cancelar a edição não chama onConfirmar", async () => {
      const user = userEvent.setup();
      const onConfirmar = vi.fn();
      const onFechar = vi.fn();
      render(
        <ProductSelectionModal
          produto={produtoMock}
          modo="editar"
          quantidadeInicial={2}
          observacaoInicial="Sem cebola"
          onFechar={onFechar}
          onConfirmar={onConfirmar}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(onConfirmar).not.toHaveBeenCalled();
      expect(onFechar).toHaveBeenCalled();
    });

    it("quantidade mínima continua sendo 1 mesmo em modo editar", async () => {
      const user = userEvent.setup();
      render(
        <ProductSelectionModal
          produto={produtoMock}
          modo="editar"
          quantidadeInicial={1}
          onFechar={vi.fn()}
          onConfirmar={vi.fn()}
        />,
      );

      const diminuir = screen.getByRole("button", { name: "Diminuir quantidade" });
      expect(diminuir).toBeDisabled();
      await user.click(diminuir);
      expect(screen.getByText("1", { exact: true })).toBeInTheDocument();
    });
  });
});
