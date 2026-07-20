import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoginResponse } from "../../types/auth";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { AuthProvider } from "../../auth/AuthProvider";
import { LoginPage } from "./LoginPage";

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock("../../services/authService", () => ({
  login: loginMock,
  logout: vi.fn(),
}));

const loginResponse: LoginResponse = {
  accessToken: "access-usuario",
  refreshToken: "refresh-usuario",
  tokenType: "Bearer",
  expiresIn: 3600,
  refreshExpiresIn: 604800,
  usuario: {
    id: 1,
    nome: "Super Admin",
    email: "admin@totem.local",
    perfil: "SUPER_ADMIN",
    restauranteId: null,
    ativo: true,
  },
};

/** Sonda: mostra o pathname atual, já que MemoryRouter não expõe URL de verdade nos testes. */
function DestinoProbe({ rotulo }: { rotulo: string }) {
  return <p>{rotulo}</p>;
}

function renderLoginPage(initialState?: unknown) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[{ pathname: "/login", state: initialState }]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<DestinoProbe rotulo="Destino: /admin (resolveHomeRoute)" />} />
            <Route
              path="/admin/dispositivos"
              element={<DestinoProbe rotulo="Destino: /admin/dispositivos (rota original)" />}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  );
}

async function autenticar() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("E-mail"), "admin@totem.local");
  await user.type(screen.getByLabelText("Senha"), "senha-qualquer");
  await user.click(screen.getByRole("button", { name: "Entrar" }));
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  loginMock.mockResolvedValue(loginResponse);
});

describe("LoginPage — preservação da rota originalmente solicitada (ProtectedRoute.state.from)", () => {
  it("com location.state.from apontando para uma rota interna, navega para ela após o login", async () => {
    renderLoginPage({ from: "/admin/dispositivos" });

    await autenticar();

    expect(await screen.findByText("Destino: /admin/dispositivos (rota original)")).toBeInTheDocument();
  });
});

describe("LoginPage — redesign visual (TASK-117)", () => {
  it("tem um único h1 ('Acesse sua conta'), sem link 'Esqueceu a senha?'", () => {
    renderLoginPage();

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Acesse sua conta");

    expect(screen.queryByText(/esqueceu a senha/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /esqueceu a senha/i })).not.toBeInTheDocument();
  });

  it("tem um link para /ativar-dispositivo, fora do fluxo de submit do formulário", () => {
    renderLoginPage();

    const link = screen.getByRole("link", { name: "Ativar um dispositivo" });
    expect(link).toHaveAttribute("href", "/ativar-dispositivo");
  });

  it("renderiza o conteúdo institucional (marca e recursos), sem citar perfis técnicos internos", () => {
    renderLoginPage();

    expect(screen.getByText("TotemFood")).toBeInTheDocument();
    expect(screen.getByText("Gestão de pedidos")).toBeInTheDocument();
    expect(screen.queryByText(/SUPER_ADMIN|ADMIN_RESTAURANTE|OPERADOR_CAIXA|OPERADOR_COZINHA/)).not.toBeInTheDocument();
  });

  it("os ícones decorativos de comida não têm papel interativo nem entram na navegação por Tab", () => {
    const { container } = renderLoginPage();

    const svgs = container.querySelectorAll(".food-icons svg");
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
    });
    expect(screen.queryByRole("button", { name: /hambúrguer|batata|bebida/i })).not.toBeInTheDocument();
  });
});

describe("LoginPage — proteção contra open redirect (TASK-116)", () => {
  it("location.state.from com URL externa (http://evil.com) é rejeitado; usa resolveHomeRoute em vez disso", async () => {
    renderLoginPage({ from: "http://evil.com" });

    await autenticar();

    expect(await screen.findByText("Destino: /admin (resolveHomeRoute)")).toBeInTheDocument();
  });

  it("location.state.from protocol-relative (//evil.com) é rejeitado; usa resolveHomeRoute em vez disso", async () => {
    renderLoginPage({ from: "//evil.com" });

    await autenticar();

    expect(await screen.findByText("Destino: /admin (resolveHomeRoute)")).toBeInTheDocument();
  });

  it("sem location.state.from, usa resolveHomeRoute normalmente", async () => {
    renderLoginPage(undefined);

    await autenticar();

    expect(await screen.findByText("Destino: /admin (resolveHomeRoute)")).toBeInTheDocument();
  });
});
