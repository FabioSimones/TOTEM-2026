import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("não renderiza nada quando fechado", () => {
    render(
      <Modal aberto={false} titulo="Título" onFechar={vi.fn()}>
        <p>Conteúdo</p>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renderiza título e conteúdo quando aberto", () => {
    render(
      <Modal aberto titulo="Cadastrar restaurante" onFechar={vi.fn()}>
        <p>Conteúdo do formulário</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: "Cadastrar restaurante" })).toBeInTheDocument();
    expect(screen.getByText("Conteúdo do formulário")).toBeInTheDocument();
  });

  it("fecha ao clicar no botão de fechar", async () => {
    const onFechar = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal aberto titulo="Título" onFechar={onFechar}>
        <p>Conteúdo</p>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it("fecha ao pressionar Escape", async () => {
    const onFechar = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal aberto titulo="Título" onFechar={onFechar}>
        <p>Conteúdo</p>
      </Modal>,
    );

    await user.keyboard("{Escape}");
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it("não fecha ao clicar no backdrop quando fecharAoClicarBackdrop é false (padrão)", async () => {
    const onFechar = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal aberto titulo="Título" onFechar={onFechar}>
        <p>Conteúdo</p>
      </Modal>,
    );

    await user.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onFechar).not.toHaveBeenCalled();
  });

  it("fecha ao clicar no backdrop quando fecharAoClicarBackdrop é true", async () => {
    const onFechar = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal aberto titulo="Título" onFechar={onFechar} fecharAoClicarBackdrop>
        <p>Conteúdo</p>
      </Modal>,
    );

    await user.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onFechar).toHaveBeenCalledTimes(1);
  });
});
