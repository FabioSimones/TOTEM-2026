import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DispositivoAutenticadoResponse, OperadorLoginResponse } from "../../types/auth";
import type { PedidoCozinhaResponse } from "../../types/cozinha";
import { getOperadorToken, getStoredDispositivo, saveDeviceSession } from "../../services/tokenStorage";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { CozinhaHomePage } from "./CozinhaHomePage";

const dispositivoCozinhaMock: DispositivoAutenticadoResponse = {
  id: 1,
  nome: "Cozinha Teste",
  codigoIdentificacao: "COZINHA-1",
  tipoDispositivo: "COZINHA",
  restauranteId: 1,
  ativo: true,
  ultimoAcesso: null,
};

const { listarPedidosCozinhaMock, loginOperadorMock } = vi.hoisted(() => ({
  listarPedidosCozinhaMock: vi.fn(),
  loginOperadorMock: vi.fn(),
}));

vi.mock("../../services/cozinhaService", () => ({
  listarPedidosCozinha: listarPedidosCozinhaMock,
  atualizarStatusPedidoCozinha: vi.fn(),
}));

vi.mock("../../services/authService", () => ({
  loginOperador: loginOperadorMock,
}));

const operadorCozinhaMock = {
  id: 10,
  nome: "Operador Cozinha Teste",
  email: "operador.cozinha@totem.local",
  perfil: "OPERADOR_COZINHA" as const,
  restauranteId: 1,
};

const operadorLoginResponse: OperadorLoginResponse = {
  operadorToken: "operador-token-teste",
  expiresIn: 1800,
  operador: operadorCozinhaMock,
};

const pedidoMock: PedidoCozinhaResponse = {
  pedidoId: 2,
  numeroPedido: "A2",
  statusPedido: "ENVIADO_PARA_COZINHA",
  tipoConsumo: "LOCAL",
  clienteNome: "Cliente Teste",
  criadoEm: "2026-01-01T12:00:00Z",
  atualizadoEm: "2026-01-01T12:00:00Z",
  itens: [{ produtoId: 100, nomeProduto: "X-Burger", quantidade: 1, observacao: null }],
};

function renderPagina() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/cozinha"]}>
        <Routes>
          <Route path="/cozinha" element={<CozinhaHomePage />} />
          <Route path="/ativar-dispositivo" element={<p>Tela de ativação</p>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

function ativarSessaoDeDispositivo(dispositivo: DispositivoAutenticadoResponse = dispositivoCozinhaMock) {
  saveDeviceSession({
    accessToken: "device-token-teste",
    refreshToken: "refresh-token-teste",
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshExpiresIn: 604800,
    dispositivo,
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("CozinhaHomePage sem dispositivo ativado (TASK-112)", () => {
  it("mostra o card de ativação e não busca a fila nem tenta login de operador", async () => {
    renderPagina();

    expect(await screen.findByText("Cozinha não ativada")).toBeInTheDocument();
    expect(screen.getByText(/ainda não foi ativado/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Email do operador")).not.toBeInTheDocument();
    expect(listarPedidosCozinhaMock).not.toHaveBeenCalled();
  });

  it("'Ativar este dispositivo' navega para /ativar-dispositivo", async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(await screen.findByRole("button", { name: "Ativar este dispositivo" }));

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
  });
});

describe("CozinhaHomePage com dispositivo de outro tipo (TASK-112)", () => {
  it("mostra incompatibilidade citando o tipo atual, com ação 'Trocar dispositivo'", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoCozinhaMock, tipoDispositivo: "CAIXA" });
    renderPagina();

    expect(await screen.findByText("Dispositivo incompatível")).toBeInTheDocument();
    expect(screen.getByText(/ativado como Caixa, não como Cozinha/)).toBeInTheDocument();
    expect(listarPedidosCozinhaMock).not.toHaveBeenCalled();
  });

  it("'Trocar dispositivo' pede confirmação, limpa a sessão e navega para /ativar-dispositivo", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoCozinhaMock, tipoDispositivo: "CAIXA" });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderPagina();

    await user.click(await screen.findByRole("button", { name: "Trocar dispositivo" }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(getStoredDispositivo()).toBeNull();
  });

  it("cancelar a confirmação preserva a sessão do dispositivo", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoCozinhaMock, tipoDispositivo: "CAIXA" });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderPagina();

    await user.click(await screen.findByRole("button", { name: "Trocar dispositivo" }));

    expect(screen.getByText("Dispositivo incompatível")).toBeInTheDocument();
    expect(getStoredDispositivo()).not.toBeNull();
  });
});

