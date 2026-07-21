import { expect, test } from "@playwright/test";
import { dashboardAdminResumoMock, loginResponseMock, mockJson, superAdminUsuarioMock } from "./helpers/mockApi";

/**
 * TASK-117 — homologação do redesign do login (layout dividido, painel institucional, ícones
 * decorativos) e da nova entrada padrão do sistema pela ativação de dispositivo. Mockado via
 * page.route — nenhum depende de backend real.
 */
test.describe("Redesign do login — entrada padrão pela ativação de dispositivo (TASK-117)", () => {
  test("/ redireciona para /ativar-dispositivo", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/ativar-dispositivo$/);
    await expect(page.getByRole("heading", { name: "Ativar Dispositivo" })).toBeVisible();
  });

  test("/login continua acessível diretamente, com o novo título e sem link de recuperação de senha", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();
    await expect(page.getByText(/esqueceu a senha/i)).toHaveCount(0);
  });

  test("link 'Ativar um dispositivo' em /login leva para /ativar-dispositivo", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: "Ativar um dispositivo" }).click();

    await expect(page).toHaveURL(/\/ativar-dispositivo$/);
  });

  test("link 'Entrar como usuário' em /ativar-dispositivo leva para /login", async ({ page }) => {
    await page.goto("/ativar-dispositivo");

    await page.getByRole("link", { name: "Entrar como usuário" }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test("login SUPER_ADMIN a partir do novo layout continua redirecionando para /admin", async ({ page }) => {
    await mockJson(page, "**/api/auth/login", 200, loginResponseMock());
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(superAdminUsuarioMock.email);
    await page.getByLabel("Senha").fill("senha-qualquer-e2e");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    // exact:true — sem isso colide com a saudação do hero ("Bem-vindo, ...!", TASK-118).
    await expect(page.getByText(superAdminUsuarioMock.nome, { exact: true })).toBeVisible();
  });

  test("mobile (375px): sem scroll horizontal, formulário visível, ThemeToggle acessível e funcional", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/login");

    await expect(page.getByLabel("E-mail")).toBeVisible();

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);

    const botaoTema = page.getByRole("button", { name: /Alternar para modo/ });
    await expect(botaoTema).toBeVisible();
    const caixa = await botaoTema.boundingBox();
    expect(caixa?.width).toBeGreaterThanOrEqual(44);
    expect(caixa?.height).toBeGreaterThanOrEqual(44);

    const temaAntes = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await botaoTema.click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
      .not.toBe(temaAntes);
  });

  test("desktop (1440px): sem scroll horizontal e painel institucional com os três ícones visíveis", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);

    await expect(page.getByText("TotemFood")).toBeVisible();
    const icones = page.locator(".food-icons svg");
    await expect(icones).toHaveCount(3);
  });

  test("com prefers-reduced-motion, os ícones ficam sem animação contínua", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/login");

    const duracaoSegundos = await page.evaluate(() => {
      const icone = document.querySelector(".food-icons__item");
      const valor = icone ? getComputedStyle(icone).animationDuration : null;
      return valor ? parseFloat(valor) : null;
    });

    // O bloco global de prefers-reduced-motion (global.css) força animation-duration a 0.01ms —
    // o navegador serializa esse valor como computed style de formas diferentes (ex.: "1e-05s"),
    // então comparamos numericamente em vez de string exata.
    expect(duracaoSegundos).not.toBeNull();
    expect(duracaoSegundos as number).toBeLessThan(0.001);
  });

  test("sem prefers-reduced-motion, os ícones mantêm a animação decorativa declarada", async ({ page }) => {
    await page.goto("/login");

    const duracao = await page.evaluate(() => {
      const icone = document.querySelector(".food-icons__item--burger");
      return icone ? getComputedStyle(icone).animationDuration : null;
    });

    expect(duracao).not.toBe("0.01ms");
    expect(duracao).not.toBe("0s");
  });
});
