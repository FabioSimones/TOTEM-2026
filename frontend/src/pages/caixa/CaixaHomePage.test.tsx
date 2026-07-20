import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DispositivoAutenticadoResponse, OperadorLoginResponse } from "../../types/auth";
import type { PedidoPendenteCaixaResponse } from "../../types/caixa";
import { getOperadorToken, getStoredDispositivo, saveDeviceSession } from "../../services/tokenStorage";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { CaixaHomePage } from "./CaixaHomePage";

const dispositivoCaixaMock: DispositivoAutenticadoResponse = {
  id: 1,
  nome: "Caixa Teste",
  codigoIdentificacao: "CAIXA-1",
  tipoDispositivo: "CAIXA",
  restauranteId: 1,
  ativo: true,
  ultimoAcesso: null,
};

const { listarPendenciasMock, loginOperadorMock } = vi.hoisted(() => ({
  listarPendenciasMock: vi.fn(),
  loginOperadorMock: vi.fn(),
}));

vi.mock("../../services/caixaService", () => ({
  listarPendencias: listarPendenciasMock,
  confirmarPagamentoDinheiro: vi.fn(),
  enviarPedidoParaCozinha: vi.fn(),
  marcarPedidoComoRetirado: vi.fn(),
  cancelarPedido: vi.fn(),
}));

vi.mock("../../services/authService", () => ({
  loginOperador: loginOperadorMock,
}));

const operadorCaixaMock = {
  id: 9,
  nome: "Operador Caixa Teste",
  email: "operador.caixa@totem.local",
  perfil: "OPERADOR_CAIXA" as const,
  restauranteId: 1,
};

const operadorLoginResponse: OperadorLoginResponse = {
  operadorToken: "operador-token-teste",
  expiresIn: 1800,
  operador: operadorCaixaMock,
};

const pedidoMock: PedidoPendenteCaixaResponse = {
  pedidoId: 1,
  numeroPedido: "A1",
  statusPedido: "PAGO",
  tipoConsumo: "LOCAL",
  clienteNome: "Cliente Teste",
  valorTotal: 25.9,
  criadoEm: "2026-01-01T12:00:00Z",
  atualizadoEm: "2026-01-01T12:00:00Z",
  acaoSugerida: "ENVIAR_PARA_COZINHA",
  itens: [{ produtoId: 100, nomeProduto: "X-Burger", quantidade: 1, observacao: null, subtotal: 25.9 }],
};

function renderPagina() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/caixa"]}>
        <Routes>
          <Route path="/caixa" element={<CaixaHomePage />} />
          <Route path="/ativar-dispositivo" element={<p>Tela de ativação</p>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

function ativarSessaoDeDispositivo(dispositivo: DispositivoAutenticadoResponse = dispositivoCaixaMock) {
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

describe("CaixaHomePage sem dispositivo ativado (TASK-112)", () => {
  it("mostra o card de ativação e não busca pendências nem tenta login de operador", async () => {
    renderPagina();

    expect(await screen.findByText("Caixa não ativado")).toBeInTheDocument();
    expect(screen.getByText(/ainda não foi ativado/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Email do operador")).not.toBeInTheDocument();
    expect(listarPendenciasMock).not.toHaveBeenCalled();
  });

  it("'Ativar este dispositivo' navega para /ativar-dispositivo", async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(await screen.findByRole("button", { name: "Ativar este dispositivo" }));

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
  });
});

describe("CaixaHomePage com dispositivo de outro tipo (TASK-112)", () => {
  it("mostra incompatibilidade citando o tipo atual, com ação 'Trocar dispositivo'", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoCaixaMock, tipoDispositivo: "COZINHA" });
    renderPagina();

    expect(await screen.findByText("Dispositivo incompatível")).toBeInTheDocument();
    expect(screen.getByText(/ativado como Cozinha, não como Caixa/)).toBeInTheDocument();
    expect(listarPendenciasMock).not.toHaveBeenCalled();
  });

  it("'Trocar dispositivo' pede confirmação, limpa a sessão e navega para /ativar-dispositivo", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoCaixaMock, tipoDispositivo: "COZINHA" });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderPagina();

    await user.click(await screen.findByRole("button", { name: "Trocar dispositivo" }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(getStoredDispositivo()).toBeNull();
  });

  it("cancelar a confirmação preserva a sessão do dispositivo", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoCaixaMock, tipoDispositivo: "COZINHA" });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderPagina();

    await user.click(await screen.findByRole("button", { name: "Trocar dispositivo" }));

    expect(screen.getByText("Dispositivo incompatível")).toBeInTheDocument();
    expect(getStoredDispositivo()).not.toBeNull();
  });
});

