import type { CartItem } from "../../types/cart";
import type { TipoConsumo } from "../../types/totem";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { CartSummary } from "./CartSummary";

interface CartModalProps {
  aberto: boolean;
  onFechar: () => void;
  itens: CartItem[];
  totalEstimado: number;
  onEditarItem: (item: CartItem) => void;
  onRemove: (produtoId: number) => void;
  onClear: () => void;
  onCreateOrder: (dados: { clienteNome: string; tipoConsumo: TipoConsumo }) => void;
  criandoPedido: boolean;
  erroPedido: string | null;
  /** Sessão expirou durante a criação do pedido — mostra a ação de reativação dentro do modal. */
  semAutorizacao?: boolean;
  onIrParaAtivacao?: () => void;
}

/**
 * TASK-120.1: casca do modal do carrinho — reaproveita `CartSummary` sem copiar seu JSX (só
 * empacota em `Modal`, aberto exclusivamente pelo botão de carrinho da `TotemTopbar`). Fechar não
 * apaga nada: o estado do carrinho continua vivendo em `useCart`, dentro de `TotemHomePage` — este
 * componente não guarda nenhuma cópia própria dos itens.
 *
 * TASK-120.3: edição pontual de um item não acontece aqui — `onEditarItem` só repassa o item para
 * `TotemHomePage`, que fecha este modal e abre o `ProductSelectionModal` em modo "editar" (nunca
 * dois diálogos simultâneos).
 */
export function CartModal({
  aberto,
  onFechar,
  itens,
  totalEstimado,
  onEditarItem,
  onRemove,
  onClear,
  onCreateOrder,
  criandoPedido,
  erroPedido,
  semAutorizacao,
  onIrParaAtivacao,
}: CartModalProps) {
  if (!aberto) {
    return null;
  }

  return (
    <Modal
      aberto={aberto}
      titulo="Seu pedido"
      onFechar={onFechar}
      tamanho="grande"
    >
      <CartSummary
        itens={itens}
        totalEstimado={totalEstimado}
        onEditarItem={onEditarItem}
        onRemove={onRemove}
        onClear={onClear}
        onCreateOrder={onCreateOrder}
        criandoPedido={criandoPedido}
        erroPedido={erroPedido}
        onContinuarEscolhendo={onFechar}
      />

      {semAutorizacao && onIrParaAtivacao && (
        <Button type="button" onClick={onIrParaAtivacao}>
          Ir para ativação de dispositivo
        </Button>
      )}
    </Modal>
  );
}
