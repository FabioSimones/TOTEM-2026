import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductImage } from "./ProductImage";

describe("ProductImage", () => {
  it("renderiza a imagem real com o alt esperado quando há src", () => {
    render(<ProductImage src="https://exemplo.com/burger.jpg" productName="X-Burger" />);

    const imagem = screen.getByRole("img", { name: "Imagem de X-Burger" });
    expect(imagem).toHaveAttribute("src", "https://exemplo.com/burger.jpg");
  });

  it("usa loading='lazy' por padrão e respeita loading='eager'", () => {
    const { rerender } = render(<ProductImage src="https://exemplo.com/burger.jpg" productName="X-Burger" />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");

    rerender(<ProductImage src="https://exemplo.com/burger.jpg" productName="X-Burger" loading="eager" />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "eager");
  });

  it("renderiza o fallback quando src é nulo", () => {
    const { container } = render(<ProductImage src={null} productName="X-Burger" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const fallback = container.querySelector(".product-image__fallback");
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveAttribute("aria-hidden", "true");
    expect(fallback?.querySelector("svg")).toBeInTheDocument();
  });

  it("renderiza o fallback quando src é uma string vazia", () => {
    const { container } = render(<ProductImage src="" productName="X-Burger" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector(".product-image__fallback")).toBeInTheDocument();
  });

  it("troca para o fallback quando a imagem falha ao carregar (onError), sem loop", () => {
    const { container } = render(<ProductImage src="https://exemplo.com/quebrada.jpg" productName="X-Burger" />);

    const imagem = screen.getByRole("img");
    fireEvent.error(imagem);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const fallback = container.querySelector(".product-image__fallback");
    expect(fallback).toBeInTheDocument();
    // Sem <img> no DOM, não há novo onError possível — não há como entrar em loop.
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("ao mudar de src após uma falha anterior, tenta renderizar a nova imagem (reseta o estado de erro)", () => {
    const { rerender, container } = render(
      <ProductImage src="https://exemplo.com/quebrada.jpg" productName="X-Burger" />,
    );

    fireEvent.error(screen.getByRole("img"));
    expect(container.querySelector(".product-image__fallback")).toBeInTheDocument();

    rerender(<ProductImage src="https://exemplo.com/nova.jpg" productName="X-Burger" />);

    expect(screen.getByRole("img", { name: "Imagem de X-Burger" })).toHaveAttribute(
      "src",
      "https://exemplo.com/nova.jpg",
    );
  });

  it("aplica a classe da variante de tamanho (card, modal, thumbnail)", () => {
    const { container: card } = render(<ProductImage src="x.jpg" productName="X" size="card" />);
    expect(card.querySelector(".product-image")).toHaveClass("product-image--card");

    const { container: modal } = render(<ProductImage src="x.jpg" productName="X" size="modal" />);
    expect(modal.querySelector(".product-image")).toHaveClass("product-image--modal");

    const { container: thumb } = render(<ProductImage src="x.jpg" productName="X" size="thumbnail" />);
    expect(thumb.querySelector(".product-image")).toHaveClass("product-image--thumbnail");
  });

  it("o fallback nunca usa emoji", () => {
    const { container } = render(<ProductImage src={null} productName="X-Burger" />);

    expect(container.textContent).not.toContain("🍔");
  });
});
