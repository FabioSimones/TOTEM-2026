import type { Page } from "@playwright/test";
import type { DispositivoAutenticadoResponse, TipoDispositivo, UsuarioAutenticadoResponse } from "../../src/types/auth";

/**
 * Espelha as chaves reais de `frontend/src/services/tokenStorage.ts` — mantidas em sincronia
 * manualmente, já que os testes E2E não importam o módulo de produção diretamente.
 *
 * Auditoria de autenticação: sessão de usuário e de dispositivo passaram a usar chaves
 * fisicamente separadas (antes compartilhavam `accessToken`/`refreshToken`).
 */
export const STORAGE_KEYS = {
  userAccessToken: "totem.user.accessToken",
  userRefreshToken: "totem.user.refreshToken",
  userData: "totem.user.data",
  deviceAccessToken: "totem.device.accessToken",
  deviceRefreshToken: "totem.device.refreshToken",
  deviceData: "totem.device.data",
  operatorAccessToken: "totem.operator.accessToken",
  operatorData: "totem.operator.data",
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
      window.localStorage.setItem(keys.deviceAccessToken, "e2e-access-token");
      window.localStorage.setItem(keys.deviceRefreshToken, "e2e-refresh-token");
      window.localStorage.setItem(keys.deviceData, JSON.stringify(dispositivo));
    },
    { keys: STORAGE_KEYS, dispositivo },
  );
}

/**
 * Injeta uma sessão administrativa já autenticada no localStorage (TASK-115) — equivalente a já
 * ter passado por `/login`, sem depender do backend real para as telas de CRUD administrativo.
 */
export async function seedAdminSession(page: Page, usuario: UsuarioAutenticadoResponse): Promise<void> {
  await page.addInitScript(
    ({ keys, usuario }) => {
      window.localStorage.setItem(keys.userAccessToken, "e2e-admin-access-token");
      window.localStorage.setItem(keys.userRefreshToken, "e2e-admin-refresh-token");
      window.localStorage.setItem(keys.userData, JSON.stringify(usuario));
    },
    { keys: STORAGE_KEYS, usuario },
  );
}
