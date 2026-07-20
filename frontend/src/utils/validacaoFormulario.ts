import type { RefObject } from "react";

/**
 * Formato básico de e-mail (TASK-115) — deliberadamente permissivo (não tenta ser RFC 5322
 * completo, nem valida existência de domínio): só recusa o que claramente não é um e-mail
 * (sem "@", sem parte depois do "@", com espaço). Mesmo espírito de `@Email` do Bean Validation
 * no backend, sem duplicar a regra exata dele.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Move o foco para o primeiro campo inválido, na ordem visual do formulário (TASK-115). `ordem`
 * define a prioridade; `refs` só precisa conter as entradas relevantes para o formulário atual
 * (campos condicionais/ocultos podem não ter ref, e são pulados). Não usa `querySelector` no
 * `document` — só os refs explícitos do próprio formulário, seguro mesmo com vários modais na página.
 */
export function focarPrimeiroErro<TCampo extends string>(
  ordem: readonly TCampo[],
  erros: Partial<Record<TCampo, string>>,
  refs: Partial<Record<TCampo, RefObject<HTMLElement | null>>>,
): void {
  for (const campo of ordem) {
    const elemento = erros[campo] ? refs[campo]?.current : null;
    if (elemento) {
      const prefereMovimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      elemento.scrollIntoView({ block: "center", behavior: prefereMovimentoReduzido ? "auto" : "smooth" });
      elemento.focus();
      return;
    }
  }
}
