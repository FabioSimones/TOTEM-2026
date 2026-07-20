import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DispositivoAutenticadoResponse } from "../../types/auth";
import { getDeviceAccessToken, getStoredDispositivo, saveDeviceSession } from "../../services/tokenStorage";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { TotemHomePage } from "./TotemHomePage";

const dispositivoTotemMock: DispositivoAutenticadoResponse = {
  id: 1,
  nome: "Totem Teste",
  codigoIdentificacao: "TOTEM-1",
  tipoDispositivo: "TOTEM",
  restauranteId: 1,
  ativo: true,
  ultimoAcesso: null,
};

const { buscarCardapioMock } = vi.hoisted(() => ({
  buscarCardapioMock: vi.fn(),
}));

vi.mock("../../services/totemService", () => ({
  buscarCardapio: buscarCardapioMock,
  consultarPedido: vi.fn(),
  criarPedido: vi.fn(),
  iniciarPagamento: vi.fn(),
}));

function renderPagina() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/totem"]}>
        <Routes>
          <Route path="/totem" element={<TotemHomePage />} />
          <Route path="/ativar-dispositivo" element={<p>Tela de ativação</p>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

function ativarSessaoDeDispositivo(dispositivo: DispositivoAutenticadoResponse = dispositivoTotemMock) {
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

/**
 * Auditoria de autenticação, achado corrigido: antes o guard de TotemHomePage só checava a
 * existência do accessToken, sem validar o tipo do dispositivo salvo — um dispositivo
 * CAIXA/COZINHA/ADMINISTRACAO ativado neste navegador passava por este guard e só falhava
 * depois, no 403 do backend.
 */
describe("TotemHomePage sem dispositivo ativado", () => {
  it("redireciona para /ativar-dispositivo e não busca o cardápio", async () => {
    renderPagina();

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(buscarCardapioMock).not.toHaveBeenCalled();
  });
});

describe("TotemHomePage com dispositivo incompatível (TASK-116)", () => {
  it("dispositivo CAIXA: redireciona para /ativar-dispositivo e não busca o cardápio nem exibe o fluxo do Totem", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoTotemMock, tipoDispositivo: "CAIXA" });

    renderPagina();

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(screen.queryByText("Carregando cardápio...")).not.toBeInTheDocument();
    expect(buscarCardapioMock).not.toHaveBeenCalled();
  });

  it("dispositivo COZINHA: redireciona para /ativar-dispositivo e não busca o cardápio", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoTotemMock, tipoDispositivo: "COZINHA" });

    renderPagina();

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(buscarCardapioMock).not.toHaveBeenCalled();
  });

  it("dispositivo ADMINISTRACAO: redireciona para /ativar-dispositivo e não busca o cardápio", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoTotemMock, tipoDispositivo: "ADMINISTRACAO" });

    renderPagina();

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(buscarCardapioMock).not.toHaveBeenCalled();
  });
});

describe("TotemHomePage com dispositivo TOTEM compatível", () => {
  it("busca o cardápio normalmente", async () => {
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue({ categorias: [] });

    renderPagina();

    expect(await screen.findByText("Nenhum produto disponível no momento.")).toBeInTheDocument();
    expect(buscarCardapioMock).toHaveBeenCalledTimes(1);
    expect(getDeviceAccessToken()).toBe("device-token-teste");
    expect(getStoredDispositivo()?.tipoDispositivo).toBe("TOTEM");
  });
});
