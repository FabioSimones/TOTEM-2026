import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import type { UsuarioAdminResponse } from "../../../types/usuario";
import { UsuarioCard } from "./UsuarioCard";

const restauranteMock: RestauranteAdminResponse = {
  id: 1,
  nome: "Dogão do seu João",
  cnpj: "12345678000199",
  endereco: null,
  ativo: true,
  criadoEm: "2026-01-01T00:00:00Z",
  atualizadoEm: "2026-01-01T00:00:00Z",
};

const usuarioBase: UsuarioAdminResponse = {
  id: 1,
  restauranteId: 1,
  nome: "Fulano de Tal",
  email: "admin.local@totem.local",
  perfil: "ADMIN_RESTAURANTE",
  ativo: true,
  criadoEm: "2026-01-01T00:00:00Z",
  atualizadoEm: null,
};

function renderCard(usuario: UsuarioAdminResponse, restaurantes: RestauranteAdminResponse[] = [restauranteMock]) {
  return render(
    <UsuarioCard
      usuario={usuario}
      restaurantes={restaurantes}
      executando={false}
      erro={null}
      onEditar={vi.fn()}
      onAtivar={vi.fn()}
      onDesativar={vi.fn()}
      onAlterarSenha={vi.fn()}
    />,
  );
}

describe("UsuarioCard — layout dos dados (TASK-119.1)", () => {
  it("exibe e-mail, perfil amigável e restaurante, cada um em seu próprio campo", () => {
    renderCard(usuarioBase);

    expect(screen.getByText("E-mail")).toBeInTheDocument();
    expect(screen.getByText("admin.local@totem.local")).toBeInTheDocument();
    expect(screen.getByText("Perfil")).toBeInTheDocument();
    expect(screen.getByText("Administrador do restaurante")).toBeInTheDocument();
    expect(screen.getByText("Restaurante")).toBeInTheDocument();
    expect(screen.getByText("Dogão do seu João")).toBeInTheDocument();
  });

  it("nunca exibe o enum técnico do perfil", () => {
    renderCard(usuarioBase);

    expect(screen.queryByText("ADMIN_RESTAURANTE")).not.toBeInTheDocument();
  });

  it("SUPER_ADMIN sem restaurante mostra o rótulo amigável e '—' no lugar do restaurante", () => {
    renderCard({ ...usuarioBase, perfil: "SUPER_ADMIN", restauranteId: null }, []);

    expect(screen.getByText("Super administrador")).toBeInTheDocument();
    expect(screen.getByText("Restaurante")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("SUPER_ADMIN")).not.toBeInTheDocument();
  });

  it("OPERADOR_CAIXA mostra o rótulo amigável correto", () => {
    renderCard({ ...usuarioBase, perfil: "OPERADOR_CAIXA" });

    expect(screen.getByText("Operador de caixa")).toBeInTheDocument();
  });

  it("OPERADOR_COZINHA mostra o rótulo amigável correto", () => {
    renderCard({ ...usuarioBase, perfil: "OPERADOR_COZINHA" });

    expect(screen.getByText("Operador de cozinha")).toBeInTheDocument();
  });

  it("mantém os botões de ação (Editar/Desativar/Alterar senha)", () => {
    renderCard(usuarioBase);

    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desativar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alterar senha" })).toBeInTheDocument();
  });

  it("cada campo (E-mail/Perfil/Restaurante) fica em seu próprio bloco, não numa linha combinada", () => {
    const { container } = renderCard(usuarioBase);

    const campos = container.querySelectorAll(".usuario-card__campo");
    expect(campos).toHaveLength(3);
    campos.forEach((campo) => {
      expect(campo.querySelector(".usuario-card__rotulo")).not.toBeNull();
      expect(campo.querySelector(".usuario-card__valor")).not.toBeNull();
    });
  });

  it("clicar em Desativar aciona onDesativar após confirmação", async () => {
    const onDesativar = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <UsuarioCard
        usuario={usuarioBase}
        restaurantes={[restauranteMock]}
        executando={false}
        erro={null}
        onEditar={vi.fn()}
        onAtivar={vi.fn()}
        onDesativar={onDesativar}
        onAlterarSenha={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Desativar" }));

    expect(onDesativar).toHaveBeenCalledWith(usuarioBase.id);
  });
});
