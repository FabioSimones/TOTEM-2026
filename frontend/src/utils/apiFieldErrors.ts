import { ApiError } from "../types/api";

/**
 * TASK-115: o backend já retorna `ApiErrorResponse.errors: [{campo, mensagem}]` em toda validação
 * `@Valid` rejeitada (`GlobalExceptionHandler.handleMethodArgumentNotValid`) — os nomes de `campo`
 * são exatamente os nomes dos campos do DTO Java, que espelham 1:1 os campos dos `Request` TS
 * (confirmado lendo os DTOs). Isso permite mapear com segurança para erro inline, sem adivinhação
 * textual: só os campos em `camposConhecidos` são extraídos, qualquer outro (ou a ausência de
 * `errors[]`) é ignorado aqui e continua como mensagem global de erro da API.
 */
export function extrairErrosCampoApi<TCampo extends string>(
  error: unknown,
  camposConhecidos: readonly TCampo[],
): Partial<Record<TCampo, string>> {
  if (!(error instanceof ApiError) || !error.body?.errors) {
    return {};
  }

  const conhecidos = new Set<string>(camposConhecidos);
  const resultado: Partial<Record<TCampo, string>> = {};
  for (const fieldError of error.body.errors) {
    if (conhecidos.has(fieldError.campo)) {
      resultado[fieldError.campo as TCampo] = fieldError.mensagem;
    }
  }
  return resultado;
}
