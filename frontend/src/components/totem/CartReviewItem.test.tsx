import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CartItem } from "../../types/cart";
import { CartReviewItem } from "./CartReviewItem";

const itemComImagem: CartItem = {
  produtoId: 10,
  nome: "X-Burger Clássico",
  descricao: "Pão, hambúrguer, queijo",
  preco: 18.9,
  imagemUrl: "https://exemplo.com/burger.jpg",
  quantidade: 3,
  observacao: "Sem cebola",
};

const itemSemImagemNemObservacao: CartItem = {
  produtoId: 20,
  nome: "Refrigerante",
  descricao: null,
  preco: 6.5,
  imagemUrl: null,
  quantidade: 1,
};

describe("CartReviewItem", () => {
  it("mostra imagem, nome, quantidade, observação e subtotal", () => {
    render(<CartReviewItem item={itemComImagem} onEditar={vi.fn()} onRemover={vi.fn()} />);

    const imagem = screen.getByRole("img", { name: "Imagem de X-Burger Clássico" });
    expect(imagem).toHaveAttribute("src", "https://exemplo.com/burger.jpg");
    expect(screen.getByText("X-Burger Clássico")).toBeInTheDocument();
    expect(screen.getByText("3 unidades")).toBeInTheDocument();
    expect(screen.getByText("Obs.: Sem cebola")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?56,70/)).toBeInTheDocument();
  });

  it("sem imagem mostra um ícone de fallback (não emoji) e sem observação não renderiza a linha", () => {
    render(<CartReviewItem item={itemSemImagemNemObservacao} onEditar={vi.fn()} onRemover={vi.fn()} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const placeholder = document.querySelector(".product-image__fallback");
    expect(placeholder).toBeInTheDocument();
    expect(placeholder?.querySelector("svg")).toBeInTheDocument();
    expect(placeholder).toHaveTextContent("");

    expect(screen.getByText("1 unidade")).toBeInTheDocument();
    expect(document.querySelector(".cart-review-item__observacao")).not.toBeInTheDocument();
  });

  it("'Editar' chama onEditar com o item completo", async () => {
    const user = userEvent.setup();
    const onEditar = vi.fn();
    render(<CartReviewItem item={itemComImagem} onEditar={onEditar} onRemover={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Editar X-Burger Clássico" }));

    expect(onEditar).toHaveBeenCalledWith(itemComImagem);
  });

  it("'Remover' chama onRemover com o produtoId", async () => {
    const user = userEvent.setup();
    const onRemover = vi.fn();
    render(<CartReviewItem item={itemComImagem} onEditar={vi.fn()} onRemover={onRemover} />);

    await user.click(screen.getByRole("button", { name: "Remover X-Burger Clássico do carrinho" }));

    expect(onRemover).toHaveBeenCalledWith(10);
  });
});
