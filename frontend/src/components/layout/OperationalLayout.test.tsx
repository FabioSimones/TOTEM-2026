import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import type { DispositivoAutenticadoResponse, OperadorAutenticadoResponse } from "../../types/auth";
import { OperationalLayout } from "./OperationalLayout";

const dispositivo: DispositivoAutenticadoResponse = {
  id: 1,
  nome: "Cozinha 01",
  codigoIdentificacao: "COZINHA-1",
  tipoDispositivo: "COZINHA",
  restauranteId: 1,
  ativo: true,
  ultimoAcesso: null,
};

const operador: OperadorAutenticadoResponse = {
  id: 10,
  nome: "João Cozinheiro",
  email: "joao@totem.local",
  perfil: "OPERADOR_COZINHA",
  restauranteId: 1,
};

describe("OperationalLayout", () => {
  it("renderiza a topbar (banner) e o conteúdo (main) com os dados recebidos", () => {
    render(
      <ThemeProvider>
        <OperationalLayout
          modulo="Cozinha"
          dispositivo={dispositivo}
          operador={operador}
          onTrocarOperador={vi.fn()}
          onTrocarDispositivo={vi.fn()}
        >
          <h1>Fila de preparo</h1>
        </OperationalLayout>
      </ThemeProvider>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Fila de preparo" })).toBeInTheDocument();
    expect(screen.getByText("Cozinha 01")).toBeInTheDocument();
    expect(screen.getByText("João Cozinheiro")).toBeInTheDocument();
  });

  it("não renderiza AdminSidebar nem nenhuma navegação lateral administrativa", () => {
    render(
      <ThemeProvider>
        <OperationalLayout
          modulo="Caixa"
          dispositivo={{ ...dispositivo, tipoDispositivo: "CAIXA" }}
          operador={{ ...operador, perfil: "OPERADOR_CAIXA" }}
          onTrocarOperador={vi.fn()}
          onTrocarDispositivo={vi.fn()}
        >
          <p>Conteúdo do Caixa</p>
        </OperationalLayout>
      </ThemeProvider>,
    );

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("TASK-119.2: monta a topbar mesmo sem operador (dispositivo pronto, login pendente)", () => {
    render(
      <ThemeProvider>
        <OperationalLayout
          modulo="Cozinha"
          dispositivo={dispositivo}
          operador={null}
          onTrocarDispositivo={vi.fn()}
        >
          <h1>Identifique-se para acessar a Cozinha</h1>
        </OperationalLayout>
      </ThemeProvider>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText("Cozinha 01")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Identifique-se para acessar a Cozinha" })).toBeInTheDocument();
    expect(screen.queryByText("João Cozinheiro")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Trocar operador" })).not.toBeInTheDocument();
  });
});
