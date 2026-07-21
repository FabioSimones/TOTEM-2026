import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTotemSidebarCollapsed } from "./useTotemSidebarCollapsed";

const KEY = "totem.totem.sidebarCollapsed";

beforeEach(() => {
  localStorage.clear();
});

describe("useTotemSidebarCollapsed", () => {
  it("inicia expandida (false) quando não há preferência salva", () => {
    const { result } = renderHook(() => useTotemSidebarCollapsed());
    expect(result.current[0]).toBe(false);
  });

  it("persiste o valor em localStorage sob chave própria, distinta de tema/autenticação/admin", () => {
    const { result } = renderHook(() => useTotemSidebarCollapsed());

    act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem(KEY)).toBe("true");
    expect(localStorage.getItem("totem.theme")).toBeNull();
    expect(localStorage.getItem("totem.admin.sidebarCollapsed")).toBeNull();
    expect(localStorage.getItem("totem.device.accessToken")).toBeNull();
  });

  it("restaura a preferência salva (recolhida) num novo hook, simulando remount", () => {
    localStorage.setItem(KEY, "true");

    const { result } = renderHook(() => useTotemSidebarCollapsed());

    expect(result.current[0]).toBe(true);
  });

  it("valor inválido salvo é ignorado (cai no padrão seguro: expandida)", () => {
    localStorage.setItem(KEY, "isso-nao-e-booleano");

    const { result } = renderHook(() => useTotemSidebarCollapsed());

    expect(result.current[0]).toBe(false);
  });
});
