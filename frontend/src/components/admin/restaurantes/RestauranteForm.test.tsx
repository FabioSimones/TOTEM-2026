import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RestauranteForm } from "./RestauranteForm";

function renderForm(overrides: Partial<React.ComponentProps<typeof RestauranteForm>> = {}) {
  const onCriar = vi.fn();
  const onAtualizar = vi.fn();
  const onCancelarEdicao = vi.fn();

  render(
    <RestauranteForm
      restauranteEmEdicao={null}
      onCriar={onCriar}
      onAtualizar={onAtualizar}
      onCancelarEdicao={onCancelarEdicao}
      salvando={false}
      erro={null}
      {...overrides}
    />,
  );

  return { onCriar, onAtualizar, onCancelarEdicao };
}

describe("RestauranteForm", () => {
  it("submit vazio mostra erros inline nos campos obrigatórios e não chama onCriar", async () => {
    const user = userEvent.setup();
    const { onCriar } = renderForm();

    await user.click(screen.getByRole("button", { name: "Cadastrar restaurante" }));

    expect(await screen.findByText("Informe o nome do restaurante.")).toBeInTheDocument();
    expect(screen.getByText("Informe o CNPJ.")).toBeInTheDocument();
    expect(onCriar).not.toHaveBeenCalled();

    const campoNome = screen.getByLabelText("Nome");
    expect(campoNome).toHaveAttribute("aria-invalid", "true");
    expect(campoNome).toHaveFocus();
  });

  it("corrigir o campo remove o erro inline (revalida ao digitar depois de já inválido)", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Cadastrar restaurante" }));
    expect(await screen.findByText("Informe o nome do restaurante.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nome"), "Totem Burger");
    expect(screen.queryByText("Informe o nome do restaurante.")).not.toBeInTheDocument();
  });

  it("CNPJ com menos de 14 dígitos mostra mensagem específica", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Nome"), "Totem Burger");
    await user.type(screen.getByLabelText("CNPJ"), "123");
    await user.click(screen.getByRole("button", { name: "Cadastrar restaurante" }));

    expect(await screen.findByText(/CNPJ válido com 14 dígitos/)).toBeInTheDocument();
  });

  it("envia os dados quando válido", async () => {
    const user = userEvent.setup();
    const { onCriar } = renderForm();

    await user.type(screen.getByLabelText("Nome"), "Totem Burger");
    await user.type(screen.getByLabelText("CNPJ"), "12345678000199");
    await user.click(screen.getByRole("button", { name: "Cadastrar restaurante" }));

    expect(onCriar).toHaveBeenCalledWith({ nome: "Totem Burger", cnpj: "12345678000199" });
  });

  it("erro de campo vindo da API (errosCampoApi) aparece inline mesmo sem erro local", () => {
    renderForm({ errosCampoApi: { cnpj: "CNPJ já cadastrado." } });
    expect(screen.getByText("CNPJ já cadastrado.")).toBeInTheDocument();
    expect(screen.getByLabelText("CNPJ")).toHaveAttribute("aria-invalid", "true");
  });

  it("erro global (erro de comunicação/API sem campo reconhecido) continua exibido separadamente", () => {
    renderForm({ erro: "Não foi possível conectar ao servidor." });
    expect(screen.getByText("Não foi possível conectar ao servidor.")).toBeInTheDocument();
  });
});
