import { describe, expect, it } from "vitest";
import { normalizarTextoBusca } from "./texto";

describe("normalizarTextoBusca", () => {
  it("converte para minúsculas", () => {
    expect(normalizarTextoBusca("X-BURGER")).toBe("x-burger");
  });

  it("remove acentos", () => {
    expect(normalizarTextoBusca("Hambúrguer")).toBe("hamburguer");
  });

  it("remove espaços nas bordas", () => {
    expect(normalizarTextoBusca("  batata  ")).toBe("batata");
  });

  it("combina minúsculas, acentos e espaços", () => {
    expect(normalizarTextoBusca("  Refrigerante Guaraná  ")).toBe("refrigerante guarana");
  });
});
