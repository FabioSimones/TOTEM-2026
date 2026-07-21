import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProdutoCardapioResponse } from "../../types/totem";
import { ProdutoCard } from "./ProdutoCard";

const produtoComImagem: ProdutoCardapioResponse = {
  id: 10,
  nome: "X-Burger Clássico",
  descricao: "Pão, hambúrguer, queijo",
  preco: 18.9,
  imagemUrl: "https://exemplo.com/burger.jpg",
  destaque: true,
  recomendado: false,
  ordemExibicao: 1,
};

const produtoSemImagem: ProdutoCardapioResponse = {
  ...produtoComImagem,
  id: 20,
  nome: "Refrigerante",
  imagemUrl: null,
  destaque: false,
};

describe("ProdutoCard", () => {
  it("usa ProductImage para mostrar a imagem real com alt correto", () => {
    render(<ProdutoCard produto={produtoComImagem} />);

    const imagem = screen.getByRole("img", { name: "Imagem de X-Burger Clássico" });
    expect(imagem).toHaveAttribute("src", "https://exemplo.com/burger.jpg");
  });

  it("produto sem imagem mostra o fallback compartilhado (não emoji)", () => {
    const { container } = render(<ProdutoCard produto={produtoSemImagem} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector(".product-image__fallback svg")).toBeInTheDocument();
    expect(container.textContent).not.toContain("🍔");
  });

  it("imagem quebrada (onError) troca para o fallback compartilhado", () => {
    const { container } = render(<ProdutoCard produto={produtoComImagem} />);

    fireEvent.error(screen.getByRole("img"));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector(".product-image__fallback")).toBeInTheDocument();
  });

  it("preserva nome, descrição, preço, selo de destaque e botão Adicionar", async () => {
    const user = userEvent.setup();
    const onSelecionar = vi.fn();
    render(<ProdutoCard produto={produtoComImagem} onSelecionar={onSelecionar} />);

    expect(screen.getByText("X-Burger Clássico")).toBeInTheDocument();
    expect(screen.getByText("Pão, hambúrguer, queijo")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?18,90/)).toBeInTheDocument();
    expect(screen.getByText("Destaque")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(onSelecionar).toHaveBeenCalledWith(produtoComImagem);
  });
});
