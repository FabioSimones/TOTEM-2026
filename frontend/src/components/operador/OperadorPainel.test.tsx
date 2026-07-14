import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OperadorAutenticadoResponse, OperadorLoginResponse } from "../../types/auth";
import { getOperador, getOperadorToken, saveOperadorSession } from "../../services/tokenStorage";
import { OperadorPainel } from "./OperadorPainel";

// vi.mock é hoistado para o topo do arquivo (antes dos imports) — a fábrica do mock só pode
// referenciar variáveis criadas com vi.hoisted, senão `loginOperadorMock` ainda não existiria
// no momento em que o import de "../../services/authService" é resolvido.
const { loginOperadorMock } = vi.hoisted(() => ({ loginOperadorMock: vi.fn() }));

vi.mock("../../services/authService", () => ({
  loginOperador: loginOperadorMock,
}));

const operador: OperadorAutenticadoResponse = {
  id: 5,
  nome: "Operador Caixa",
  email: "operador@totem.local",
  perfil: "OPERADOR_CAIXA",
  restauranteId: 1,
};

const operadorLoginResponse: OperadorLoginResponse = {
  operadorToken: "operador-token",
  expiresIn: 1800,
  operador,
};

beforeEach(() => {
  localStorage.clear();
  loginOperadorMock.mockReset();
});

describe("OperadorPainel sem operador identificado", () => {
  it("mostra o formulário de identificação com email, senha e botão de login", () => {
    render(<OperadorPainel operador={null} onIdentificado={vi.fn()} onTrocar={vi.fn()} />);

    expect(screen.getByText(/Operador não identificado/)).toBeInTheDocument();
    expect(screen.getByLabelText("Email do operador")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Identificar operador" })).toBeInTheDocument();
  });

  it("ao preencher e submeter, chama loginOperador e o callback onIdentificado com a resposta", async () => {
    loginOperadorMock.mockResolvedValue(operadorLoginResponse);
    const onIdentificado = vi.fn();
    const user = userEvent.setup();

    render(<OperadorPainel operador={null} onIdentificado={onIdentificado} onTrocar={vi.fn()} />);

    await user.type(screen.getByLabelText("Email do operador"), "operador@totem.local");
    await user.type(screen.getByLabelText("Senha"), "senha123");
    await user.click(screen.getByRole("button", { name: "Identificar operador" }));

    await waitFor(() => expect(onIdentificado).toHaveBeenCalledWith(operadorLoginResponse));
    expect(loginOperadorMock).toHaveBeenCalledWith("operador@totem.local", "senha123");
    // saveOperadorSession (chamada real, sem mock) deve ter persistido a sessão.
    expect(getOperadorToken()).toBe("operador-token");
    expect(getOperador()).toEqual(operador);
  });

  it("não chama loginOperador se email ou senha estiverem vazios", async () => {
    const user = userEvent.setup();
    render(<OperadorPainel operador={null} onIdentificado={vi.fn()} onTrocar={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Identificar operador" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe email e senha.");
    expect(loginOperadorMock).not.toHaveBeenCalled();
  });
});

describe("OperadorPainel com operador identificado", () => {
  it("mostra o nome do operador e o botão Trocar operador", () => {
    render(<OperadorPainel operador={operador} onIdentificado={vi.fn()} onTrocar={vi.fn()} />);

    expect(screen.getByText(`Operador: ${operador.nome}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trocar operador" })).toBeInTheDocument();
  });

  it("ao clicar em Trocar operador, limpa a sessão de operador e chama onTrocar", async () => {
    saveOperadorSession(operadorLoginResponse);
    const onTrocar = vi.fn();
    const user = userEvent.setup();

    render(<OperadorPainel operador={operador} onIdentificado={vi.fn()} onTrocar={onTrocar} />);

    await user.click(screen.getByRole("button", { name: "Trocar operador" }));

    expect(onTrocar).toHaveBeenCalledTimes(1);
    expect(getOperadorToken()).toBeNull();
    expect(getOperador()).toBeNull();
  });
});
