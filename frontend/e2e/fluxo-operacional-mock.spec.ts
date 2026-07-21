import { expect, test } from "@playwright/test";
import {
  cardapioMock,
  mockJson,
  operadorLoginResponseMock,
  operadorMock,
  pedidoCozinhaMock,
  pedidoPendenteCaixaMock,
} from "./helpers/mockApi";
import { dispositivoMock, seedDeviceSession } from "./helpers/storage";

/**
 * Fatia mínima do fluxo operacional (TASK-102) — cada terminal testado isoladamente com dados
 * mockados, sem encadear um pedido real entre Totem→Caixa→Cozinha (isso exigiria backend real e
 * fica para uma task futura de E2E integrado, ver `frontend/README.md`). O objetivo aqui é
 * homologar visualmente que cada tela carrega e reage a uma ação real de clique.
 */
test.describe("Fluxo operacional — homologação visual mínima (mockado)", () => {
  test("Totem: carrega o cardápio e adicionar um produto pelo modal atualiza a revisão do pedido", async ({
    page,
  }) => {
    await seedDeviceSession(page, dispositivoMock("TOTEM"));
    await mockJson(page, "**/api/totem/cardapio", 200, cardapioMock());

    await page.goto("/totem");

    await expect(page.getByText("X-Burger E2E")).toBeVisible();

    // TASK-120.1: o carrinho deixou de ficar sempre visível na página — vira modal, aberto só pelo
    // botão da topbar. Confirma o estado vazio dentro do dialog, não mais na página em si.
    await page.getByRole("button", { name: "Abrir carrinho" }).click();
    const dialogCarrinhoVazio = page.getByRole("dialog", { name: "Seu pedido" });
    await expect(dialogCarrinhoVazio.getByText("Seu carrinho está vazio.", { exact: false })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // "Adicionar" abre o modal de seleção do produto — não adiciona 1 unidade direto (TASK-120.1).
    await page.getByRole("button", { name: "Adicionar" }).click();
    const dialogProduto = page.getByRole("dialog", { name: "X-Burger E2E" });
    await expect(dialogProduto).toBeVisible();
    await dialogProduto.getByRole("button", { name: "Adicionar ao carrinho" }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();
    const dialogCarrinhoAtualizado = page.getByRole("dialog", { name: "Seu pedido" });
    await expect(dialogCarrinhoAtualizado.getByText("X-Burger E2E")).toBeVisible();
    await expect(dialogCarrinhoAtualizado.getByText("Total estimado")).toBeVisible();
  });

  test("Caixa: sem operador mostra só o login; após identificar, carrega a lista e mostra ação sugerida", async ({
    page,
  }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 200, pedidoPendenteCaixaMock());
    await mockJson(page, "**/api/auth/operador/login", 200, operadorLoginResponseMock());

    await page.goto("/caixa");

    // TASK-111/119.2: sem operador identificado, nenhum pedido aparece — só o formulário de login,
    // já dentro do layout operacional (topbar com dispositivo/ThemeToggle/Trocar dispositivo).
    await expect(page.getByRole("heading", { level: 1, name: "Identifique-se para acessar o Caixa" })).toBeVisible();
    await expect(page.getByText("A1")).not.toBeVisible();

    await page.getByLabel("Email do operador").fill(operadorMock.email);
    await page.getByLabel("Senha").fill("senha-operador-e2e");
    await page.getByRole("button", { name: "Identificar operador" }).click();

    await expect(page.getByText("A1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirmar dinheiro" })).toBeVisible();
  });

  test("Cozinha: sem operador mostra só o login; após identificar, carrega a fila e mostra avanço de status", async ({
    page,
  }) => {
    await seedDeviceSession(page, dispositivoMock("COZINHA"));
    await mockJson(page, "**/api/cozinha/pedidos", 200, pedidoCozinhaMock());
    await mockJson(page, "**/api/auth/operador/login", 200, operadorLoginResponseMock());

    await page.goto("/cozinha");

    // TASK-111/119.2: sem operador identificado, nenhum pedido aparece — só o formulário de login,
    // já dentro do layout operacional (topbar com dispositivo/ThemeToggle/Trocar dispositivo).
    await expect(page.getByRole("heading", { level: 1, name: "Identifique-se para acessar a Cozinha" })).toBeVisible();
    await expect(page.getByText("A2")).not.toBeVisible();

    await page.getByLabel("Email do operador").fill(operadorMock.email);
    await page.getByLabel("Senha").fill("senha-operador-e2e");
    await page.getByRole("button", { name: "Identificar operador" }).click();

    await expect(page.getByText("A2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar preparo" })).toBeVisible();
  });
});
