import { expect, test } from "@playwright/test";
import { mockJson, operadorLoginResponseMock, operadorMock, pedidoCozinhaMock, pedidoPendenteCaixaMock } from "./helpers/mockApi";
import { dispositivoMock, seedDeviceSession, STORAGE_KEYS } from "./helpers/storage";

/**
 * TASK-119 — homologação do redesign dos painéis operacionais (Caixa/Cozinha): topbar
 * compartilhada (`OperationalTopbar`), identidade de dispositivo/operador sempre visível, e as
 * duas ações de sessão continuando distintas (nunca a mesma ação/limpeza). Cenários já cobertos em
 * `ativacao-dispositivo.spec.ts`/`operador-painel.spec.ts`/`fluxo-operacional-mock.spec.ts`
 * (estados sem dispositivo, sem operador, ação sugerida básica) não são repetidos aqui.
 */
const operadorCozinhaMock = { ...operadorMock, perfil: "OPERADOR_COZINHA" as const };

async function identificarOperador(page: import("@playwright/test").Page) {
  await page.getByLabel("Email do operador").fill(operadorMock.email);
  await page.getByLabel("Senha").fill("senha-operador-e2e");
  await page.getByRole("button", { name: "Identificar operador" }).click();
}

test.describe("Painel operacional — Caixa (TASK-119)", () => {
  test.beforeEach(async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 200, pedidoPendenteCaixaMock());
    await mockJson(page, "**/api/auth/operador/login", 200, operadorLoginResponseMock());
  });

  test("topbar mostra módulo, dispositivo, operador e perfil amigável (nunca o enum técnico)", async ({ page }) => {
    await page.goto("/caixa");
    await identificarOperador(page);

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator(".operational-topbar__modulo")).toHaveText("Caixa");
    await expect(page.getByText("Terminal E2E CAIXA")).toBeVisible();
    await expect(page.getByText(operadorMock.nome)).toBeVisible();
    await expect(page.getByText("Operador de caixa")).toBeVisible();
    await expect(page.getByText("OPERADOR_CAIXA")).toHaveCount(0);
  });

  test("executa a ação sugerida (Confirmar dinheiro) e a lista é atualizada", async ({ page }) => {
    await page.goto("/caixa");
    await identificarOperador(page);
    await expect(page.getByText("A1")).toBeVisible();

    await mockJson(page, "**/api/caixa/pedidos/*/confirmar-pagamento", 200, {
      pedidoId: 1,
      numeroPedido: "A1",
      statusPedido: "PAGO",
      pagamentoId: 1,
      formaPagamento: "DINHEIRO",
      statusPagamento: "AUTORIZADO",
      valor: 25.9,
      confirmadoEm: "2026-01-01T12:05:00Z",
    });
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 200, []);

    page.on("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Confirmar dinheiro" }).click();

    await expect(page.getByText(/confirmado/)).toBeVisible();
  });

  test("trocar operador (topbar) remove os pedidos da tela imediatamente e volta ao login", async ({ page }) => {
    await page.goto("/caixa");
    await identificarOperador(page);
    await expect(page.getByText("A1")).toBeVisible();

    await page.getByRole("button", { name: "Trocar operador" }).click();

    await expect(page.getByText("A1")).not.toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Identifique-se para acessar o Caixa" })).toBeVisible();
    // Dispositivo preservado — só o operador foi limpo.
    const dispositivoRestante = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEYS.deviceData);
    expect(dispositivoRestante).not.toBeNull();
  });

  test("trocar dispositivo (topbar): cancelar preserva a sessão; confirmar limpa tudo e navega para a ativação", async ({
    page,
  }) => {
    await page.goto("/caixa");
    await identificarOperador(page);
    await expect(page.getByText("A1")).toBeVisible();

    page.once("dialog", (dialog) => void dialog.dismiss());
    await page.getByRole("button", { name: "Trocar dispositivo" }).click();
    await expect(page.getByText("A1")).toBeVisible();
    await expect(page).not.toHaveURL(/\/ativar-dispositivo$/);

    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Trocar dispositivo" }).click();

    await expect(page).toHaveURL(/\/ativar-dispositivo$/);
    const dispositivoRestante = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEYS.deviceData);
    const operadorRestante = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEYS.operatorData);
    expect(dispositivoRestante).toBeNull();
    expect(operadorRestante).toBeNull();
  });

  test("alternar o tema a partir da topbar operacional", async ({ page }) => {
    await page.goto("/caixa");
    await identificarOperador(page);

    const temaAntes = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await page.getByRole("button", { name: /Alternar para modo/ }).click();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
      .not.toBe(temaAntes);
  });

  test("ação operacional tem pelo menos 48px de altura (touch)", async ({ page }) => {
    await page.goto("/caixa");
    await identificarOperador(page);

    const botaoAcao = page.getByRole("button", { name: "Confirmar dinheiro" });
    const caixa = await botaoAcao.boundingBox();
    expect(caixa?.height).toBeGreaterThanOrEqual(48);
  });

  test("mobile (375px): topbar e lista sem scroll horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/caixa");
    await identificarOperador(page);
    await expect(page.getByText("A1")).toBeVisible();

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);
  });

  test("sessão expirada (401 na listagem) remove os pedidos e volta ao card de ativação", async ({ page }) => {
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 401, { message: "Sessão expirada" });
    await page.goto("/caixa");
    await identificarOperador(page);

    await expect(page.getByText("Caixa não ativado")).toBeVisible();
    await expect(page.getByText("A1")).not.toBeVisible();
  });

  test("navegação por teclado: Tab alcança as ações da topbar com foco visível", async ({ page }) => {
    await page.goto("/caixa");
    await identificarOperador(page);
    await expect(page.getByText("A1")).toBeVisible();

    // Chromium só ativa :focus-visible via navegação real por teclado (não via .focus()
    // programático) — mesmo padrão já usado em `acessibilidade.spec.ts`.
    const botaoTrocarOperador = page.getByRole("button", { name: "Trocar operador" });
    let alcancado = false;
    for (let tentativas = 0; tentativas < 15 && !alcancado; tentativas += 1) {
      await page.keyboard.press("Tab");
      alcancado = await botaoTrocarOperador.evaluate((el) => el === document.activeElement);
    }
    expect(alcancado).toBe(true);

    const outline = await botaoTrocarOperador.evaluate((el) => {
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).not.toBe("0px");
  });
});