describe("CozinhaHomePage sem operador identificado (TASK-119.2)", () => {
  it("usa o OperationalLayout: topbar com dispositivo/ThemeToggle/Trocar dispositivo, e o formulário de login como conteúdo principal", async () => {
    ativarSessaoDeDispositivo();
    renderPagina();

    expect(await screen.findByRole("heading", { level: 1, name: "Identifique-se para acessar a Cozinha" })).toBeInTheDocument();
    expect(
      screen.getByText("Entre com suas credenciais de operador para acessar a fila de preparo."),
    ).toBeInTheDocument();
    expect(screen.getByText(dispositivoCozinhaMock.nome)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Alternar para modo/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trocar dispositivo" })).toBeInTheDocument();
    expect(listarPedidosCozinhaMock).not.toHaveBeenCalled();
  });

  it("não mostra avatar/perfil de operador nem o botão 'Trocar operador' antes do login", async () => {
    ativarSessaoDeDispositivo();
    renderPagina();

    await screen.findByLabelText("Email do operador");
    expect(screen.queryByRole("button", { name: "Trocar operador" })).not.toBeInTheDocument();
  });

  it("não há duplicação de 'Trocar dispositivo' entre topbar e formulário", async () => {
    ativarSessaoDeDispositivo();
    renderPagina();

    await screen.findByLabelText("Email do operador");
    expect(screen.getAllByRole("button", { name: "Trocar dispositivo" })).toHaveLength(1);
  });
});

describe("CozinhaHomePage com operador identificado", () => {
  it("faz login do operador e carrega a fila de pedidos, mantendo a mesma topbar", async () => {
    ativarSessaoDeDispositivo();
    listarPedidosCozinhaMock.mockResolvedValue([pedidoMock]);
    loginOperadorMock.mockResolvedValue(operadorLoginResponse);
    const user = userEvent.setup();

    renderPagina();
    await screen.findByLabelText("Email do operador");

    await user.type(screen.getByLabelText("Email do operador"), operadorCozinhaMock.email);
    await user.type(screen.getByLabelText("Senha"), "senha-qualquer");
    await user.click(screen.getByRole("button", { name: "Identificar operador" }));

    await waitFor(() => expect(listarPedidosCozinhaMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("A2")).toBeInTheDocument();
    expect(screen.getByText(operadorCozinhaMock.nome)).toBeInTheDocument();
    expect(screen.getByText("Operador de cozinha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trocar operador" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trocar dispositivo" })).toBeInTheDocument();
  });

  it("ao trocar operador, oculta a fila imediatamente e volta ao formulário de login (mesma topbar)", async () => {
    ativarSessaoDeDispositivo();
    listarPedidosCozinhaMock.mockResolvedValue([pedidoMock]);
    loginOperadorMock.mockResolvedValue(operadorLoginResponse);
    const user = userEvent.setup();

    renderPagina();
    await user.type(await screen.findByLabelText("Email do operador"), operadorCozinhaMock.email);
    await user.type(screen.getByLabelText("Senha"), "senha-qualquer");
    await user.click(screen.getByRole("button", { name: "Identificar operador" }));
    await screen.findByText("A2");

    await user.click(screen.getByRole("button", { name: "Trocar operador" }));

    expect(screen.queryByText("A2")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 1, name: "Identifique-se para acessar a Cozinha" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Trocar operador" })).not.toBeInTheDocument();
    expect(screen.getByText(dispositivoCozinhaMock.nome)).toBeInTheDocument();
  });

  it("'Trocar dispositivo' confirmado limpa operador e dispositivo e navega para a ativação", async () => {
    ativarSessaoDeDispositivo();
    listarPedidosCozinhaMock.mockResolvedValue([pedidoMock]);
    loginOperadorMock.mockResolvedValue(operadorLoginResponse);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    renderPagina();
    await user.type(await screen.findByLabelText("Email do operador"), operadorCozinhaMock.email);
    await user.type(screen.getByLabelText("Senha"), "senha-qualquer");
    await user.click(screen.getByRole("button", { name: "Identificar operador" }));
    await screen.findByText("A2");

    await user.click(screen.getByRole("button", { name: "Trocar dispositivo" }));

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(getStoredDispositivo()).toBeNull();
    expect(getOperadorToken()).toBeNull();
  });
});
