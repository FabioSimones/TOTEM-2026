import { useState } from "react";
import type { ProdutoParaCarrinho } from "../../types/cart";
import { formatCurrencyBRL } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ProductImage } from "./ProductImage";

interface ProductSelectionModalProps {
  produto: ProdutoParaCarrinho | null;
  /** TASK-120.3: "editar" é aberto a partir de um item já no carrinho (`CartReviewItem`) — mesmo
   * modal, só muda o rótulo do botão de confirmação e os valores iniciais. */
  modo?: "adicionar" | "editar";
  quantidadeInicial?: number;
  observacaoInicial?: string;
  onFechar: () => void;
  onConfirmar: (produto: ProdutoParaCarrinho, quantidade: number, observacao: string) => void;
}

/**
 * TASK-120.1: substitui a adição direta de 1 unidade ao clicar em "Adicionar" — agora abre este
 * modal para escolher quantidade/observação antes de confirmar. Não guarda o carrinho inteiro,
 * só o estado efêmero desta seleção (quantidade/observação), descartado ao cancelar.
 *
 * Reset de quantidade/observação entre aberturas é responsabilidade de quem chama este componente
 * (via `key`, não `useEffect` interno) — um `useEffect` corre o risco real de o reset só se aplicar
 * depois de um primeiro render com o estado antigo (mesma classe de bug já encontrada na TASK-120
 * com a categoria padrão), enquanto `key` garante um componente novo (com `useState` inicial) de
 * forma síncrona, sem essa corrida. TASK-120.3: como o mesmo produto pode ser reaberto em modos
 * diferentes (ou duas vezes seguidas em edição), quem chama usa um contador de abertura como `key`,
 * não só `produto.id`.
 */
export function ProductSelectionModal({
  produto,
  modo = "adicionar",
  quantidadeInicial = 1,
  observacaoInicial = "",
  onFechar,
  onConfirmar,
}: ProductSelectionModalProps) {
  const [quantidade, setQuantidade] = useState(quantidadeInicial);
  const [observacao, setObservacao] = useState(observacaoInicial);

  if (!produto) {
    return null;
  }

  const subtotal = produto.preco * quantidade;
  const editando = modo === "editar";

  function handleConfirmar() {
    if (!produto) {
      return;
    }
    onConfirmar(produto, quantidade, observacao.trim());
    onFechar();
  }

  return (
    <Modal aberto titulo={produto.nome} onFechar={onFechar} fecharAoClicarBackdrop tamanho="medio">
      <div className="product-selection-modal">
        <ProductImage src={produto.imagemUrl} productName={produto.nome} size="modal" loading="eager" />

        {produto.descricao && <p className="product-selection-modal__descricao">{produto.descricao}</p>}

        <p className="product-selection-modal__preco-unitario">
          {formatCurrencyBRL(produto.preco)} <span>por unidade</span>
        </p>

        <div className="product-selection-modal__quantidade">
          <span className="product-selection-modal__quantidade-rotulo" id="product-selection-modal-qtd-rotulo">
            Quantidade
          </span>
          <div className="product-selection-modal__quantidade-controles">
            <button
              type="button"
              className="product-selection-modal__qtd-botao"
              onClick={() => setQuantidade((atual) => Math.max(1, atual - 1))}
              disabled={quantidade <= 1}
              aria-label="Diminuir quantidade"
            >
              <span aria-hidden="true">−</span>
            </button>
            <span
              className="product-selection-modal__qtd-valor"
              aria-live="polite"
              aria-labelledby="product-selection-modal-qtd-rotulo"
            >
              {quantidade}
            </span>
            <button
              type="button"
              className="product-selection-modal__qtd-botao"
              onClick={() => setQuantidade((atual) => atual + 1)}
              aria-label="Aumentar quantidade"
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
        </div>

        <label className="product-selection-modal__observacao">
          Observação do item
          <input
            type="text"
            value={observacao}
            onChange={(event) => setObservacao(event.target.value)}
            placeholder="Ex.: sem cebola"
          />
        </label>

        <div className="product-selection-modal__subtotal">
          <span>Subtotal</span>
          <strong>{formatCurrencyBRL(subtotal)}</strong>
        </div>

        <div className="product-selection-modal__acoes">
          <Button type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirmar}>
            {editando ? "Salvar alterações" : "Adicionar ao carrinho"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
