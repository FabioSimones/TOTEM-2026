import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import { UsuarioForm } from "./UsuarioForm";

const restaurante: RestauranteAdminResponse = {
  id: 1,
  nome: "Totem Burger",
  cnpj: "12345678000199",
  endereco: null,
  ativo: true,
  criadoEm: "2026-01-01T00:00:00Z",
  atualizadoEm: "2026-01-01T00:00:00Z",
};

function renderForm(overrides: Partial<React.ComponentProps<typeof UsuarioForm>> = {}) {
  const onCriar = vi.fn();
  const onAtualizar = vi.fn();
  const onCancelarEdicao = vi.fn();

  render(
    <MemoryRouter>
      <UsuarioForm
        usuarioEmEdicao={null}
        restaurantes={[restaurante]}
        restauranteSelecionadoPadrao={null}
        onCriar={onCriar}
        onAtualizar={onAtualizar}
        onCancelarEdicao={onCancelarEdicao}
        salvando={false}
        erro={null}
        {...overrides}
      />
    </MemoryRouter>,
  );

  return { onCriar, onAtualizar, onCancelarEdicao };
}

describe("UsuarioForm", () => {
  it("submit vazio mostra erros inline (nome, email, senha) e não chama onCriar", async () => {
    const user = userEvent.setup();
    const { onCriar } = renderForm();

    await user.click(screen.getByRole("button", { name: "Cadastrar usuário" }));

    expect(await screen.findByText("Informe o nome do usuário.")).toBeInTheDocument();
    expect(screen.getByText("Informe o e-mail do usuário.")).toBeInTheDocument();
    expect(screen.getByText("Informe uma senha.")).toBeInTheDocument();
    expect(onCriar).not.toHaveBeenCalled();
  });

  it("e-mail com formato inválido mostra mensagem acessível; corrigir remove o erro", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Email"), "email-invalido");
    await user.click(screen.getByRole("button", { name: "Cadastrar usuário" }));

    const erro = await screen.findByText(/Informe um e-mail válido/);
    expect(erro).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");

    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "maria@totem.local");
    expect(screen.queryByText(/Informe um e-mail válido/)).not.toBeInTheDocument();
  });

  it("senha só é exigida na criação, não na edição", async () => {
    const user = userEvent.setup();
    const { onAtualizar } = renderForm({
      usuarioEmEdicao: {
        id: 10,
        restauranteId: 1,
        nome: "Maria",
        email: "maria@totem.local",
        perfil: "OPERADOR_CAIXA",
        ativo: true,
        criadoEm: "2026-01-01T00:00:00Z",
        atualizadoEm: null,
      },
    });

    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(onAtualizar).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ nome: "Maria", email: "maria@totem.local", perfil: "OPERADOR_CAIXA" }),
    );
  });
});
