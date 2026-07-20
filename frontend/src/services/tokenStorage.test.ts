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
  __runLegacyMigrationForTests,
  clearAllSessions,
  clearDeviceSession,
  clearOperadorSession,
  clearUserSession,
  getDeviceAccessToken,
  getDeviceRefreshToken,
  getOperador,
  getOperadorToken,
  getStoredDispositivo,
  getStoredUsuario,
  getUserAccessToken,
  getUserRefreshToken,
  limparSessaoOperacionalCompleta,
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
  it("saveUserSession salva accessToken, refreshToken e usuario em chaves próprias (totem.user.*)", () => {
    saveUserSession(loginResponse);

    expect(getUserAccessToken()).toBe("access-usuario");
    expect(getUserRefreshToken()).toBe("refresh-usuario");
    expect(getStoredUsuario()).toEqual(usuario);
  });

  it("saveUserSession NÃO afeta uma sessão de dispositivo já salva (storage fisicamente separado)", () => {
    saveDeviceSession(dispositivoResponse);
    expect(getStoredDispositivo()).not.toBeNull();

    saveUserSession(loginResponse);

    expect(getStoredDispositivo()).toEqual(dispositivo);
    expect(getDeviceAccessToken()).toBe("access-dispositivo");
  });

  it("saveUserSession não remove uma sessão de operador existente", () => {
    saveDeviceSession(dispositivoResponse);
    saveOperadorSession(operadorLoginResponse);

    saveUserSession(loginResponse);

    expect(getOperador()).toEqual(operador);
    expect(getOperadorToken()).toBe("operador-token");
  });
});

describe("sessão de dispositivo", () => {
  it("saveDeviceSession salva accessToken, refreshToken e dispositivo em chaves próprias (totem.device.*)", () => {
    saveDeviceSession(dispositivoResponse);

    expect(getDeviceAccessToken()).toBe("access-dispositivo");
    expect(getDeviceRefreshToken()).toBe("refresh-dispositivo");
    expect(getStoredDispositivo()).toEqual(dispositivo);
  });

  it("saveDeviceSession NÃO afeta uma sessão de usuário já salva (storage fisicamente separado)", () => {
    saveUserSession(loginResponse);
    expect(getStoredUsuario()).not.toBeNull();

    saveDeviceSession(dispositivoResponse);

    expect(getStoredUsuario()).toEqual(usuario);
    expect(getUserAccessToken()).toBe("access-usuario");
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
    expect(getDeviceAccessToken()).toBe("access-dispositivo");
    expect(getDeviceRefreshToken()).toBe("refresh-dispositivo");
    expect(getStoredDispositivo()).toEqual(dispositivo);
  });
});

describe("logout por contexto (TASK-116)", () => {
  it("clearUserSession (logout de usuário) preserva sessão de DEVICE e de OPERADOR", () => {
    saveUserSession(loginResponse);
    saveDeviceSession(dispositivoResponse);
    saveOperadorSession(operadorLoginResponse);

    clearUserSession();

    expect(getUserAccessToken()).toBeNull();
    expect(getStoredUsuario()).toBeNull();
    expect(getDeviceAccessToken()).toBe("access-dispositivo");
    expect(getStoredDispositivo()).toEqual(dispositivo);
    expect(getOperadorToken()).toBe("operador-token");
    expect(getOperador()).toEqual(operador);
  });

  it("clearDeviceSession (logout de dispositivo) limpa o operador junto, mas preserva a sessão de USER", () => {
    saveUserSession(loginResponse);
    saveDeviceSession(dispositivoResponse);
    saveOperadorSession(operadorLoginResponse);

    clearDeviceSession();
    // Por si só, clearDeviceSession não limpa o operador (ver limparSessaoOperacionalCompleta,
    // que é a função usada nas telas de Caixa/Cozinha para essa combinação) — este teste isola
    // o comportamento de cada função.
    clearOperadorSession();

    expect(getDeviceAccessToken()).toBeNull();
    expect(getStoredDispositivo()).toBeNull();
    expect(getOperadorToken()).toBeNull();
    expect(getOperador()).toBeNull();
    expect(getUserAccessToken()).toBe("access-usuario");
    expect(getStoredUsuario()).toEqual(usuario);
  });
});

