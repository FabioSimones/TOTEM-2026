import { Button } from "./Button";
import { ErrorMessage } from "./ErrorMessage";

interface OperationalEmptyStateProps {
  variant: "loading" | "erro" | "vazio";
  mensagem: string;
  onTentarNovamente?: () => void;
}

/**
 * TASK-119: padroniza os três estados que `CaixaHomePage`/`CozinhaHomePage` já renderiam de forma
 * duplicada (carregando/erro/vazio), com a mesma classe `totem-estado` já usada em todo o app —
 * sem mudar o visual, só removendo a repetição e adicionando `aria-busy`/`aria-live` no
 * carregamento (ausentes antes desta task).
 */
export function OperationalEmptyState({ variant, mensagem, onTentarNovamente }: OperationalEmptyStateProps) {
  if (variant === "loading") {
    return (
      <p className="totem-estado" aria-live="polite" aria-busy="true">
        {mensagem}
      </p>
    );
  }

  if (variant === "erro") {
    return (
      <div className="totem-estado totem-estado--erro">
        <ErrorMessage message={mensagem} />
        {onTentarNovamente && (
          <Button type="button" onClick={onTentarNovamente}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  return <p className="totem-estado">{mensagem}</p>;
}
