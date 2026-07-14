import type { Page } from "@playwright/test";
import type { DispositivoAutenticadoResponse, TipoDispositivo } from "../../src/types/auth";

/** Espelha as chaves reais de `frontend/src/services/tokenStorage.ts` — mantidas em sincronia manualmente, já que os testes E2E não importam o módulo de produção diretamente. */
export const STORAGE_KEYS = {
  accessToken: "totem.accessToken",
  refreshToken: "totem.refreshToken",
  dispositivo: "totem.dispositivo",
  usuario: "totem.usuario",
  operadorToken: "totem.operadorToken",
  operador: "totem.operador",
} as const;

export function dispositivoMock(
  tipoDispositivo: TipoDispositivo,
  overrides: Partial<DispositivoAutenticadoResponse> = {},
): DispositivoAutenticadoResponse {
  return {
    id: 1,
    nome: `Terminal E2E ${tipoDispositivo}`,
    codigoIdentificacao: `E2E-${tipoDispositivo}`,
    tipoDispositivo,
    restauranteId: 1,
    ativo: true,
    ultimoAcesso: null,
    ...overrides,
  };
}

/**
 * Injeta uma sessão de dispositivo já ativado no localStorage **antes** da página carregar
 * (`page.addInitScript` roda antes de qualquer script da própria aplicação) — equivalente a já ter
 * passado por `/ativar-dispositivo` nesta task, sem depender do backend real para ativar de fato.
 */
export async function seedDeviceSession(page: Page, dispositivo: DispositivoAutenticadoResponse): Promise<void> {
  await page.addInitScript(
    ({ keys, dispositivo }) => {
      window.localStorage.setItem(keys.accessToken, "e2e-access-token");
      window.localStorage.setItem(keys.refreshToken, "e2e-refresh-token");
      window.localStorage.setItem(keys.dispositivo, JSON.stringify(dispositivo));
    },
    { keys: STORAGE_KEYS, dispositivo },
  );
}
