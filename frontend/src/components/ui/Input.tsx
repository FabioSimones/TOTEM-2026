import { forwardRef, type InputHTMLAttributes } from "react";
import { FieldError } from "./FieldError";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** TASK-115: erro inline — quando presente, aplica aria-invalid e associa via aria-describedby. */
  error?: string | null;
  /** Texto de ajuda opcional, associado via aria-describedby junto do erro, quando houver. */
  helpText?: string;
}

/**
 * `forwardRef` (TASK-115) — necessário para que os formulários administrativos consigam mover o
 * foco para o campo (via `ref.current.focus()`) após uma tentativa de envio inválida.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, id, error, helpText, ...rest },
  ref,
) {
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={"ui-input" + (error ? " ui-field--invalid" : "")}>
      <label htmlFor={id}>{label}</label>
      <input ref={ref} id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...rest} />
      {helpText && (
        <p id={helpId} className="ui-field__help">
          {helpText}
        </p>
      )}
      <FieldError id={errorId ?? `${id}-error`} message={error} />
    </div>
  );
});