describe("CaixaHomePage sem operador identificado", () => {
  it("mostra somente o login centralizado, com ação 'Trocar dispositivo', e não busca pendências", async () => {
    ativarSessaoDeDispositivo();
    renderPagina();

    expect(await screen.findByText(/Operador não identificado/)).toBeInTheDocument();
    expect(screen.getByText("Identifique-se para acessar o Caixa.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Atualizar lista" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trocar dispositivo" })).toBeInTheDocument();
    expect(listarPendenciasMock).not.toHaveBeenCalled();
  });
});

describe("CaixaHomePage com operador identificado", () => {
  it("faz login do operador e carrega a lista de pendências", async () => {
    ativarSessaoDeDispositivo();
    listarPendenciasMock.mockResolvedValue([pedidoMock]);
    loginOperadorMock.mockResolvedValue(operadorLoginResponse);
    const user = userEvent.setup();

    renderPagina();
    await screen.findByLabelText("Email do operador");

    await user.type(screen.getByLabelText("Email do operador"), operadorCaixaMock.email);
    await user.type(screen.getByLabelText("Senha"), "senha-qualquer");
    await user.click(screen.getByRole("button", { name: "Identificar operador" }));

    await waitFor(() => expect(listarPendenciasMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("A1")).toBeInTheDocument();
    expect(screen.getByText(`Operador: ${operadorCaixaMock.nome}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trocar dispositivo" })).toBeInTheDocument();
  });

  it("ao trocar operador, oculta a lista imediatamente e volta ao login", async () => {
    ativarSessaoDeDispositivo();
    listarPendenciasMock.mockResolvedValue([pedidoMock]);
    loginOperadorMock.mockResolvedValue(operadorLoginResponse);
    const user = userEvent.setup();

    renderPagina();
    await user.type(await screen.findByLabelText("Email do operador"), operadorCaixaMock.email);
    await user.type(screen.getByLabelText("Senha"), "senha-qualquer");
    await user.click(screen.getByRole("button", { name: "Identificar operador" }));
    await screen.findByText("A1");

    await user.click(screen.getByRole("button", { name: "Trocar operador" }));

    expect(screen.queryByText("A1")).not.toBeInTheDocument();
    expect(await screen.findByText(/Operador não identificado/)).toBeInTheDocument();
  });

  it("'Trocar dispositivo' confirmado limpa operador e dispositivo e navega para a ativação", async () => {
    ativarSessaoDeDispositivo();
    listarPendenciasMock.mockResolvedValue([pedidoMock]);
    loginOperadorMock.mockResolvedValue(operadorLoginResponse);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    renderPagina();
    await user.type(await screen.findByLabelText("Email do operador"), operadorCaixaMock.email);
    await user.type(screen.getByLabelText("Senha"), "senha-qualquer");
    await user.click(screen.getByRole("button", { name: "Identificar operador" }));
    await screen.findByText("A1");

    await user.click(screen.getByRole("button", { name: "Trocar dispositivo" }));

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(getStoredDispositivo()).toBeNull();
    expect(getOperadorToken()).toBeNull();
  });
});