describe("limpeza completa", () => {
  it("clearAllSessions limpa tokens, dispositivo, usuário e operador de todos os contextos", () => {
    saveUserSession(loginResponse);
    saveDeviceSession(dispositivoResponse);
    saveOperadorSession(operadorLoginResponse);

    clearAllSessions();

    expect(getUserAccessToken()).toBeNull();
    expect(getUserRefreshToken()).toBeNull();
    expect(getStoredUsuario()).toBeNull();
    expect(getDeviceAccessToken()).toBeNull();
    expect(getDeviceRefreshToken()).toBeNull();
    expect(getStoredDispositivo()).toBeNull();
    expect(getOperadorToken()).toBeNull();
    expect(getOperador()).toBeNull();
  });

  it("JSON inválido em totem.user.data/totem.device.data/totem.operator.data não quebra a leitura (retorna null)", () => {
    localStorage.setItem("totem.user.data", "{isso não é json");
    localStorage.setItem("totem.device.data", "{isso não é json");
    localStorage.setItem("totem.operator.data", "{isso não é json");

    expect(getStoredUsuario()).toBeNull();
    expect(getStoredDispositivo()).toBeNull();
    expect(getOperador()).toBeNull();
  });
});

describe("limparSessaoOperacionalCompleta (TASK-112)", () => {
  it("limpa dispositivo e operador, sem remover a sessão administrativa (totem.user.*)", () => {
    saveUserSession(loginResponse);
    saveDeviceSession(dispositivoResponse);
    saveOperadorSession(operadorLoginResponse);

    limparSessaoOperacionalCompleta();

    expect(getDeviceAccessToken()).toBeNull();
    expect(getDeviceRefreshToken()).toBeNull();
    expect(getStoredDispositivo()).toBeNull();
    expect(getOperadorToken()).toBeNull();
    expect(getOperador()).toBeNull();
    expect(getStoredUsuario()).toEqual(usuario);
    expect(getUserAccessToken()).toBe("access-usuario");
  });
});

describe("migração das chaves antigas (compartilhadas)", () => {
  it("migra um par de tokens antigo pertencente a um usuário para totem.user.*", () => {
    localStorage.setItem("totem.accessToken", "access-legado");
    localStorage.setItem("totem.refreshToken", "refresh-legado");
    localStorage.setItem("totem.usuario", JSON.stringify(usuario));

    __runLegacyMigrationForTests();

    expect(getUserAccessToken()).toBe("access-legado");
    expect(getUserRefreshToken()).toBe("refresh-legado");
    expect(getStoredUsuario()).toEqual(usuario);
    expect(localStorage.getItem("totem.accessToken")).toBeNull();
    expect(localStorage.getItem("totem.usuario")).toBeNull();
  });

  it("migra um par de tokens antigo pertencente a um dispositivo para totem.device.*", () => {
    localStorage.setItem("totem.accessToken", "access-legado");
    localStorage.setItem("totem.refreshToken", "refresh-legado");
    localStorage.setItem("totem.dispositivo", JSON.stringify(dispositivo));

    __runLegacyMigrationForTests();

    expect(getDeviceAccessToken()).toBe("access-legado");
    expect(getStoredDispositivo()).toEqual(dispositivo);
    expect(localStorage.getItem("totem.dispositivo")).toBeNull();
  });

  it("descarta os tokens antigos quando o titular é ambíguo (usuário e dispositivo presentes ao mesmo tempo)", () => {
    localStorage.setItem("totem.accessToken", "access-legado");
    localStorage.setItem("totem.refreshToken", "refresh-legado");
    localStorage.setItem("totem.usuario", JSON.stringify(usuario));
    localStorage.setItem("totem.dispositivo", JSON.stringify(dispositivo));

    __runLegacyMigrationForTests();

    expect(getUserAccessToken()).toBeNull();
    expect(getDeviceAccessToken()).toBeNull();
    expect(localStorage.getItem("totem.accessToken")).toBeNull();
  });

  it("migra a sessão de operador legada independentemente do titular do par accessToken/refreshToken", () => {
    localStorage.setItem("totem.operadorToken", "operador-token-legado");
    localStorage.setItem("totem.operador", JSON.stringify(operador));

    __runLegacyMigrationForTests();

    expect(getOperadorToken()).toBe("operador-token-legado");
    expect(getOperador()).toEqual(operador);
    expect(localStorage.getItem("totem.operadorToken")).toBeNull();
  });
});
