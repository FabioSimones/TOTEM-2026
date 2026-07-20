import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renderiza como variante primária por padrão (sem classe de variante extra)", () => {
    render(<Button>Salvar</Button>);
    const botao = screen.getByRole("button", { name: "Salvar" });
    expect(botao).toHaveClass("ui-button");
    expect(botao.className).not.toMatch(/ui-button--/);
  });

  it("aplica a classe correspondente para variant='secondary' e 'danger'", () => {
    const { rerender } = render(<Button variant="secondary">Cancelar</Button>);
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveClass("ui-button--secondary");

    rerender(<Button variant="danger">Excluir</Button>);
    expect(screen.getByRole("button", { name: "Excluir" })).toHaveClass("ui-button--danger");
  });

  it("fullWidth aplica ui-button--full", () => {
    render(<Button fullWidth>Continuar</Button>);
    expect(screen.getByRole("button", { name: "Continuar" })).toHaveClass("ui-button--full");
  });

  it("loading mostra 'Aguarde...', desabilita e marca aria-busy", () => {
    render(<Button loading>Salvar</Button>);
    const botao = screen.getByRole("button", { name: "Aguarde..." });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute("aria-busy", "true");
  });

  it("sem loading, não tem aria-busy", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).not.toHaveAttribute("aria-busy");
  });

  it("disabled desabilita mesmo sem loading", () => {
    render(<Button disabled>Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("dispara onClick quando habilitado", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Salvar</Button>);

    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("preserva className adicional junto das classes do componente", () => {
    render(<Button className="pedido-pendente-card__acao">Confirmar</Button>);
    const botao = screen.getByRole("button", { name: "Confirmar" });
    expect(botao).toHaveClass("ui-button");
    expect(botao).toHaveClass("pedido-pendente-card__acao");
  });
});
