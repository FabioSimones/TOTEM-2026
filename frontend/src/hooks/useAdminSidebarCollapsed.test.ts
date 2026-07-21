import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAdminSidebarCollapsed } from "./useAdminSidebarCollapsed";

const KEY = "totem.admin.sidebarCollapsed";

beforeEach(() => {
  localStorage.clear();
});

describe("useAdminSidebarCollapsed", () => {
  it("inicia expandida (false) quando não há preferência salva", () => {
    const { result } = renderHook(() => useAdminSidebarCollapsed());
    expect(result.current[0]).toBe(false);
  });

  it("persiste o valor em localStorage sob chave própria, distinta de tema/autenticação", () => {
    const { result } = renderHook(() => useAdminSidebarCollapsed());

    act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem(KEY)).toBe("true");
    expect(localStorage.getItem("totem.theme")).toBeNull();
    expect(localStorage.getItem("totem.user.accessToken")).toBeNull();
  });

  it("restaura a preferência salva (recolhida) num novo hook, simulando remount", () => {
    localStorage.setItem(KEY, "true");

    const { result } = renderHook(() => useAdminSidebarCollapsed());

    expect(result.current[0]).toBe(true);
  });

  it("valor inválido salvo é ignorado (cai no padrão seguro: expandida)", () => {
    localStorage.setItem(KEY, "isso-nao-e-booleano");

    const { result } = renderHook(() => useAdminSidebarCollapsed());

    expect(result.current[0]).toBe(false);
  });
});
