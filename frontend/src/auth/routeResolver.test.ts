import { beforeEach, describe, expect, it } from "vitest";
import type { DispositivoAutenticadoResponse, UsuarioAutenticadoResponse } from "../types/auth";
import { saveDeviceSession } from "../services/tokenStorage";
import { PerfilNaoConfiguradoError, resolveHomeRoute } from "./routeResolver";

function usuario(perfil: UsuarioAutenticadoResponse["perfil"]): UsuarioAutenticadoResponse {
  return {
    id: 1,
    nome: "Usuário Teste",
    email: "usuario@totem.local",
    perfil,
    restauranteId: perfil === "SUPER_ADMIN" ? null : 1,
    ativo: true,
  };
}

const dispositivoCaixa: DispositivoAutenticadoResponse = {
  id: 1,
  nome: "Caixa 1",
  codigoIdentificacao: "CAIXA-1",
  tipoDispositivo: "CAIXA",
  restauranteId: 1,
  ativo: true,
  ultimoAcesso: null,
};

const dispositivoCozinha: DispositivoAutenticadoResponse = {
  ...dispositivoCaixa,
  codigoIdentificacao: "COZINHA-1",
  tipoDispositivo: "COZINHA",
};

function ativarDispositivo(dispositivo: DispositivoAutenticadoResponse) {
  saveDeviceSession({
    accessToken: "access-dispositivo",
    refreshToken: "refresh-dispositivo",
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshExpiresIn: 604800,
    dispositivo,
  });
}

beforeEach(() => {
  localStorage.clear();
});

describe("resolveHomeRoute — SUPER_ADMIN e ADMIN_RESTAURANTE", () => {
  it("SUPER_ADMIN vai para /admin, sem exigir dispositivo", () => {
    expect(resolveHomeRoute(usuario("SUPER_ADMIN"))).toEqual({ kind: "route", path: "/admin" });
  });

  it("ADMIN_RESTAURANTE vai para /admin, sem exigir dispositivo", () => {
    expect(resolveHomeRoute(usuario("ADMIN_RESTAURANTE"))).toEqual({ kind: "route", path: "/admin" });
  });
});

describe("resolveHomeRoute — OPERADOR_CAIXA (TASK-116)", () => {
  it("sem dispositivo Caixa ativado neste navegador, retorna 'device-required' em vez de liberar /caixa", () => {
    const resultado = resolveHomeRoute(usuario("OPERADOR_CAIXA"));

    expect(resultado.kind).toBe("device-required");
    if (resultado.kind === "device-required") {
      expect(resultado.tipoDispositivo).toBe("CAIXA");
      expect(resultado.mensagem).toMatch(/dispositivo Caixa/);
    }
  });

  it("com dispositivo COZINHA ativado (tipo incompatível), continua retornando 'device-required' para CAIXA", () => {
    ativarDispositivo(dispositivoCozinha);

    const resultado = resolveHomeRoute(usuario("OPERADOR_CAIXA"));

    expect(resultado.kind).toBe("device-required");
  });

  it("com dispositivo Caixa compatível ativado, libera a rota /caixa", () => {
    ativarDispositivo(dispositivoCaixa);

    expect(resolveHomeRoute(usuario("OPERADOR_CAIXA"))).toEqual({ kind: "route", path: "/caixa" });
  });
});

describe("resolveHomeRoute — OPERADOR_COZINHA (TASK-116)", () => {
  it("sem dispositivo Cozinha ativado neste navegador, retorna 'device-required'", () => {
    const resultado = resolveHomeRoute(usuario("OPERADOR_COZINHA"));

    expect(resultado.kind).toBe("device-required");
    if (resultado.kind === "device-required") {
      expect(resultado.tipoDispositivo).toBe("COZINHA");
      expect(resultado.mensagem).toMatch(/dispositivo Cozinha/);
    }
  });

  it("com dispositivo Cozinha compatível ativado, libera a rota /cozinha", () => {
    ativarDispositivo(dispositivoCozinha);

    expect(resolveHomeRoute(usuario("OPERADOR_COZINHA"))).toEqual({ kind: "route", path: "/cozinha" });
  });
});

describe("resolveHomeRoute — perfil desconhecido", () => {
  it("lança PerfilNaoConfiguradoError em vez de redirecionar silenciosamente para /admin", () => {
    const usuarioComPerfilInvalido = {
      ...usuario("SUPER_ADMIN"),
      perfil: "PERFIL_INEXISTENTE" as UsuarioAutenticadoResponse["perfil"],
    };

    expect(() => resolveHomeRoute(usuarioComPerfilInvalido)).toThrow(PerfilNaoConfiguradoError);
  });
});
