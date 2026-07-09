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
