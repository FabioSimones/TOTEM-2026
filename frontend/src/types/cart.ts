/**
 * Item do carrinho local do Totem. `preco` é apenas para exibição —
 * o backend calcula preço/subtotal/total ao criar o pedido (TASK-015),
 * então nenhum valor monetário daqui é enviado em POST /api/totem/pedidos.
 */
export interface CartItem {
  produtoId: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagemUrl: string | null;
  quantidade: number;
  observacao?: string;
}

/**
 * TASK-120.3: subconjunto de campos que `ProductSelectionModal`/`useCart.addItem` realmente usam
 * — `ProdutoCardapioResponse` (cardápio) e `CartItem` (edição de um item já no carrinho) satisfazem
 * essa forma estruturalmente, então o modal de seleção funciona para os dois modos ("adicionar" a
 * partir do cardápio, "editar" a partir do carrinho) sem inventar campos nem duplicar tipos.
 */
export interface ProdutoParaCarrinho {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagemUrl: string | null;
}
