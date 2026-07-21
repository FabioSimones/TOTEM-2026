import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OperationalEmptyState } from "./OperationalEmptyState";

describe("OperationalEmptyState", () => {
  it("variant loading mostra a mensagem com aria-busy", () => {
    render(<OperationalEmptyState variant="loading" mensagem="Carregando pendências..." />);

    const mensagem = screen.getByText("Carregando pendências...");
    expect(mensagem).toHaveAttribute("aria-busy", "true");
  });

  it("variant erro mostra a mensagem como alert e aciona onTentarNovamente", async () => {
    const onTentarNovamente = vi.fn();
    const user = userEvent.setup();
    render(<OperationalEmptyState variant="erro" mensagem="Falha ao carregar." onTentarNovamente={onTentarNovamente} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao carregar.");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(onTentarNovamente).toHaveBeenCalledTimes(1);
  });

  it("variant erro sem onTentarNovamente não mostra botão", () => {
    render(<OperationalEmptyState variant="erro" mensagem="Falha ao carregar." />);

    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("variant vazio mostra só a mensagem", () => {
    render(<OperationalEmptyState variant="vazio" mensagem="Nenhum pedido pendente no momento." />);

    expect(screen.getByText("Nenhum pedido pendente no momento.")).toBeInTheDocument();
  });
});
