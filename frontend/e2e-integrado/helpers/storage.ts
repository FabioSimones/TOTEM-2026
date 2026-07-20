import type { Page } from "@playwright/test";
import type { AtivarDispositivoResponse } from "../../src/types/auth";

/**
 * Mesmas chaves de `frontend/src/services/tokenStorage.ts`. Duplicado deliberadamente de
 * `frontend/e2e/helpers/storage.ts` (suíte mockada) — aqui os valores injetados precisam ser os
 * tokens REAIS emitidos pelo backend (a suíte mockada usa strings fictícias porque toda chamada é
 * interceptada; aqui não há interceptação nenhuma, o backend valida o token de verdade).
 */
const STORAGE_KEYS = {
  accessToken: "totem.device.accessToken",
  refreshToken: "totem.device.refreshToken",
  dispositivo: "totem.device.data",
} as const;

/** Injeta a sessão de dispositivo real (resposta de POST /api/auth/dispositivos/ativar) antes da página carregar. */
export async function seedRealDeviceSession(page: Page, ativado: AtivarDispositivoResponse): Promise<void> {
  await page.addInitScript(
    ({ keys, accessToken, refreshToken, dispositivo }) => {
      window.localStorage.setItem(keys.accessToken, accessToken);
      window.localStorage.setItem(keys.refreshToken, refreshToken);
      window.localStorage.setItem(keys.dispositivo, JSON.stringify(dispositivo));
    },
    {
      keys: STORAGE_KEYS,
      accessToken: ativado.accessToken,
      refreshToken: ativado.refreshToken,
      dispositivo: ativado.dispositivo,
    },
  );
}
