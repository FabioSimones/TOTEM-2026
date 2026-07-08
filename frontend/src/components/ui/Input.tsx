import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, id, ...rest }: InputProps) {
  return (
    <div className="ui-input">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
    </div>
  );
}
