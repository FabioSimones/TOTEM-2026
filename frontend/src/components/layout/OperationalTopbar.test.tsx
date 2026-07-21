import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import type { DispositivoAutenticadoResponse, OperadorAutenticadoResponse } from "../../types/auth";
import { OperationalTopbar } from "./OperationalTopbar";

const dispositivo: DispositivoAutenticadoResponse = {
  id: 1,
  nome: "Caixa 01",
  codigoIdentificacao: "CAIXA-1",
  tipoDispositivo: "CAIXA",
  restauranteId: 1,
  ativo: true,
  ultimoAcesso: null,
};

const operador: OperadorAutenticadoResponse = {
  id: 9,
  nome: "Maria Operadora",
  email: "maria@totem.local",
  perfil: "OPERADOR_CAIXA",
  restauranteId: 1,
};

function renderTopbar(props: Partial<Parameters<typeof OperationalTopbar>[0]> = {}) {
  return render(
    <ThemeProvider>
      <OperationalTopbar
        modulo="Caixa"
        dispositivo={dispositivo}
        operador={operador}
        onTrocarOperador={vi.fn()}
        onTrocarDispositivo={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe("OperationalTopbar", () => {
  it("mostra o módulo, o dispositivo e o operador com perfil amigável", () => {
    renderTopbar();

    expect(screen.getByText("Caixa", { selector: ".operational-topbar__modulo" })).toBeInTheDocument();
    expect(screen.getByText("Caixa 01")).toBeInTheDocument();
    expect(screen.getByText("Maria Operadora")).toBeInTheDocument();
    expect(screen.getByText("Operador de caixa")).toBeInTheDocument();
    // Nunca o enum técnico cru na UI.
    expect(screen.queryByText("OPERADOR_CAIXA")).not.toBeInTheDocument();
  });

  it("mostra o perfil amigável de operador de cozinha", () => {
    renderTopbar({
      modulo: "Cozinha",
      operador: { ...operador, perfil: "OPERADOR_COZINHA" },
    });

    expect(screen.getByText("Operador de cozinha")).toBeInTheDocument();
  });

  it("aciona onTrocarOperador ao clicar em 'Trocar operador'", async () => {
    const onTrocarOperador = vi.fn();
    const user = userEvent.setup();
    renderTopbar({ onTrocarOperador });

    await user.click(screen.getByRole("button", { name: "Trocar operador" }));

    expect(onTrocarOperador).toHaveBeenCalledTimes(1);
  });

  it("aciona onTrocarDispositivo ao clicar em 'Trocar dispositivo'", async () => {
    const onTrocarDispositivo = vi.fn();
    const user = userEvent.setup();
    renderTopbar({ onTrocarDispositivo });

    await user.click(screen.getByRole("button", { name: "Trocar dispositivo" }));

    expect(onTrocarDispositivo).toHaveBeenCalledTimes(1);
  });

  it("o ThemeToggle continua alternando o tema", async () => {
    const user = userEvent.setup();
    renderTopbar();

    const botaoTema = screen.getByRole("button", { name: /Alternar para modo/ });
    const temaAntes = document.documentElement.getAttribute("data-theme");
    await user.click(botaoTema);

    expect(document.documentElement.getAttribute("data-theme")).not.toBe(temaAntes);
  });
});

describe("OperationalTopbar sem operador (TASK-119.2)", () => {
  it("mostra módulo, dispositivo, ThemeToggle e 'Trocar dispositivo'", () => {
    renderTopbar({ operador: null, onTrocarOperador: undefined });

    expect(screen.getByText("Caixa", { selector: ".operational-topbar__modulo" })).toBeInTheDocument();
    expect(screen.getByText("Caixa 01")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Alternar para modo/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trocar dispositivo" })).toBeInTheDocument();
  });

  it("não mostra avatar, nome/perfil do operador nem o botão 'Trocar operador'", () => {
    renderTopbar({ operador: null, onTrocarOperador: undefined });

    expect(screen.queryByText("Maria Operadora")).not.toBeInTheDocument();
    expect(screen.queryByText("Operador de caixa")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Trocar operador" })).not.toBeInTheDocument();
  });

  it("'Trocar dispositivo' continua acionando onTrocarDispositivo sem operador", async () => {
    const onTrocarDispositivo = vi.fn();
    const user = userEvent.setup();
    renderTopbar({ operador: null, onTrocarOperador: undefined, onTrocarDispositivo });

    await user.click(screen.getByRole("button", { name: "Trocar dispositivo" }));

    expect(onTrocarDispositivo).toHaveBeenCalledTimes(1);
  });
});
