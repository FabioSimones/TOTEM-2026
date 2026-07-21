import type { ReactNode } from "react";
import { OperationalTopbar } from "./OperationalTopbar";
import type { DispositivoAutenticadoResponse, OperadorAutenticadoResponse } from "../../types/auth";

interface OperationalLayoutProps {
  modulo: "Caixa" | "Cozinha";
  dispositivo: DispositivoAutenticadoResponse;
  /** TASK-119.2: `null` enquanto não há operador identificado — a topbar já monta assim mesmo. */
  operador: OperadorAutenticadoResponse | null;
  onTrocarOperador?: () => void;
  onTrocarDispositivo: () => void;
  children: ReactNode;
}

/**
 * TASK-119: layout compartilhado por Caixa e Cozinha a partir do momento em que o dispositivo está
 * pronto (compatível e autenticado) — `OperationalTopbar` fixa no topo + `<main>` com o conteúdo
 * específico de cada módulo. Os estados anteriores (sem dispositivo, incompatível) continuam
 * usando os cards centralizados de antes, fora deste layout.
 * TASK-119.2: passou a cobrir também o intervalo sem operador — antes só montava com os dois
 * (dispositivo e operador) prontos, e o formulário de login ficava isolado na casca antiga. Agora
 * a topbar não desmonta durante a transição "sem operador" → "operador identificado": só o
 * conteúdo de `children`, decidido pela página, muda.
 */
export function OperationalLayout({
  modulo,
  dispositivo,
  operador,
  onTrocarOperador,
  onTrocarDispositivo,
  children,
}: OperationalLayoutProps) {
  return (
    <div className="operational-layout">
      <OperationalTopbar
        modulo={modulo}
        dispositivo={dispositivo}
        operador={operador}
        onTrocarOperador={onTrocarOperador}
        onTrocarDispositivo={onTrocarDispositivo}
      />
      <main className="operational-layout__content">{children}</main>
    </div>
  );
}
