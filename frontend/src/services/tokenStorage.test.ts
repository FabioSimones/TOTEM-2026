import { beforeEach, describe, expect, it } from "vitest";
import type {
  AtivarDispositivoResponse,
  DispositivoAutenticadoResponse,
  LoginResponse,
  OperadorAutenticadoResponse,
  OperadorLoginResponse,
  UsuarioAutenticadoResponse,
} from "../types/auth";
import {
  clearOperadorSession,
  clearSession,
  getAccessToken,
  getOperador,
  getOperadorToken,
  getRefreshToken,
  getStoredDispositivo,
  getStoredUsuario,
  saveDeviceSession,
  saveOperadorSession,
  saveUserSession,
} from "./tokenStorage";

const usuario: UsuarioAutenticadoResponse = {
  id: 1,
  nome: "Admin",
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

const dispositivo: DispositivoAutenticadoResponse = {
  id: 10,
  nome: "Caixa 1",
  codigoIdentificacao: "CAIXA-01",
  tipoDispositivo: "CAIXA",
  restauranteId: 1,
  ativo: true,
  ultimoAcesso: null,
};

const dispositivoResponse: AtivarDispositivoResponse = {
  accessToken: "access-dispositivo",
  refreshToken: "refresh-dispositivo",
  tokenType: "Bearer",
  expiresIn: 3600,
  refreshExpiresIn: 604800,
  dispositivo,
};

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
});

describe("sessão de usuário", () => {
  it("saveUserSession salva accessToken, refreshToken e usuario", () => {
    saveUserSession(loginResponse);

    expect(getAccessToken()).toBe("access-usuario");
    expect(getRefreshToken()).toBe("refresh-usuario");
    expect(getStoredUsuario()).toEqual(usuario);
  });

  it("saveUserSession remove a sessão de dispositivo salva anteriormente", () => {
    saveDeviceSession(dispositivoResponse);
    expect(getStoredDispositivo()).not.toBeNull();

    saveUserSession(loginResponse);

    expect(getStoredDispositivo()).toBeNull();
  });

  it("saveUserSession não remove uma sessão de operador existente (comportamento atual de tokenStorage.ts)", () => {
    saveDeviceSession(dispositivoResponse);
    saveOperadorSession(operadorLoginResponse);

    saveUserSession(loginResponse);

    expect(getOperador()).toEqual(operador);
    expect(getOperadorToken()).toBe("operador-token");
  });
});

describe("sessão de dispositivo", () => {
  it("saveDeviceSession salva accessToken, refreshToken e dispositivo", () => {
    saveDeviceSession(dispositivoResponse);

    expect(getAccessToken()).toBe("access-dispositivo");
    expect(getRefreshToken()).toBe("refresh-dispositivo");
    expect(getStoredDispositivo()).toEqual(dispositivo);
  });

  it("saveDeviceSession remove a sessão de usuário salva anteriormente", () => {
    saveUserSession(loginResponse);
    expect(getStoredUsuario()).not.toBeNull();

    saveDeviceSession(dispositivoResponse);

    expect(getStoredUsuario()).toBeNull();
  });

  it("saveDeviceSession remove uma sessão de operador anterior (dispositivo recém-ativado não herda operador de outro terminal)", () => {
    saveDeviceSession(dispositivoResponse);
    saveOperadorSession(operadorLoginResponse);
    expect(getOperadorToken()).not.toBeNull();

    saveDeviceSession(dispositivoResponse);

    expect(getOperadorToken()).toBeNull();
    expect(getOperador()).toBeNull();
  });
});

describe("sessão de operador", () => {
  it("saveOperadorSession salva operadorToken e operador", () => {
    saveOperadorSession(operadorLoginResponse);

    expect(getOperadorToken()).toBe("operador-token");
    expect(getOperador()).toEqual(operador);
  });

  it("clearOperadorSession remove apenas o operador, sem afetar accessToken/refreshToken/dispositivo", () => {
    saveDeviceSession(dispositivoResponse);
    saveOperadorSession(operadorLoginResponse);

    clearOperadorSession();

    expect(getOperadorToken()).toBeNull();
    expect(getOperador()).toBeNull();
    expect(getAccessToken()).toBe("access-dispositivo");
    expect(getRefreshToken()).toBe("refresh-dispositivo");
    expect(getStoredDispositivo()).toEqual(dispositivo);
  });
});

describe("limpeza completa", () => {
  it("clearSession limpa tokens, dispositivo, usuário e operador", () => {
    saveDeviceSession(dispositivoResponse);
    saveOperadorSession(operadorLoginResponse);

    clearSession();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getStoredDispositivo()).toBeNull();
    expect(getStoredUsuario()).toBeNull();
    expect(getOperadorToken()).toBeNull();
    expect(getOperador()).toBeNull();
  });

  it("JSON inválido em totem.usuario/totem.dispositivo/totem.operador não quebra a leitura (retorna null)", () => {
    localStorage.setItem("totem.usuario", "{isso não é json");
    localStorage.setItem("totem.dispositivo", "{isso não é json");
    localStorage.setItem("totem.operador", "{isso não é json");

    expect(getStoredUsuario()).toBeNull();
    expect(getStoredDispositivo()).toBeNull();
    expect(getOperador()).toBeNull();
  });
});
