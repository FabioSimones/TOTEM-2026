import { describe, expect, it } from "vitest";
import type { UsuarioAutenticadoResponse } from "../types/auth";
import type { RestauranteAdminResponse } from "../types/restaurante";
import {
  filtrarRestaurantesPorEscopo,
  getRestauranteIdEscopo,
  isAdminRestaurante,
  isOperador,
  isSuperAdmin,
} from "./adminScope";

function usuario(perfil: UsuarioAutenticadoResponse["perfil"], restauranteId: number | null): UsuarioAutenticadoResponse {
  return { id: 1, nome: "Teste", email: "teste@totem.local", perfil, restauranteId, ativo: true };
}

describe("reconhecimento de perfil", () => {
  it("isSuperAdmin reconhece SUPER_ADMIN e rejeita os demais", () => {
    expect(isSuperAdmin(usuario("SUPER_ADMIN", null))).toBe(true);
    expect(isSuperAdmin(usuario("ADMIN_RESTAURANTE", 1))).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });

  it("isAdminRestaurante reconhece ADMIN_RESTAURANTE e rejeita os demais", () => {
    expect(isAdminRestaurante(usuario("ADMIN_RESTAURANTE", 1))).toBe(true);
    expect(isAdminRestaurante(usuario("SUPER_ADMIN", null))).toBe(false);
    expect(isAdminRestaurante(null)).toBe(false);
  });

  it("isOperador reconhece OPERADOR_CAIXA e OPERADOR_COZINHA, rejeita perfis administrativos", () => {
    expect(isOperador(usuario("OPERADOR_CAIXA", 1))).toBe(true);
    expect(isOperador(usuario("OPERADOR_COZINHA", 1))).toBe(true);
    expect(isOperador(usuario("SUPER_ADMIN", null))).toBe(false);
    expect(isOperador(usuario("ADMIN_RESTAURANTE", 1))).toBe(false);
    expect(isOperador(null)).toBe(false);
  });
});

describe("getRestauranteIdEscopo", () => {
  it("retorna null para SUPER_ADMIN (acesso global)", () => {
    expect(getRestauranteIdEscopo(usuario("SUPER_ADMIN", null))).toBeNull();
  });

  it("retorna null para usuário nulo", () => {
    expect(getRestauranteIdEscopo(null)).toBeNull();
  });

  it("retorna o restauranteId do usuário para ADMIN_RESTAURANTE", () => {
    expect(getRestauranteIdEscopo(usuario("ADMIN_RESTAURANTE", 7))).toBe(7);
  });
});

describe("filtrarRestaurantesPorEscopo", () => {
  const restaurantes: RestauranteAdminResponse[] = [
    { id: 1, nome: "Restaurante A", cnpj: "11111111111111", endereco: null, ativo: true, criadoEm: "2026-01-01T00:00:00Z", atualizadoEm: "2026-01-01T00:00:00Z" },
    { id: 2, nome: "Restaurante B", cnpj: "22222222222222", endereco: null, ativo: true, criadoEm: "2026-01-01T00:00:00Z", atualizadoEm: "2026-01-01T00:00:00Z" },
  ];

  it("SUPER_ADMIN vê todos os restaurantes", () => {
    expect(filtrarRestaurantesPorEscopo(restaurantes, usuario("SUPER_ADMIN", null))).toEqual(restaurantes);
  });

  it("usuário nulo vê todos os restaurantes (mesma regra de SUPER_ADMIN sem sessão)", () => {
    expect(filtrarRestaurantesPorEscopo(restaurantes, null)).toEqual(restaurantes);
  });

  it("ADMIN_RESTAURANTE só vê o próprio restaurante", () => {
    const resultado = filtrarRestaurantesPorEscopo(restaurantes, usuario("ADMIN_RESTAURANTE", 2));
    expect(resultado).toEqual([restaurantes[1]]);
  });
});
