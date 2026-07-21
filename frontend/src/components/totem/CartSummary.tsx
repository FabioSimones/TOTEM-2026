import { useState, type FormEvent } from "react";
import { FaBox, FaUtensils } from "react-icons/fa6";
import type { CartItem } from "../../types/cart";
import type { TipoConsumo } from "../../types/totem";
import { formatCurrencyBRL } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Input } from "../ui/Input";
import { CartReviewItem } from "./CartReviewItem";

interface CartSummaryProps {
  itens: CartItem[];
  totalEstimado: number;
  onEditarItem: (item: CartItem) => void;
  onRemove: (produtoId: number) => void;
  onClear: () => void;
  onCreateOrder: (dados: { clienteNome: string; tipoConsumo: TipoConsumo }) => void;
  criandoPedido: boolean;
  erroPedido: string | null;
  /** TASK-120.1: só relevante quando reaproveitado dentro do `CartModal` — mostra "Continuar
   * escolhendo" no estado vazio, fechando o modal sem alterar o carrinho. */
  onContinuarEscolhendo?: () => void;
}

/** TASK-120.3: opções de consumo com ícone + descrição curta — reaproveita `react-icons/fa6` já
 * instalado, sem biblioteca nova. `FaUtensils` (talheres) para "comer no local", `FaBox` (embalagem
 * para viagem) para "para viagem" — nenhum dos dois entra em conflito com o uso de `FaUtensils`
 * como fallback de imagem em `CartReviewItem` (contextos diferentes, mesmo símbolo é reaproveitado
 * de propósito para "refeição servida"). */
const OPCOES_TIPO_CONSUMO: { valor: TipoConsumo; rotulo: string; descricao: string; Icone: typeof FaUtensils }[] = [
  { valor: "LOCAL", rotulo: "Comer no local", descricao: "Servido na mesa ou balcão", Icone: FaUtensils },
  { valor: "VIAGEM", rotulo: "Para viagem", descricao: "Embalado para levar", Icone: FaBox },
];

export function CartSummary({
  itens,
  totalEstimado,
  onEditarItem,
  onRemove,
  onClear,
  onCreateOrder,
  criandoPedido,
  erroPedido,
  onContinuarEscolhendo,
}: CartSummaryProps) {
  const [clienteNome, setClienteNome] = useState("");
  const [tipoConsumo, setTipoConsumo] = useState<TipoConsumo>("LOCAL");
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  const carrinhoVazio = itens.length === 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (clienteNome.trim() === "") {
      setErroValidacao("Informe seu nome para continuar.");
      return;
    }
    setErroValidacao(null);
    onCreateOrder({ clienteNome: clienteNome.trim(), tipoConsumo });
  }

  if (carrinhoVazio) {
    return (
      <div className="cart-summary">
        <p className="cart-summary__vazio">Seu carrinho está vazio. Escolha produtos no cardápio para adicionar aqui.</p>
        {onContinuarEscolhendo && (
          <Button type="button" fullWidth onClick={onContinuarEscolhendo}>
            Continuar escolhendo
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="cart-summary">
      <p className="cart-summary__descricao">Revise os itens e confirme como deseja receber o pedido.</p>

      <ul className="cart-summary__lista">
        {itens.map((item) => (
          <CartReviewItem key={item.produtoId} item={item} onEditar={onEditarItem} onRemover={onRemove} />
        ))}
      </ul>

      <form className="cart-summary__confirmacao" onSubmit={handleSubmit}>
        <div className="cart-summary__total">
          <span>Total estimado</span>
          <strong>{formatCurrencyBRL(totalEstimado)}</strong>
        </div>

        <p className="cart-summary__aviso">O valor final será confirmado pelo restaurante ao criar o pedido.</p>

        <fieldset className="cart-summary__tipo-consumo">
          <legend className="cart-summary__tipo-consumo-legenda">Tipo de consumo</legend>
          <div className="cart-summary__tipo-consumo-opcoes">
            {OPCOES_TIPO_CONSUMO.map((opcao) => (
              <label
                key={opcao.valor}
                className={
                  "cart-summary__tipo-consumo-opcao" +
                  (tipoConsumo === opcao.valor ? " cart-summary__tipo-consumo-opcao--ativa" : "")
                }
              >
                <input
                  type="radio"
                  name="tipoConsumo"
                  value={opcao.valor}
                  checked={tipoConsumo === opcao.valor}
                  onChange={() => setTipoConsumo(opcao.valor)}
                  className="cart-summary__tipo-consumo-input"
                />
                <opcao.Icone className="cart-summary__tipo-consumo-icone" aria-hidden="true" focusable="false" />
                <span className="cart-summary__tipo-consumo-texto">
                  <span className="cart-summary__tipo-consumo-titulo">{opcao.rotulo}</span>
                  <span className="cart-summary__tipo-consumo-descricao">{opcao.descricao}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Input
          id="clienteNome"
          label="Seu nome"
          value={clienteNome}
          onChange={(event) => setClienteNome(event.target.value)}
          placeholder="Ex.: Fabio"
          error={erroValidacao}
        />

        <ErrorMessage message={erroPedido} />

        <Button type="submit" fullWidth loading={criandoPedido}>
          Criar pedido
        </Button>

        <div className="cart-summary__acoes-secundarias">
          {onContinuarEscolhendo && (
            <Button type="button" variant="secondary" onClick={onContinuarEscolhendo} disabled={criandoPedido}>
              Continuar escolhendo
            </Button>
          )}
          <Button type="button" variant="danger" onClick={onClear} disabled={criandoPedido}>
            Limpar carrinho
          </Button>
        </div>
      </form>
    </div>
  );
}
