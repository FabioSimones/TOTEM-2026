import { expect, test } from "@playwright/test";
import { prepararTotemComProduto } from "./helpers/backendApi";
import { seedRealDeviceSession } from "./helpers/storage";

/**
 * TASK-104: primeiro E2E *integrado* — sem `page.route`, sem mock nenhum. O dispositivo é criado e
 * ativado via chamadas reais à API (helpers/backendApi.ts) e o navegador conversa direto com o
 * backend real a partir daqui. Fluxo A do briefing: Totem carrega o cardápio real, cria um pedido
 * real e paga com Pix (autorização síncrona do `FakePaymentProvider`, sem gateway externo).
 *
 * Pré-requisitos (ver frontend/README.md "E2E integrado"): backend rodando com
 * CORS_ALLOWED_ORIGINS incluindo a baseURL deste config, bootstrap de SUPER_ADMIN habilitado, e
 * E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD apontando para esse SUPER_ADMIN.
 */
test.describe("Totem — pedido real (E2E integrado, sem mocks)", () => {
  test("cardápio real, cria pedido real e paga com Pix — resultado AUTORIZADO/PAGO", async ({ page, request }) => {
    const { ativado, nomeProduto } = await prepararTotemComProduto(request);
    await seedRealDeviceSession(page, ativado);

    await page.goto("/totem");

    await expect(page.getByText(nomeProduto)).toBeVisible();

    // TASK-120.1/120.3: "Adicionar" abre o modal de seleção do produto (quantidade/observação) —
    // só confirma o item no carrinho depois de "Adicionar ao carrinho". O carrinho, por sua vez,
    // só abre explicitamente pelo botão da topbar (nunca automaticamente após adicionar).
    await page.getByRole("button", { name: "Adicionar" }).click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();

    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();
    await page.getByLabel("Seu nome").fill("Cliente E2E Integrado");
    await page.getByRole("button", { name: "Criar pedido" }).click();

    await expect(page.getByRole("heading", { name: "Pedido criado com sucesso!" })).toBeVisible();

    await page.getByRole("button", { name: "Ir para pagamento" }).click();
    await expect(page.getByRole("heading", { name: /Pagamento do pedido/ })).toBeVisible();

    // Pix já vem pré-selecionado (ver PagamentoPedido.tsx) — só confirmar.
    await page.getByRole("button", { name: "Confirmar pagamento" }).click();

    await expect(page.getByRole("heading", { name: "Pagamento aprovado!" })).toBeVisible();
    await expect(page.getByText("AUTORIZADO", { exact: true })).toBeVisible();
    await expect(page.getByText("PAGO", { exact: true })).toBeVisible();
  });
});
