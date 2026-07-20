interface FieldErrorProps {
  id: string;
  message?: string | null;
}

/**
 * Erro inline associado a um campo específico (TASK-115) — diferente de `ErrorMessage`
 * (`role="alert"`, usado só para erro global/de API): usa `aria-live="polite"` para não disparar
 * vários anúncios simultâneos quando múltiplos campos ficam inválidos de uma vez no submit.
 */
export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="ui-field__error" aria-live="polite">
      {message}
    </p>
  );
}
