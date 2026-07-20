import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import type { LoginResponse, UsuarioAutenticadoResponse } from "../types/auth";
import { saveUserSession } from "../services/tokenStorage";
import { AuthProvider } from "./AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";

const usuario: UsuarioAutenticadoResponse = {
  id: 1,
  nome: "Super Admin",
  email: "admin@totem.local",
  perfil: "SUPER_ADMIN",
  restauranteId: null,
  ativo: true,
};

const loginResponse: LoginResponse = {
  accessToken: "access-usuario",
  refreshToken: "refresh-usuario",
  tokenType: "Bearer",
  expiresIn: 3600,
  refreshExpiresIn: 604800,
  usuario,
};

function LoginProbe() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "ausente";
  return <p>Login — origem: {from}</p>;
}

function renderComRota(rotaInicial: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[rotaInicial]}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route
            path="/admin/dispositivos"
            element={
              <ProtectedRoute>
                <p>Conteúdo protegido</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("ProtectedRoute", () => {
  it("sem sessão de usuário, redireciona para /login preservando a rota originalmente solicitada", async () => {
    renderComRota("/admin/dispositivos");

    expect(await screen.findByText("Login — origem: /admin/dispositivos")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });

  it("com sessão de usuário válida, renderiza o conteúdo protegido", async () => {
    saveUserSession(loginResponse);

    renderComRota("/admin/dispositivos");

    expect(await screen.findByText("Conteúdo protegido")).toBeInTheDocument();
  });
});
