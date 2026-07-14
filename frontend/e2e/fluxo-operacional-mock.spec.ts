import { expect, test } from "@playwright/test";
import { cardapioMock, mockJson, pedidoCozinhaMock, pedidoPendenteCaixaMock } from "./helpers/mockApi";
import { dispositivoMock, seedDeviceSession } from "./helpers/storage";

/**
 * Fatia mínima do fluxo operacional (TASK-102) — cada terminal testado isoladamente com dados
 * mockados, sem encadear um pedido real entre Totem→Caixa→Cozinha (isso exigiria backend real e
 * fica para uma task futura de E2E integrado, ver `frontend/README.md`). O objetivo aqui é
 * homologar visualmente que cada tela carrega e reage a uma ação real de clique.
 */
test.describe("Fluxo operacional — homologação visual mínima (mockado)", () => {
  test("Totem: carrega o cardápio e adicionar um produto habilita o resumo do pedido", async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("TOTEM"));
    await mockJson(page, "**/api/totem/cardapio", 200, cardapioMock());

    await page.goto("/totem");

    await expect(page.getByText("X-Burger E2E")).toBeVisible();
    await expect(page.getByText("Seu carrinho está vazio.", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "Adicionar" }).click();

    await expect(page.getByText("Total estimado")).toBeVisible();
    await expect(page.getByRole("button", { name: "Finalizar pedido" })).toBeVisible();
  });

  test("Caixa: carrega a lista de pendências e mostra o botão de ação sugerida", async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 200, pedidoPendenteCaixaMock());

    await page.goto("/caixa");

    await expect(page.getByText("A1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirmar dinheiro" })).toBeVisible();
  });

  test("Cozinha: carrega a lista de pedidos e mostra o botão de avanço de status", async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("COZINHA"));
    await mockJson(page, "**/api/cozinha/pedidos", 200, pedidoCozinhaMock());

    await page.goto("/cozinha");

    await expect(page.getByText("A2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar preparo" })).toBeVisible();
  });
});
