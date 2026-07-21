import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProdutoParaCarrinho } from "../types/cart";
import { useCart } from "./useCart";

const burger: ProdutoParaCarrinho = {
  id: 10,
  nome: "X-Burger",
  descricao: "Pão, hambúrguer, queijo",
  preco: 18.9,
  imagemUrl: null,
};

const refrigerante: ProdutoParaCarrinho = {
  id: 20,
  nome: "Refrigerante",
  descricao: null,
  preco: 6.5,
  imagemUrl: null,
};

describe("useCart", () => {
  it("addItem adiciona um item novo com quantidade 1 por padrão", () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(burger));

    expect(result.current.itens).toEqual([
      { produtoId: 10, nome: "X-Burger", descricao: "Pão, hambúrguer, queijo", preco: 18.9, imagemUrl: null, quantidade: 1 },
    ]);
    expect(result.current.totalItens).toBe(1);
    expect(result.current.totalEstimado).toBeCloseTo(18.9);
  });

  it("addItem do mesmo produto incrementa a quantidade existente em vez de duplicar", () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(burger, 1));
    act(() => result.current.addItem(burger, 2));

    expect(result.current.itens).toHaveLength(1);
    expect(result.current.itens[0].quantidade).toBe(3);
  });

  it("addItem preserva a ordem de inserção com produtos diferentes", () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(burger));
    act(() => result.current.addItem(refrigerante));

    expect(result.current.itens.map((item) => item.produtoId)).toEqual([10, 20]);
  });

  it("atualizarItem define a quantidade e a observação sem duplicar o item nem mudar sua posição", () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(burger));
    act(() => result.current.addItem(refrigerante));
    act(() => result.current.atualizarItem(10, 5, "Sem cebola"));

    expect(result.current.itens).toHaveLength(2);
    expect(result.current.itens.map((item) => item.produtoId)).toEqual([10, 20]);
    expect(result.current.itens[0].quantidade).toBe(5);
    expect(result.current.itens[0].observacao).toBe("Sem cebola");
    expect(result.current.itens[1].observacao).toBeUndefined();
  });

  it("atualizarItem com quantidade menor que 1 usa o piso de 1 (não remove o item)", () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(burger));
    act(() => result.current.atualizarItem(10, 0, ""));

    expect(result.current.itens).toHaveLength(1);
    expect(result.current.itens[0].quantidade).toBe(1);
  });

  it("atualizarItem com observação vazia limpa a observação existente", () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(burger, 1, "Sem cebola"));
    act(() => result.current.atualizarItem(10, 1, ""));

    expect(result.current.itens[0].observacao).toBeUndefined();
  });

  it("total estimado reflete quantidade/preço de todos os itens após atualizarItem", () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(burger));
    act(() => result.current.addItem(refrigerante));
    act(() => result.current.atualizarItem(10, 2, ""));

    expect(result.current.totalItens).toBe(3);
    expect(result.current.totalEstimado).toBeCloseTo(18.9 * 2 + 6.5);
  });

  it("removeItem remove só o item indicado, preservando os demais", () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(burger));
    act(() => result.current.addItem(refrigerante));
    act(() => result.current.removeItem(10));

    expect(result.current.itens).toEqual([
      { produtoId: 20, nome: "Refrigerante", descricao: null, preco: 6.5, imagemUrl: null, quantidade: 1 },
    ]);
  });

  it("clearCart esvazia o carrinho", () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(burger));
    act(() => result.current.clearCart());

    expect(result.current.itens).toEqual([]);
    expect(result.current.totalItens).toBe(0);
    expect(result.current.totalEstimado).toBe(0);
  });
});
