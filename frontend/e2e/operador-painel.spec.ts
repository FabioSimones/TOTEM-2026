import { expect, test } from "@playwright/test";
import { mockJson, operadorLoginResponseMock, operadorMock, pedidoPendenteCaixaMock } from "./helpers/mockApi";
import { dispositivoMock, seedDeviceSession } from "./helpers/storage";

test.describe("OperadorPainel dentro do Caixa (mockado)", () => {
  test.beforeEach(async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 200, pedidoPendenteCaixaMock());
  });

  test("sem operador identificado, mostra o formulário; identificar operador troca para o card do operador", async ({
    page,
  }) => {
    await mockJson(page, "**/api/auth/operador/login", 200, operadorLoginResponseMock());

    await page.goto("/caixa");

    await expect(page.getByText(/Operador não identificado/)).toBeVisible();
    await expect(page.getByLabel("Email do operador")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();

    await page.getByLabel("Email do operador").fill(operadorMock.email);
    await page.getByLabel("Senha").fill("senha-operador-e2e");
    await page.getByRole("button", { name: "Identificar operador" }).click();

    await expect(page.getByText(`Operador: ${operadorMock.nome}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Trocar operador" })).toBeVisible();
  });

  test("com operador identificado, 'Trocar operador' volta ao formulário de identificação", async ({ page }) => {
    await page.goto("/caixa");
    // Pré-condição: identifica o operador pela UI (evita depender de como o storage é lido no boot,
    // exercitando o mesmo caminho real do teste anterior).
    await mockJson(page, "**/api/auth/operador/login", 200, operadorLoginResponseMock());
    await page.getByLabel("Email do operador").fill(operadorMock.email);
    await page.getByLabel("Senha").fill("senha-operador-e2e");
    await page.getByRole("button", { name: "Identificar operador" }).click();
    await expect(page.getByText(`Operador: ${operadorMock.nome}`)).toBeVisible();

    await page.getByRole("button", { name: "Trocar operador" }).click();

    await expect(page.getByText(/Operador não identificado/)).toBeVisible();
    await expect(page.getByLabel("Email do operador")).toBeVisible();
  });
});
