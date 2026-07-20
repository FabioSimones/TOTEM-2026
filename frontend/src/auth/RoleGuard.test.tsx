import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { LoginResponse, UsuarioAutenticadoResponse } from "../types/auth";
import { saveUserSession } from "../services/tokenStorage";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "./AuthProvider";
import { RoleGuard } from "./RoleGuard";

function usuarioComPerfil(perfil: UsuarioAutenticadoResponse["perfil"]): LoginResponse {
  return {
    accessToken: "access-usuario",
    refreshToken: "refresh-usuario",
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshExpiresIn: 604800,
    usuario: {
      id: 1,
      nome: "Usuário Teste",
      email: "usuario@totem.local",
      perfil,
      restauranteId: perfil === "SUPER_ADMIN" ? null : 1,
      ativo: true,
    },
  };
}

function renderComGuard(allowedRoles: UsuarioAutenticadoResponse["perfil"][]) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <RoleGuard allowedRoles={allowedRoles}>
          <p>Conteúdo restrito</p>
        </RoleGuard>
      </AuthProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("RoleGuard", () => {
  it("ADMIN_RESTAURANTE tentando acessar área exclusiva de SUPER_ADMIN vê mensagem de acesso negado", async () => {
    saveUserSession(usuarioComPerfil("ADMIN_RESTAURANTE"));

    renderComGuard(["SUPER_ADMIN"]);

    expect(await screen.findByText(/não tem permissão para acessar esta página/)).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo restrito")).not.toBeInTheDocument();
  });

  it("SUPER_ADMIN acessando área permitida vê o conteúdo normalmente", async () => {
    saveUserSession(usuarioComPerfil("SUPER_ADMIN"));

    renderComGuard(["SUPER_ADMIN"]);

    expect(await screen.findByText("Conteúdo restrito")).toBeInTheDocument();
  });

  it("sem usuário autenticado, também bloqueia (hasRole retorna false)", async () => {
    renderComGuard(["SUPER_ADMIN", "ADMIN_RESTAURANTE"]);

    expect(await screen.findByText(/não tem permissão para acessar esta página/)).toBeInTheDocument();
  });
});
