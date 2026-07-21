import { useCallback, useMemo, useState } from "react";
import type { CartItem, ProdutoParaCarrinho } from "../types/cart";

/** Carrinho local do Totem — estado apenas em memória, não é enviado ao backend nesta task. */
export function useCart() {
  const [itens, setItens] = useState<CartItem[]>([]);

  const addItem = useCallback((produto: ProdutoParaCarrinho, quantidade = 1, observacao?: string) => {
    setItens((atual) => {
      const existente = atual.find((item) => item.produtoId === produto.id);
      if (existente) {
        return atual.map((item) =>
          item.produtoId === produto.id
            ? {
                ...item,
                quantidade: item.quantidade + quantidade,
                ...(observacao ? { observacao } : {}),
              }
            : item,
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
          quantidade,
          ...(observacao ? { observacao } : {}),
        },
      ];
    });
  }, []);

  /**
   * TASK-120.3: edição pontual de um item já no carrinho — usada pelo `ProductSelectionModal` em
   * modo "editar" (aberto a partir do `CartReviewItem`). Diferente de `addItem`, **define** a
   * quantidade/observação em vez de incrementar, e nunca remove/recria o item — preserva
   * identidade (`produtoId`) e ordem na lista, já que a edição não deve mudar a posição do item
   * nem criar uma segunda entrada para o mesmo produto.
   */
  const atualizarItem = useCallback((produtoId: number, quantidade: number, observacao: string) => {
    setItens((atual) =>
      atual.map((item) =>
        item.produtoId === produtoId
          ? { ...item, quantidade: Math.max(1, quantidade), observacao: observacao || undefined }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((produtoId: number) => {
    setItens((atual) => atual.filter((item) => item.produtoId !== produtoId));
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
    atualizarItem,
    removeItem,
    clearCart,
    totalItens,
    totalEstimado,
  };
}
