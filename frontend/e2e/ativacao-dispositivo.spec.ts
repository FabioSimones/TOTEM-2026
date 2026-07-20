import { expect, test } from "@playwright/test";
import { mockJson, operadorLoginResponseMock, operadorMock } from "./helpers/mockApi";
import { dispositivoMock, seedDeviceSession, STORAGE_KEYS } from "./helpers/storage";

/**
 * TASK-112: restaura o caminho visível de ativação/troca de dispositivo nas telas operacionais,
 * que a TASK-111 (gate de operador) deixou sem um botão claro para quem abre /caixa ou /cozinha
 * sem nenhum dispositivo ativado ainda.
 */
test.describe("Ativação e troca de dispositivo nas telas operacionais (mockado)", () => {
  test("/caixa sem dispositivo mostra o card de ativação; o botão leva a /ativar-dispositivo", async ({ page }) => {
    await page.goto("/caixa");

    await expect(page.getByText("Caixa não ativado")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ativar este dispositivo" })).toBeVisible();

    await page.getByRole("button", { name: "Ativar este dispositivo" }).click();

    await expect(page).toHaveURL(/\/ativar-dispositivo$/);
  });

  test("ativação mockada de um dispositivo CAIXA redireciona para /caixa e o login do operador continua funcionando", async ({
    page,
  }) => {
    await mockJson(page, "**/api/auth/dispositivos/ativar", 200, {
      accessToken: "device-access-e2e",
      refreshToken: "device-refresh-e2e",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      dispositivo: dispositivoMock("CAIXA"),
    });
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 200, []);
    await mockJson(page, "**/api/auth/operador/login", 200, operadorLoginResponseMock());

    await page.goto("/ativar-dispositivo");
    await page.getByLabel("Código de ativação").fill("CODIGO-CAIXA-E2E");
    await page.getByRole("button", { name: "Ativar dispositivo" }).click();

    await expect(page).toHaveURL(/\/caixa$/, { timeout: 5000 });
    await expect(page.getByText(/Operador não identificado/)).toBeVisible();

    await page.getByLabel("Email do operador").fill(operadorMock.email);
    await page.getByLabel("Senha").fill("senha-operador-e2e");
    await page.getByRole("button", { name: "Identificar operador" }).click();

    await expect(page.getByText(`Operador: ${operadorMock.nome}`)).toBeVisible();
  });

  test("'Trocar dispositivo' com operador identificado limpa a sessão e volta para /ativar-dispositivo", async ({
    page,
  }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 200, []);
    await mockJson(page, "**/api/auth/operador/login", 200, operadorLoginResponseMock());

    page.on("dialog", (dialog) => void dialog.accept());

    await page.goto("/caixa");
    await page.getByLabel("Email do operador").fill(operadorMock.email);
    await page.getByLabel("Senha").fill("senha-operador-e2e");
    await page.getByRole("button", { name: "Identificar operador" }).click();
    await expect(page.getByText(`Operador: ${operadorMock.nome}`)).toBeVisible();

    await page.getByRole("button", { name: "Trocar dispositivo" }).click();

    await expect(page).toHaveURL(/\/ativar-dispositivo$/);
    const dispositivoRestante = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEYS.deviceData);
    const operadorRestante = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEYS.operatorData);
    expect(dispositivoRestante).toBeNull();
    expect(operadorRestante).toBeNull();
  });
});
