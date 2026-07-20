import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldError } from "./FieldError";

describe("FieldError", () => {
  it("não renderiza nada quando não há mensagem", () => {
    const { container } = render(<FieldError id="campo-error" message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza a mensagem com o id informado e aria-live polite", () => {
    render(<FieldError id="campo-error" message="Campo obrigatório." />);
    const erro = screen.getByText("Campo obrigatório.");
    expect(erro).toHaveAttribute("id", "campo-error");
    expect(erro).toHaveAttribute("aria-live", "polite");
  });
});
