import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("sem erro, não marca aria-invalid e não associa aria-describedby a erro", () => {
    render(<Input id="nome" label="Nome" value="" onChange={() => {}} />);
    const campo = screen.getByLabelText("Nome");
    expect(campo).toHaveAttribute("aria-invalid", "false");
    expect(campo).not.toHaveAttribute("aria-describedby");
  });

  it("com erro, marca aria-invalid e associa aria-describedby à mensagem de erro", () => {
    render(<Input id="nome" label="Nome" value="" onChange={() => {}} error="Informe o nome." />);
    const campo = screen.getByLabelText("Nome");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAttribute("aria-describedby", "nome-error");
    expect(screen.getByText("Informe o nome.")).toHaveAttribute("id", "nome-error");
  });

  it("aplica a classe ui-field--invalid no wrapper quando há erro", () => {
    const { container } = render(<Input id="nome" label="Nome" value="" onChange={() => {}} error="Erro." />);
    expect(container.querySelector(".ui-field--invalid")).not.toBeNull();
  });

  it("combina helpText e erro em aria-describedby quando ambos presentes", () => {
    render(
      <Input id="nome" label="Nome" value="" onChange={() => {}} helpText="Ajuda aqui" error="Erro aqui" />,
    );
    const campo = screen.getByLabelText("Nome");
    expect(campo.getAttribute("aria-describedby")).toBe("nome-help nome-error");
  });

  it("encaminha o ref para o elemento input (necessário para foco programático)", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input id="nome" label="Nome" ref={ref} value="" onChange={() => {}} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
