import { useState, type FormEvent } from "react";
import type { CartItem } from "../../types/cart";
import type { TipoConsumo } from "../../types/totem";
import { formatCurrencyBRL } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Input } from "../ui/Input";
import { CartItemRow } from "./CartItemRow";

interface CartSummaryProps {
  itens: CartItem[];
  totalEstimado: number;
  onIncrement: (produtoId: number) => void;
  onDecrement: (produtoId: number) => void;
  onRemove: (produtoId: number) => void;
  onChangeObservacao: (produtoId: number, observacao: string) => void;
  onClear: () => void;
  onCreateOrder: (dados: { clienteNome: string; tipoConsumo: TipoConsumo }) => void;
  criandoPedido: boolean;
  erroPedido: string | null;
}

const OPCOES_TIPO_CONSUMO: { valor: TipoConsumo; rotulo: string }[] = [
  { valor: "LOCAL", rotulo: "Comer no local" },
  { valor: "VIAGEM", rotulo: "Para viagem" },
];

export function CartSummary({
  itens,
  totalEstimado,
  onIncrement,
  onDecrement,
  onRemove,
  onChangeObservacao,
  onClear,
  onCreateOrder,
  criandoPedido,
  erroPedido,
}: CartSummaryProps) {
  const [formAberto, setFormAberto] = useState(false);
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

  return (
    <aside className="cart-summary">
      <h2 className="cart-summary__titulo">Seu pedido</h2>

      {carrinhoVazio ? (
        <p className="cart-summary__vazio">Seu carrinho está vazio. Adicione produtos do cardápio ao lado.</p>
      ) : (
        <>
          <ul className="cart-summary__lista">
            {itens.map((item) => (
              <CartItemRow
                key={item.produtoId}
                item={item}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onRemove={onRemove}
                onChangeObservacao={onChangeObservacao}
              />
            ))}
          </ul>

          <div className="cart-summary__total">
            <span>Total estimado</span>
            <strong>{formatCurrencyBRL(totalEstimado)}</strong>
          </div>

          <p className="cart-summary__aviso">
            O valor final será confirmado pelo restaurante ao criar o pedido.
          </p>

          {!formAberto && (
            <Button type="button" className="cart-summary__finalizar" onClick={() => setFormAberto(true)}>
              Finalizar pedido
            </Button>
          )}

          {formAberto && (
            <form className="cart-summary__form" onSubmit={handleSubmit}>
              <Input
                id="clienteNome"
                label="Seu nome"
                value={clienteNome}
                onChange={(event) => setClienteNome(event.target.value)}
                placeholder="Ex.: Fabio"
              />

              <div className="cart-summary__tipo-consumo">
                <span className="cart-summary__tipo-consumo-rotulo">Tipo de consumo</span>
                <div className="cart-summary__tipo-consumo-opcoes">
                  {OPCOES_TIPO_CONSUMO.map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      className={
                        "cart-summary__tipo-consumo-botao" +
                        (tipoConsumo === opcao.valor ? " cart-summary__tipo-consumo-botao--ativo" : "")
                      }
                      aria-pressed={tipoConsumo === opcao.valor}
                      onClick={() => setTipoConsumo(opcao.valor)}
                    >
                      {opcao.rotulo}
                    </button>
                  ))}
                </div>
              </div>

              <ErrorMessage message={erroValidacao ?? erroPedido} />

              <Button type="submit" fullWidth loading={criandoPedido}>
                Criar pedido
              </Button>
            </form>
          )}

          <Button type="button" variant="danger" fullWidth onClick={onClear} disabled={criandoPedido}>
            Limpar carrinho
          </Button>
        </>
      )}
    </aside>
  );
}
