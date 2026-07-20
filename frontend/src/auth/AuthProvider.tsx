import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { login as loginRequest, logout as logoutRequest } from "../services/authService";
import {
  clearUserSession,
  getStoredUsuario,
  getUserAccessToken,
  getUserRefreshToken,
  saveUserSession,
} from "../services/tokenStorage";
import type { LoginRequest, PerfilUsuario, UsuarioAutenticadoResponse } from "../types/auth";

export interface AuthContextValue {
  user: UsuarioAutenticadoResponse | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credenciais: LoginRequest) => Promise<UsuarioAutenticadoResponse>;
  logout: () => Promise<void>;
  restoreSession: () => void;
  hasRole: (perfisPermitidos: PerfilUsuario[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Estado reativo da sessão de usuário humano (SUPER_ADMIN, ADMIN_RESTAURANTE, operadores antes de
 * entrar em Caixa/Cozinha). Não gerencia sessão de dispositivo nem de operador — essas continuam
 * em `tokenStorage`/`useDispositivoOperacional`, propositalmente fora deste provider (auditoria,
 * seção 3.2: os três contextos não podem se misturar).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioAutenticadoResponse | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(() => {
    const token = getUserAccessToken();
    const usuarioSalvo = getStoredUsuario();

    // Combinação inconsistente (token sem dados do usuário, ou dados sem token) nunca é tratada
    // como sessão válida — a existência isolada do access token não basta (auditoria, seção 15).
    if (token && usuarioSalvo) {
      setAccessTokenState(token);
      setUser(usuarioSalvo);
    } else {
      if (token || usuarioSalvo) {
        clearUserSession();
      }
      setAccessTokenState(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (credenciais: LoginRequest) => {
    const response = await loginRequest(credenciais);
    saveUserSession(response);
    setAccessTokenState(response.accessToken);
    setUser(response.usuario);
    return response.usuario;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getUserRefreshToken();
    if (refreshToken) {
      try {
        await logoutRequest({ refreshToken });
      } catch {
        // Best-effort: mesmo se o backend falhar (ex.: token já expirado, rede indisponível), a
        // sessão local de usuário é sempre limpa — nunca deixa a UI presa em estado autenticado.
      }
    }
    clearUserSession();
    setAccessTokenState(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (perfisPermitidos: PerfilUsuario[]) => !!user && perfisPermitidos.includes(user.perfil),
    [user],
  );

  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    logout,
    restoreSession,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