test.describe("Painel operacional — Cozinha (TASK-119)", () => {
  test.beforeEach(async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("COZINHA"));
    await mockJson(page, "**/api/cozinha/pedidos", 200, pedidoCozinhaMock());
    await mockJson(page, "**/api/auth/operador/login", 200, operadorLoginResponseMock());
  });

  test("login do operador mostra a fila com o tempo decorrido de cada pedido", async ({ page }) => {
    await page.goto("/cozinha");
    await identificarOperador(page);

    await expect(page.getByText("A2")).toBeVisible();
    await expect(page.locator(".pedido-cozinha-card__tempo")).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar preparo" })).toBeVisible();
  });

  test("executa a transição de status permitida (Iniciar preparo) e a fila é atualizada", async ({ page }) => {
    await page.goto("/cozinha");
    await identificarOperador(page);
    await expect(page.getByText("A2")).toBeVisible();

    await mockJson(page, "**/api/cozinha/pedidos/*/status", 200, {
      pedidoId: 2,
      numeroPedido: "A2",
      statusAnterior: "ENVIADO_PARA_COZINHA",
      statusAtual: "EM_PREPARO",
      atualizadoEm: "2026-01-01T12:05:00Z",
    });
    await mockJson(page, "**/api/cozinha/pedidos", 200, []);

    page.on("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Iniciar preparo" }).click();

    await expect(page.getByText(/atualizado/)).toBeVisible();
  });

  test("trocar operador (topbar) esvazia a fila imediatamente", async ({ page }) => {
    await page.goto("/cozinha");
    await identificarOperador(page);
    await expect(page.getByText("A2")).toBeVisible();

    await page.getByRole("button", { name: "Trocar operador" }).click();

    await expect(page.getByText("A2")).not.toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Identifique-se para acessar a Cozinha" })).toBeVisible();
  });

  test("topbar mostra o perfil 'Operador de cozinha'", async ({ page }) => {
    await mockJson(page, "**/api/auth/operador/login", 200, { ...operadorLoginResponseMock(), operador: operadorCozinhaMock });
    await page.goto("/cozinha");
    await identificarOperador(page);

    await expect(page.getByText("Operador de cozinha")).toBeVisible();
  });
});

