import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, beforeEach } from "vitest";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../auth/AuthProvider";
import { AppRoutes } from "./AppRoutes";

function renderRota(rotaInicial: string) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[rotaInicial]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("AppRoutes — TASK-117 (entrada padrão pela ativação de dispositivo)", () => {
  it("/ redireciona para /ativar-dispositivo", async () => {
    renderRota("/");

    expect(await screen.findByRole("heading", { name: "Ativar Dispositivo" })).toBeInTheDocument();
  });

  it("/login continua acessível diretamente e mostra o formulário de login central", async () => {
    renderRota("/login");

    expect(await screen.findByRole("heading", { name: "Acesse sua conta" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("/admin/login continua redirecionando para /login (compatibilidade)", async () => {
    renderRota("/admin/login");

    expect(await screen.findByRole("heading", { name: "Acesse sua conta" })).toBeInTheDocument();
  });
});
