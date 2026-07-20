import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  /**
   * TASK-114: `secondary` (fantasma, hover para a cor da marca) e `danger` (fantasma, hover para
   * `--color-error`) substituem as classes duplicadas que existiam antes desta task
   * (`dispositivo-form__cancelar`, `restaurante-card__acao-secundaria`, `pedido-pendente-card__cancelar`,
   * `cart-summary__limpar`, `operador-painel__trocar`) — mesma aparência final, uma única definição CSS.
   */
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
}

export function Button({
  loading = false,
  disabled,
  children,
  className,
  variant = "primary",
  fullWidth = false,
  ...rest
}: ButtonProps) {
  const classes = [
    "ui-button",
    variant !== "primary" && `ui-button--${variant}`,
    fullWidth && "ui-button--full",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? "Aguarde..." : children}
    </button>
  );
}
