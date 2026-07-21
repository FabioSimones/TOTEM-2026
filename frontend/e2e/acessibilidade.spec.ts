import { expect, test } from "@playwright/test";
import {
  cardapioMock,
  dashboardAdminResumoMock,
  loginResponseMock,
  mockJson,
  operadorLoginResponseMock,
  operadorMock,
  pedidoPendenteCaixaMock,
} from "./helpers/mockApi";
import { dispositivoMock, seedDeviceSession } from "./helpers/storage";

/**
 * TASK-113: cobertura mínima de comportamento (não screenshot) para as correções de acessibilidade
 * visual/touch — confirma que os elementos ajustados continuam funcionando E que a área de toque
 * mínima (44×44px) foi realmente aplicada no navegador, não só declarada no CSS.
 */
test.describe("Acessibilidade visual e touch targets (TASK-113)", () => {
  test("Totem: botão de quantidade do modal de produto tem alvo de toque >= 44px e continua incrementando (TASK-120.1)", async ({
    page,
  }) => {
    await seedDeviceSession(page, dispositivoMock("TOTEM"));
    await mockJson(page, "**/api/totem/cardapio", 200, cardapioMock());

    await page.goto("/totem");
    await page.getByRole("button", { name: "Adicionar" }).click();

    const dialogProduto = page.getByRole("dialog");
    const botaoAumentar = dialogProduto.getByRole("button", { name: "Aumentar quantidade" });
    await expect(botaoAumentar).toBeVisible();

    const caixa = await botaoAumentar.boundingBox();
    expect(caixa?.width).toBeGreaterThanOrEqual(44);
    expect(caixa?.height).toBeGreaterThanOrEqual(44);

    await botaoAumentar.click();
    await expect(dialogProduto.getByText("2", { exact: true })).toBeVisible();

    // Confirmar adiciona a quantidade escolhida no modal (2), não abre o carrinho automaticamente.
    await dialogProduto.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Abrir carrinho, 2 itens" })).toBeVisible();
  });

  test("ThemeToggle tem alvo de toque >= 44px e continua alternando o tema", async ({ page }) => {
    await page.goto("/admin/login");

    const botaoTema = page.getByRole("button", { name: /Alternar para modo/ });
    const caixa = await botaoTema.boundingBox();
    expect(caixa?.width).toBeGreaterThanOrEqual(44);
    expect(caixa?.height).toBeGreaterThanOrEqual(44);

    const temaAntes = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await botaoTema.click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
      .not.toBe(temaAntes);
  });

  test("Modal administrativo: botão de fechar tem alvo de toque >= 44px e fecha o modal", async ({ page }) => {
    await mockJson(page, "**/api/auth/login", 200, loginResponseMock());
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());
    await mockJson(page, "**/api/admin/restaurantes", 200, []);

    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill("admin@totem.local");
    await page.getByLabel("Senha").fill("qualquer");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.goto("/admin/restaurantes");
    await page.getByRole("button", { name: "Novo restaurante" }).click();

    const botaoFechar = page.getByRole("button", { name: "Fechar" });
    const caixa = await botaoFechar.boundingBox();
    expect(caixa?.width).toBeGreaterThanOrEqual(44);
    expect(caixa?.height).toBeGreaterThanOrEqual(44);

    await botaoFechar.click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("navegação por Tab mostra foco visível no login administrativo", async ({ page }) => {
    await page.goto("/admin/login");
    // TASK-116: /admin/login agora é um redirect client-side (<Navigate>) para /login — goto()
    // resolve antes do redirect + montagem do LoginPage acontecerem, então é preciso aguardar o
    // formulário existir antes de pressionar Tab, senão o activeElement ainda pode ser <body>.
    await page.getByLabel("E-mail").waitFor();

    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });

    expect(outline?.style).not.toBe("none");
    expect(outline?.width).not.toBe("0px");
  });
});

/**
 * TASK-114: `Button` ganhou `variant` ("secondary"/"danger") para substituir 4 classes CSS
 * duplicadas — este bloco confirma que a migração não regrediu nem o touch target (bug real
 * encontrado em `.operador-painel__trocar`, abaixo de 44px antes desta task) nem a responsividade.
 */
test.describe("Padronização de botões (TASK-114)", () => {
  test("Caixa: 'Trocar operador' (variant secondary) tem alvo de toque >= 44px", async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 200, []);
    await mockJson(page, "**/api/auth/operador/login", 200, operadorLoginResponseMock());

    await page.goto("/caixa");
    await page.getByLabel("Email do operador").fill(operadorMock.email);
    await page.getByLabel("Senha").fill("senha-operador-e2e");
    await page.getByRole("button", { name: "Identificar operador" }).click();

    const botaoTrocar = page.getByRole("button", { name: "Trocar operador" });
    const caixa = await botaoTrocar.boundingBox();
    expect(caixa?.height).toBeGreaterThanOrEqual(44);
  });

  test("Caixa: 'Cancelar pedido' (variant danger) fica visível e clicável em mobile, sem gerar scroll horizontal", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 200, pedidoPendenteCaixaMock());
    await mockJson(page, "**/api/auth/operador/login", 200, operadorLoginResponseMock());

    await page.goto("/caixa");
    await page.getByLabel("Email do operador").fill(operadorMock.email);
    await page.getByLabel("Senha").fill("senha-operador-e2e");
    await page.getByRole("button", { name: "Identificar operador" }).click();

    const botaoCancelar = page.getByRole("button", { name: "Cancelar pedido" });
    await expect(botaoCancelar).toBeVisible();

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);
  });

  test("Admin Restaurantes: ações 'Editar'/'Desativar' do card não geram scroll horizontal em mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await mockJson(page, "**/api/auth/login", 200, loginResponseMock());
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());
    await mockJson(page, "**/api/admin/restaurantes", 200, [
      {
        id: 1,
        nome: "Restaurante Mobile E2E",
        cnpj: "12345678000199",
        endereco: null,
        ativo: true,
        criadoEm: "2026-01-01T00:00:00Z",
        atualizadoEm: "2026-01-01T00:00:00Z",
      },
    ]);

    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill("admin@totem.local");
    await page.getByLabel("Senha").fill("qualquer");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.goto("/admin/restaurantes");

    await expect(page.getByRole("button", { name: "Desativar" })).toBeVisible();
    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);
  });
});
