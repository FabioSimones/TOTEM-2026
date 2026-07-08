import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({ loading = false, disabled, children, ...rest }: ButtonProps) {
  return (
    <button disabled={disabled || loading} {...rest}>
      {loading ? "Aguarde..." : children}
    </button>
  );
}