/**
 * TASK-119.2 — antes desta task, o intervalo "dispositivo ativado, operador ainda não
 * identificado" ficava preso na casca visual antiga (AppLayout/ModuleHeader) mesmo depois da
 * TASK-119 introduzir o layout operacional novo. Estes cenários reproduzem exatamente o bug
 * relatado (ativar COZINHA → cabeçalho genérico, sem OperationalTopbar) e confirmam a correção.
 */
test.describe("Integração do login do operador ao layout operacional (TASK-119.2)", () => {
  test("ativar um dispositivo COZINHA mostra o novo layout operacional imediatamente, sem pedidos nem 'Trocar operador'", async ({
    page,
  }) => {
    await mockJson(page, "**/api/auth/dispositivos/ativar", 200, {
      accessToken: "device-access-e2e",
      refreshToken: "device-refresh-e2e",
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshExpiresIn: 604800,
      dispositivo: dispositivoMock("COZINHA"),
    });
    await mockJson(page, "**/api/cozinha/pedidos", 200, pedidoCozinhaMock());

    await page.goto("/ativar-dispositivo");
    await page.getByLabel("Código de ativação").fill("CODIGO-COZINHA-E2E");
    await page.getByRole("button", { name: "Ativar dispositivo" }).click();

    await expect(page).toHaveURL(/\/cozinha$/, { timeout: 5000 });
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator(".operational-topbar__modulo")).toHaveText("Cozinha");
    await expect(page.getByText("Terminal E2E COZINHA")).toBeVisible();
    await expect(page.getByRole("button", { name: /Alternar para modo/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Trocar dispositivo" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Identifique-se para acessar a Cozinha" })).toBeVisible();

    // Nada da apresentação antiga, nenhum dado de operador/pedido antes do login.
    await expect(page.getByRole("button", { name: "Trocar operador" })).toHaveCount(0);
    await expect(page.getByText("A2")).toHaveCount(0);
    await expect(page.locator(".operational-topbar__avatar")).toHaveCount(0);
  });

  test("ThemeToggle funciona antes do login do operador (dark/light)", async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await page.goto("/caixa");
    await expect(page.getByRole("heading", { level: 1, name: "Identifique-se para acessar o Caixa" })).toBeVisible();

    const temaAntes = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await page.getByRole("button", { name: /Alternar para modo/ }).click();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
      .not.toBe(temaAntes);
  });

  test("erro de credencial inválida mantém a topbar visível e não expõe pedidos", async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await mockJson(page, "**/api/auth/operador/login", 401, { message: "Credenciais inválidas" });

    await page.goto("/caixa");
    await page.getByLabel("Email do operador").fill(operadorMock.email);
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Identificar operador" }).click();

    await expect(page.getByText("Email ou senha inválidos.")).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByText("Terminal E2E CAIXA")).toBeVisible();
    await expect(page.getByText("A1")).toHaveCount(0);
  });

  test("campo de e-mail recebe foco automaticamente ao abrir a tela sem operador", async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await page.goto("/caixa");

    await expect(page.getByLabel("Email do operador")).toBeFocused();
  });

  test("mobile (375px) sem operador: topbar e formulário sem scroll horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await seedDeviceSession(page, dispositivoMock("COZINHA"));
    await page.goto("/cozinha");

    await expect(page.getByRole("heading", { level: 1, name: "Identifique-se para acessar a Cozinha" })).toBeVisible();
    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);

    const botaoTrocarDispositivo = page.getByRole("button", { name: "Trocar dispositivo" });
    const caixa = await botaoTrocarDispositivo.boundingBox();
    expect(caixa?.height).toBeGreaterThanOrEqual(44);
  });
});
