import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OperadorAutenticadoResponse, OperadorLoginResponse } from "../../types/auth";
import { getOperador, getOperadorToken } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
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

const TITULO = "Identifique-se para acessar o Caixa";
const DESCRICAO = "Entre com suas credenciais de operador para acessar os pedidos deste dispositivo.";

beforeEach(() => {
  localStorage.clear();
  loginOperadorMock.mockReset();
});

describe("OperadorPainel (TASK-119.2 — título/descrição próprios, sem ação de dispositivo)", () => {
  it("mostra o título como h1, a descrição, e o formulário de identificação", () => {
    render(<OperadorPainel titulo={TITULO} descricao={DESCRICAO} onIdentificado={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: TITULO })).toBeInTheDocument();
    expect(screen.getByText(DESCRICAO)).toBeInTheDocument();
    expect(screen.getByLabelText("Email do operador")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Identificar operador" })).toBeInTheDocument();
  });

  it("não exibe o texto genérico antigo 'Operador não identificado'", () => {
    render(<OperadorPainel titulo={TITULO} onIdentificado={vi.fn()} />);

    expect(screen.queryByText(/Operador não identificado/)).not.toBeInTheDocument();
  });

  it("não renderiza nenhuma ação de 'Trocar dispositivo' (responsabilidade exclusiva da topbar)", () => {
    render(<OperadorPainel titulo={TITULO} onIdentificado={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Trocar dispositivo" })).not.toBeInTheDocument();
  });

  it("o campo de e-mail recebe foco automaticamente", () => {
    render(<OperadorPainel titulo={TITULO} onIdentificado={vi.fn()} />);

    expect(screen.getByLabelText("Email do operador")).toHaveFocus();
  });

  it("descrição é opcional — sem ela, só título e formulário aparecem", () => {
    render(<OperadorPainel titulo={TITULO} onIdentificado={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: TITULO })).toBeInTheDocument();
    expect(screen.getByLabelText("Email do operador")).toBeInTheDocument();
  });

  it("ao preencher e submeter, chama loginOperador e o callback onIdentificado com a resposta", async () => {
    loginOperadorMock.mockResolvedValue(operadorLoginResponse);
    const onIdentificado = vi.fn();
    const user = userEvent.setup();

    render(<OperadorPainel titulo={TITULO} onIdentificado={onIdentificado} />);

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
    render(<OperadorPainel titulo={TITULO} onIdentificado={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Identificar operador" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe email e senha.");
    expect(loginOperadorMock).not.toHaveBeenCalled();
  });

  it("erro de credencial inválida aparece dentro do formulário, sem limpar os campos", async () => {
    loginOperadorMock.mockRejectedValue(new ApiError(401, "Unauthorized"));
    const user = userEvent.setup();

    render(<OperadorPainel titulo={TITULO} onIdentificado={vi.fn()} />);

    await user.type(screen.getByLabelText("Email do operador"), "operador@totem.local");
    await user.type(screen.getByLabelText("Senha"), "senha-errada");
    await user.click(screen.getByRole("button", { name: "Identificar operador" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByLabelText("Email do operador")).toHaveValue("operador@totem.local");
  });

  it("desabilita os campos e mostra loading durante o envio", async () => {
    let resolverLogin: (value: OperadorLoginResponse) => void = () => {};
    loginOperadorMock.mockImplementation(
      () => new Promise<OperadorLoginResponse>((resolve) => { resolverLogin = resolve; }),
    );
    const user = userEvent.setup();

    render(<OperadorPainel titulo={TITULO} onIdentificado={vi.fn()} />);

    await user.type(screen.getByLabelText("Email do operador"), "operador@totem.local");
    await user.type(screen.getByLabelText("Senha"), "senha123");
    await user.click(screen.getByRole("button", { name: "Identificar operador" }));

    const botao = screen.getByRole("button", { name: "Aguarde..." });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Email do operador")).toBeDisabled();
    expect(screen.getByLabelText("Senha")).toBeDisabled();

    resolverLogin(operadorLoginResponse);
  });
});
