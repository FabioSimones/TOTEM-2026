import { useCallback, useMemo, useState } from "react";
import type { CartItem } from "../types/cart";
import type { ProdutoCardapioResponse } from "../types/totem";

/** Carrinho local do Totem — estado apenas em memória, não é enviado ao backend nesta task. */
export function useCart() {
  const [itens, setItens] = useState<CartItem[]>([]);

  const addItem = useCallback((produto: ProdutoCardapioResponse) => {
    setItens((atual) => {
      const existente = atual.find((item) => item.produtoId === produto.id);
      if (existente) {
        return atual.map((item) =>
          item.produtoId === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item,
        );
      }
      return [
        ...atual,
        {
          produtoId: produto.id,
          nome: produto.nome,
          descricao: produto.descricao,
          preco: produto.preco,
          imagemUrl: produto.imagemUrl,
          quantidade: 1,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((produtoId: number) => {
    setItens((atual) => atual.filter((item) => item.produtoId !== produtoId));
  }, []);

  const increment = useCallback((produtoId: number) => {
    setItens((atual) =>
      atual.map((item) => (item.produtoId === produtoId ? { ...item, quantidade: item.quantidade + 1 } : item)),
    );
  }, []);

  const decrement = useCallback((produtoId: number) => {
    setItens((atual) =>
      atual
        .map((item) => (item.produtoId === produtoId ? { ...item, quantidade: item.quantidade - 1 } : item))
        .filter((item) => item.quantidade > 0),
    );
  }, []);

  const setObservacao = useCallback((produtoId: number, observacao: string) => {
    setItens((atual) => atual.map((item) => (item.produtoId === produtoId ? { ...item, observacao } : item)));
  }, []);

  const clearCart = useCallback(() => {
    setItens([]);
  }, []);

  const totalItens = useMemo(() => itens.reduce((soma, item) => soma + item.quantidade, 0), [itens]);

  const totalEstimado = useMemo(
    () => itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0),
    [itens],
  );

  return {
    itens,
    addItem,
    removeItem,
    increment,
    decrement,
    setObservacao,
    clearCart,
    totalItens,
    totalEstimado,
  };
}
