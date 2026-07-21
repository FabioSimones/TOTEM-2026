import { describe, expect, it } from "vitest";
import {
  formatarData,
  formatarDataHora,
  formatarDataReferencia,
  formatarHora,
  formatarTempoDecorrido,
  parseBackendUtcDateTime,
} from "./dateTime";

describe("parseBackendUtcDateTime", () => {
  it("retorna null para null/undefined", () => {
    expect(parseBackendUtcDateTime(null)).toBeNull();
    expect(parseBackendUtcDateTime(undefined)).toBeNull();
  });

  it("interpreta um LocalDateTime sem offset como UTC", () => {
    const data = parseBackendUtcDateTime("2026-07-12T15:00:00");
    expect(data?.toISOString()).toBe("2026-07-12T15:00:00.000Z");
  });

  it("uma string já com Z não duplica o offset", () => {
    const data = parseBackendUtcDateTime("2026-07-12T15:00:00Z");
    expect(data?.toISOString()).toBe("2026-07-12T15:00:00.000Z");
  });

  it("respeita um offset explícito diferente de UTC", () => {
    // 15:00 em +03:00 equivale a 12:00 UTC.
    const data = parseBackendUtcDateTime("2026-07-12T15:00:00+03:00");
    expect(data?.toISOString()).toBe("2026-07-12T12:00:00.000Z");
  });

  it("retorna null para uma string inválida", () => {
    expect(parseBackendUtcDateTime("não-é-uma-data")).toBeNull();
  });
});

describe("formatarDataHora / formatarData / formatarHora", () => {
  it("retornam o fallback amigável para valor ausente", () => {
    expect(formatarDataHora(null)).toBe("—");
    expect(formatarDataHora(undefined)).toBe("—");
    expect(formatarData(null)).toBe("—");
    expect(formatarHora(null)).toBe("—");
  });

  it("formatam um LocalDateTime UTC válido sem lançar erro (fuso fixado em UTC no setup de teste)", () => {
    // process.env.TZ = "UTC" (src/test/setup.ts) torna a saída determinística nesta suíte —
    // em produção, o navegador do usuário define o fuso, não process.env.TZ.
    expect(formatarDataHora("2026-07-12T15:30:00")).toContain("12/07/2026");
    expect(formatarDataHora("2026-07-12T15:30:00")).toContain("15:30");
    expect(formatarData("2026-07-12T15:30:00")).toBe("12/07/2026");
    expect(formatarHora("2026-07-12T15:30:00")).toBe("15:30");
  });
});

describe("formatarDataReferencia", () => {
  it("retorna o fallback amigável para valor ausente", () => {
    expect(formatarDataReferencia(null)).toBe("—");
    expect(formatarDataReferencia(undefined)).toBe("—");
  });

  it("formata um LocalDate puro sem passar por Date/conversão de fuso (sem shift)", () => {
    // Valor propositalmente próximo da meia-noite UTC: se passasse por `Date`, um fuso negativo
    // poderia "pular" para o dia anterior — a implementação evita isso via split de string.
    expect(formatarDataReferencia("2026-07-12")).toBe("12/07/2026");
  });

  it("retorna o valor original se o formato não tiver 3 partes separadas por hífen", () => {
    expect(formatarDataReferencia("2026-07")).toBe("2026-07");
  });
});

describe("formatarTempoDecorrido (TASK-119)", () => {
  it("retorna o fallback amigável para valor ausente", () => {
    expect(formatarTempoDecorrido(null)).toBe("—");
    expect(formatarTempoDecorrido(undefined)).toBe("—");
  });

  it("menos de um minuto retorna 'agora mesmo'", () => {
    const agora = new Date("2026-07-12T15:30:30Z");
    expect(formatarTempoDecorrido("2026-07-12T15:30:00", agora)).toBe("agora mesmo");
  });

  it("minutos decorridos, sem horas", () => {
    const agora = new Date("2026-07-12T15:35:00Z");
    expect(formatarTempoDecorrido("2026-07-12T15:30:00", agora)).toBe("5 min");
  });

  it("horas exatas, sem minutos restantes", () => {
    const agora = new Date("2026-07-12T17:00:00Z");
    expect(formatarTempoDecorrido("2026-07-12T15:00:00", agora)).toBe("2 h");
  });

  it("horas e minutos combinados", () => {
    const agora = new Date("2026-07-12T16:12:00Z");
    expect(formatarTempoDecorrido("2026-07-12T15:00:00", agora)).toBe("1 h 12 min");
  });

  it("nunca retorna tempo negativo (relógio do cliente ligeiramente atrasado em relação ao servidor)", () => {
    const agora = new Date("2026-07-12T15:29:00Z");
    expect(formatarTempoDecorrido("2026-07-12T15:30:00", agora)).toBe("agora mesmo");
  });
});
