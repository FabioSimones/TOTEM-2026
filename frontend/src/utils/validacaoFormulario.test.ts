import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { focarPrimeiroErro, isValidEmail } from "./validacaoFormulario";

describe("isValidEmail", () => {
  it("aceita e-mails com formato básico válido", () => {
    expect(isValidEmail("maria@totem.local")).toBe(true);
  });

  it("recusa e-mails sem @, sem domínio ou com espaço", () => {
    expect(isValidEmail("maria")).toBe(false);
    expect(isValidEmail("maria@")).toBe(false);
    expect(isValidEmail("maria @totem.local")).toBe(false);
  });
});

describe("focarPrimeiroErro", () => {
  it("foca e rola até o primeiro campo com erro, na ordem informada", () => {
    const nomeElemento = document.createElement("input");
    const cnpjElemento = document.createElement("input");
    document.body.append(nomeElemento, cnpjElemento);
    nomeElemento.focus = vi.fn();
    cnpjElemento.focus = vi.fn();
    nomeElemento.scrollIntoView = vi.fn();
    cnpjElemento.scrollIntoView = vi.fn();

    focarPrimeiroErro(
      ["nome", "cnpj"] as const,
      { cnpj: "CNPJ inválido" },
      { nome: { current: nomeElemento }, cnpj: { current: cnpjElemento } },
    );

    expect(nomeElemento.focus).not.toHaveBeenCalled();
    expect(cnpjElemento.focus).toHaveBeenCalledTimes(1);
    expect(cnpjElemento.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("não faz nada quando nenhum campo da ordem tem erro", () => {
    const nomeElemento = document.createElement("input");
    nomeElemento.focus = vi.fn();

    focarPrimeiroErro(["nome"] as const, {}, { nome: { current: nomeElemento } });

    expect(nomeElemento.focus).not.toHaveBeenCalled();
  });

  it("pula campos sem ref (condicionais/ocultos) e foca o próximo com erro", () => {
    const cnpjElemento = document.createElement("input");
    cnpjElemento.focus = vi.fn();
    cnpjElemento.scrollIntoView = vi.fn();
    const semRef = createRef<HTMLElement>();

    focarPrimeiroErro(
      ["nome", "cnpj"] as const,
      { nome: "erro no nome", cnpj: "erro no cnpj" },
      { nome: semRef, cnpj: { current: cnpjElemento } },
    );

    expect(cnpjElemento.focus).toHaveBeenCalledTimes(1);
  });
});
