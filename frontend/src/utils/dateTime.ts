/**
 * Utilitário central de data/hora do Admin (TASK-080).
 *
 * O backend padronizou-se em UTC (TASK-079), mas os campos continuam `LocalDateTime` — serializam
 * sem sufixo `Z`/offset (ex.: `"2026-07-12T15:00:00"`). O `new Date(...)` nativo do navegador
 * interpreta uma string ISO *sem* offset como hora local do navegador, não como UTC — por isso
 * todo valor de data/hora vindo da API precisa passar por {@link parseBackendUtcDateTime} antes
 * de virar um `Date`, nunca por `new Date(valor)` direto.
 *
 * Migração futura recomendada (fora do escopo desta task): o backend passar a serializar com
 * offset explícito (`Instant`/`OffsetDateTime`), o que tornaria esse utilitário desnecessário.
 */

const SUFIXO_OFFSET = /([zZ]|[+-]\d{2}:\d{2})$/;

/**
 * Interpreta uma string `LocalDateTime` do backend (sem offset) como UTC. Se a string já tiver um
 * offset explícito (`Z` ou `+HH:MM`/`-HH:MM`), respeita esse offset sem alterá-lo.
 */
export function parseBackendUtcDateTime(value?: string | null): Date | null {
  if (!value) {
    return null;
  }
  const normalizado = SUFIXO_OFFSET.test(value) ? value : `${value}Z`;
  const data = new Date(normalizado);
  return Number.isNaN(data.getTime()) ? null : data;
}

const dataHoraFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const dataFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const horaFormatter = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" });

/**
 * Formata um `LocalDateTime` do backend (UTC) como `dd/mm/aaaa hh:mm` no fuso horário do
 * navegador do usuário — não fixamos um fuso no frontend, o `Intl.DateTimeFormat` já converte
 * automaticamente de UTC para o fuso local do navegador.
 */
export function formatarDataHora(value?: string | null): string {
  const data = parseBackendUtcDateTime(value);
  return data ? dataHoraFormatter.format(data) : "—";
}

/** Mesma conversão de {@link formatarDataHora}, mas exibindo só a data (`dd/mm/aaaa`). */
export function formatarData(value?: string | null): string {
  const data = parseBackendUtcDateTime(value);
  return data ? dataFormatter.format(data) : "—";
}

/** Mesma conversão de {@link formatarDataHora}, mas exibindo só a hora (`hh:mm`). */
export function formatarHora(value?: string | null): string {
  const data = parseBackendUtcDateTime(value);
  return data ? horaFormatter.format(data) : "—";
}

/**
 * Formata um `LocalDate` puro do backend (ex.: `dataReferencia` do Dashboard, `"2026-07-12"`)
 * como `dd/mm/aaaa`. Diferente de {@link formatarData}, nunca passa por `Date`/conversão de
 * fuso horário — um `LocalDate` não tem hora, então não há offset a corrigir, e converter via
 * `Date` arriscaria "pular" de dia perto da meia-noite UTC. A regra de "hoje" do Dashboard
 * continua em UTC (fora do escopo desta task, ver `docs/09-contratos-api.md`).
 */
export function formatarDataReferencia(value?: string | null): string {
  if (!value) {
    return "—";
  }
  const partes = value.split("-");
  if (partes.length !== 3) {
    return value;
  }
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}
