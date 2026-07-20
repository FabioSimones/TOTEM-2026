import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  aberto: boolean;
  titulo: string;
  children: ReactNode;
  onFechar: () => void;
  fecharAoClicarBackdrop?: boolean;
  tamanho?: "pequeno" | "medio" | "grande";
}

let contadorModaisAbertos = 0;

export function Modal({
  aberto,
  titulo,
  children,
  onFechar,
  fecharAoClicarBackdrop = false,
  tamanho = "medio",
}: ModalProps) {
  const painelRef = useRef<HTMLDivElement>(null);
  const elementoAnteriorFocoRef = useRef<HTMLElement | null>(null);
  const tituloId = useRef(`modal-titulo-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    if (!aberto) {
      return;
    }

    elementoAnteriorFocoRef.current = document.activeElement as HTMLElement | null;
    painelRef.current?.focus();

    // Bloqueia o scroll de fundo enquanto qualquer modal estiver aberto — o contador evita que um
    // modal aninhado/reaberto rapidamente reative o scroll antes da hora ao desmontar.
    contadorModaisAbertos += 1;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onFechar();
        return;
      }
      if (event.key !== "Tab" || !painelRef.current) {
        return;
      }
      const focaveis = painelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focaveis.length === 0) {
        return;
      }
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      contadorModaisAbertos -= 1;
      if (contadorModaisAbertos <= 0) {
        contadorModaisAbertos = 0;
        document.body.style.overflow = "";
      }
      elementoAnteriorFocoRef.current?.focus();
    };
  }, [aberto, onFechar]);

  if (!aberto) {
    return null;
  }

  return createPortal(
    <div
      className="ui-modal-backdrop"
      onClick={() => {
        if (fecharAoClicarBackdrop) {
          onFechar();
        }
      }}
    >
      <div
        ref={painelRef}
        className={`ui-modal ui-modal--${tamanho}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ui-modal__cabecalho">
          <h2 id={tituloId} className="ui-modal__titulo">
            {titulo}
          </h2>
          <button type="button" className="ui-modal__fechar" onClick={onFechar} aria-label="Fechar">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="ui-modal__conteudo">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
