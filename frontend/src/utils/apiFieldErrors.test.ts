import { describe, expect, it } from "vitest";
import { ApiError } from "../types/api";
import { extrairErrosCampoApi } from "./apiFieldErrors";

const CAMPOS = ["nome", "cnpj"] as const;

describe("extrairErrosCampoApi", () => {
  it("retorna objeto vazio quando o erro não é ApiError", () => {
    expect(extrairErrosCampoApi(new Error("qualquer coisa"), CAMPOS)).toEqual({});
  });

  it("retorna objeto vazio quando a ApiError não tem errors[] no body", () => {
    const error = new ApiError(400, "Dados inválidos", {
      timestamp: "2026-01-01T00:00:00Z",
      status: 400,
      error: "Bad Request",
      message: "Dados inválidos",
      path: "/api/admin/restaurantes",
    });
    expect(extrairErrosCampoApi(error, CAMPOS)).toEqual({});
  });

  it("mapeia apenas os campos reconhecidos, ignorando os demais", () => {
    const error = new ApiError(400, "Dados inválidos", {
      timestamp: "2026-01-01T00:00:00Z",
      status: 400,
      error: "Bad Request",
      message: "Dados inválidos",
      path: "/api/admin/restaurantes",
      errors: [
        { campo: "nome", mensagem: "não pode ficar em branco" },
        { campo: "campoDesconhecido", mensagem: "erro irrelevante para este formulário" },
      ],
    });
    expect(extrairErrosCampoApi(error, CAMPOS)).toEqual({ nome: "não pode ficar em branco" });
  });
});
