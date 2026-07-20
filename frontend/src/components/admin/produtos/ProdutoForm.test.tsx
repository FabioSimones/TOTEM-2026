import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { CategoriaAdminResponse } from "../../../types/categoria";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import { ProdutoForm } from "./ProdutoForm";

const restaurante: RestauranteAdminResponse = {
  id: 1,
  nome: "Totem Burger",
  cnpj: "12345678000199",
  endereco: null,
  ativo: true,
  criadoEm: "2026-01-01T00:00:00Z",
  atualizadoEm: "2026-01-01T00:00:00Z",
};

const categoria: CategoriaAdminResponse = {
  id: 5,
  restauranteId: 1,
  nome: "Lanches",
  descricao: null,
  ordemExibicao: null,
  ativa: true,
};

function renderForm(overrides: Partial<React.ComponentProps<typeof ProdutoForm>> = {}) {
  const onCriar = vi.fn();
  const onAtualizar = vi.fn();
  const onCancelarEdicao = vi.fn();

  render(
    <MemoryRouter>
      <ProdutoForm
        produtoEmEdicao={null}
        restaurantes={[restaurante]}
        categorias={[categoria]}
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

describe("ProdutoForm", () => {
  it("submit sem campos obrigatórios mostra erros inline e não chama onCriar", async () => {
    const user = userEvent.setup();
    const { onCriar } = renderForm();

    await user.click(screen.getByRole("button", { name: "Cadastrar produto" }));

    expect(await screen.findByText("Informe o nome do produto.")).toBeInTheDocument();
    expect(screen.getByText("Informe um preço válido maior que zero.")).toBeInTheDocument();
    expect(onCriar).not.toHaveBeenCalled();
  });

  it("URL de imagem inválida mostra erro inline sem apagar o valor digitado", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Nome"), "X-Burger");
    await user.type(screen.getByLabelText("Preço (R$)"), "10");
    await user.type(screen.getByLabelText("URL da imagem (opcional)"), "não-e-uma-url");
    await user.click(screen.getByRole("button", { name: "Cadastrar produto" }));

    expect(await screen.findByText(/Informe uma URL válida/)).toBeInTheDocument();
    expect(screen.getByLabelText("URL da imagem (opcional)")).toHaveValue("não-e-uma-url");
  });

  it("envia os dados quando válido, incluindo categoria selecionada", async () => {
    const user = userEvent.setup();
    const { onCriar } = renderForm();

    await user.type(screen.getByLabelText("Nome"), "X-Burger");
    await user.type(screen.getByLabelText("Preço (R$)"), "29.9");
    await user.click(screen.getByRole("button", { name: "Cadastrar produto" }));

    expect(onCriar).toHaveBeenCalledWith(
      expect.objectContaining({ restauranteId: 1, categoriaId: 5, nome: "X-Burger", preco: 29.9 }),
    );
  });
});
