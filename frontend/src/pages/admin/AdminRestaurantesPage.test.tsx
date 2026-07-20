import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RestauranteAdminResponse } from "../../types/restaurante";
import type { UsuarioAutenticadoResponse } from "../../types/auth";
import { ApiError } from "../../types/api";
import { saveUserSession } from "../../services/tokenStorage";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { AuthProvider } from "../../auth/AuthProvider";
import { AdminRestaurantesPage } from "./AdminRestaurantesPage";

const {
  listarRestaurantesMock,
  criarRestauranteMock,
  atualizarRestauranteMock,
  ativarRestauranteMock,
  desativarRestauranteMock,
} = vi.hoisted(() => ({
  listarRestaurantesMock: vi.fn(),
  criarRestauranteMock: vi.fn(),
  atualizarRestauranteMock: vi.fn(),
  ativarRestauranteMock: vi.fn(),
  desativarRestauranteMock: vi.fn(),
}));

vi.mock("../../services/adminRestauranteService", () => ({
  listarRestaurantes: listarRestaurantesMock,
  criarRestaurante: criarRestauranteMock,
  atualizarRestaurante: atualizarRestauranteMock,
  ativarRestaurante: ativarRestauranteMock,
  desativarRestaurante: desativarRestauranteMock,
}));

const superAdmin: UsuarioAutenticadoResponse = {
  id: 1,
  nome: "Super Admin",
  email: "admin@totem.local",
  perfil: "SUPER_ADMIN",
  restauranteId: null,
  ativo: true,
};

const restauranteExistente: RestauranteAdminResponse = {
  id: 10,
  nome: "Totem Burger",
  cnpj: "12345678000199",
  endereco: null,
  ativo: true,
  criadoEm: "2026-01-01T00:00:00Z",
  atualizadoEm: "2026-01-01T00:00:00Z",
};

function renderPagina() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AuthProvider>
          <AdminRestaurantesPage />
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  saveUserSession({
    accessToken: "token-teste",
    refreshToken: "refresh-teste",
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshExpiresIn: 604800,
    usuario: superAdmin,
  });
  listarRestaurantesMock.mockResolvedValue([restauranteExistente]);
});

describe("AdminRestaurantesPage", () => {
  it("mostra a lista sem formulário permanentemente visível", async () => {
    renderPagina();

    await waitFor(() => expect(screen.getByText("Totem Burger")).toBeInTheDocument());

    expect(screen.getByRole("button", { name: "Novo restaurante" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("abre o modal de cadastro ao clicar em 'Novo restaurante' e fecha ao cancelar", async () => {
    const user = userEvent.setup();
    renderPagina();
    await waitFor(() => expect(screen.getByText("Totem Burger")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Novo restaurante" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Cadastrar restaurante" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cadastra um restaurante, fecha o modal e atualiza a lista", async () => {
    const novoRestaurante: RestauranteAdminResponse = {
      id: 20,
      nome: "Novo Restaurante",
      cnpj: "98765432000188",
      endereco: null,
      ativo: true,
      criadoEm: "2026-01-01T00:00:00Z",
      atualizadoEm: "2026-01-01T00:00:00Z",
    };
    criarRestauranteMock.mockResolvedValue(novoRestaurante);
    listarRestaurantesMock
      .mockResolvedValueOnce([restauranteExistente])
      .mockResolvedValueOnce([restauranteExistente, novoRestaurante]);

    const user = userEvent.setup();
    renderPagina();
    await waitFor(() => expect(screen.getByText("Totem Burger")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Novo restaurante" }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Nome"), "Novo Restaurante");
    await user.type(within(dialog).getByLabelText("CNPJ"), "98765432000188");
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar restaurante" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(criarRestauranteMock).toHaveBeenCalledWith({ nome: "Novo Restaurante", cnpj: "98765432000188" });
    await waitFor(() => expect(screen.getByText("Novo Restaurante")).toBeInTheDocument());
  });

  it("abre o modal de edição preenchido com os dados do restaurante", async () => {
    const user = userEvent.setup();
    renderPagina();
    await waitFor(() => expect(screen.getByText("Totem Burger")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Editar" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Editar restaurante — Totem Burger" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Nome")).toHaveValue("Totem Burger");
    expect(within(dialog).getByLabelText("CNPJ")).toHaveValue("12345678000199");
  });

  it("submit vazio mantém o modal aberto e não chama o serviço de criação (TASK-115)", async () => {
    const user = userEvent.setup();
    renderPagina();
    await waitFor(() => expect(screen.getByText("Totem Burger")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Novo restaurante" }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Cadastrar restaurante" }));

    expect(await within(dialog).findByText("Informe o nome do restaurante.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(criarRestauranteMock).not.toHaveBeenCalled();
  });

  it("erro de campo estruturado da API aparece inline e mantém o modal aberto, sem mensagem global (TASK-115)", async () => {
    criarRestauranteMock.mockRejectedValue(
      new ApiError(400, "Dados inválidos", {
        timestamp: "2026-01-01T00:00:00Z",
        status: 400,
        error: "Bad Request",
        message: "Dados inválidos",
        path: "/api/admin/restaurantes",
        errors: [{ campo: "cnpj", mensagem: "já está em uso por outro restaurante" }],
      }),
    );

    const user = userEvent.setup();
    renderPagina();
    await waitFor(() => expect(screen.getByText("Totem Burger")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Novo restaurante" }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Nome"), "Novo Restaurante");
    await user.type(within(dialog).getByLabelText("CNPJ"), "98765432000188");
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar restaurante" }));

    expect(await within(dialog).findByText("já está em uso por outro restaurante")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Nome")).toHaveValue("Novo Restaurante");
    expect(screen.queryByText("Dados inválidos")).not.toBeInTheDocument();
  });

  it("reabrir o modal para criar após um erro anterior não mostra erros residuais (TASK-115)", async () => {
    criarRestauranteMock.mockRejectedValue(
      new ApiError(400, "Dados inválidos", {
        timestamp: "2026-01-01T00:00:00Z",
        status: 400,
        error: "Bad Request",
        message: "Dados inválidos",
        path: "/api/admin/restaurantes",
        errors: [{ campo: "cnpj", mensagem: "já está em uso por outro restaurante" }],
      }),
    );

    const user = userEvent.setup();
    renderPagina();
    await waitFor(() => expect(screen.getByText("Totem Burger")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Novo restaurante" }));
    let dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Nome"), "Novo Restaurante");
    await user.type(within(dialog).getByLabelText("CNPJ"), "98765432000188");
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar restaurante" }));
    expect(await within(dialog).findByText("já está em uso por outro restaurante")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Novo restaurante" }));
    dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText("já está em uso por outro restaurante")).not.toBeInTheDocument();
  });
});
