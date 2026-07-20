import { expect, test } from "@playwright/test";
import {
  adminRestauranteUsuarioMock,
  cardapioMock,
  loginResponseAdminRestauranteMock,
  loginResponseMock,
  loginResponseOperadorCaixaMock,
  loginResponseOperadorCozinhaMock,
  mockJson,
  operadorCaixaUsuarioMock,
  operadorCozinhaUsuarioMock,
  operadorLoginResponseMock,
  operadorMock,
  pedidoPendenteCaixaMock,
  superAdminUsuarioMock,
} from "./helpers/mockApi";
import { dispositivoMock, seedAdminSession, seedDeviceSession } from "./helpers/storage";

/**
 * TASK-116 — cenários de homologação do login centralizado ainda não cobertos pela suíte
 * pré-existente (admin-login.spec.ts, fluxo-operacional-mock.spec.ts, acessibilidade.spec.ts).
 * Todos mockados via page.route — nenhum depende de backend real.
 */
test.describe("Login centralizado — perfis administrativos", () => {
  test("ADMIN_RESTAURANTE entra e vai para /admin", async ({ page }) => {
    await mockJson(page, "**/api/auth/login", 200, loginResponseAdminRestauranteMock());

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(adminRestauranteUsuarioMock.email);
    await page.getByLabel("Senha").fill("senha-qualquer-e2e");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText(adminRestauranteUsuarioMock.nome)).toBeVisible();
  });
});

test.describe("Login centralizado — ProtectedRoute preserva a rota originalmente solicitada", () => {
  test("rota administrativa sem sessão redireciona para /login; após autenticar, retorna à rota original", async ({
    page,
  }) => {
    await mockJson(page, "**/api/auth/login", 200, loginResponseMock());
    await mockJson(page, "**/api/admin/dispositivos", 200, []);

    await page.goto("/admin/dispositivos");
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("E-mail").fill(superAdminUsuarioMock.email);
    await page.getByLabel("Senha").fill("senha-qualquer-e2e");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/admin\/dispositivos$/);
  });
});

test.describe("Login centralizado — operadores sem dispositivo compatível", () => {
  test("OPERADOR_CAIXA sem dispositivo ativado permanece no login e recebe orientação para ativar um Caixa", async ({
    page,
  }) => {
    await mockJson(page, "**/api/auth/login", 200, loginResponseOperadorCaixaMock());

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(operadorCaixaUsuarioMock.email);
    await page.getByLabel("Senha").fill("senha-qualquer-e2e");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/dispositivo Caixa/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Ir para ativação de dispositivo" })).toBeVisible();
  });

  test("OPERADOR_COZINHA sem dispositivo ativado permanece no login e recebe orientação para ativar uma Cozinha", async ({
    page,
  }) => {
    await mockJson(page, "**/api/auth/login", 200, loginResponseOperadorCozinhaMock());

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(operadorCozinhaUsuarioMock.email);
    await page.getByLabel("Senha").fill("senha-qualquer-e2e");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/dispositivo Cozinha/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Ir para ativação de dispositivo" })).toBeVisible();
  });

  test("OPERADOR_CAIXA COM dispositivo Caixa já ativado neste navegador é liberado para /caixa", async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await mockJson(page, "**/api/auth/login", 200, loginResponseOperadorCaixaMock());
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 200, pedidoPendenteCaixaMock());

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(operadorCaixaUsuarioMock.email);
    await page.getByLabel("Senha").fill("senha-qualquer-e2e");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/caixa$/);
    // O login central identificou o perfil, mas a interface operacional continua exigindo a
    // identificação de operador dentro do terminal — o token USER não substitui o fluxo de
    // OperadorPainel/X-Operador-Token.
    await expect(page.getByText(/Operador não identificado/)).toBeVisible();
  });
});

test.describe("Login centralizado — Totem com dispositivo incompatível", () => {
  test("dispositivo ativado como CAIXA não exibe o fluxo do Totem em /totem", async ({ page }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));

    await page.goto("/totem");

    await expect(page).toHaveURL(/\/ativar-dispositivo$/);
    await expect(page.getByRole("heading", { name: "Ativar Dispositivo" })).toBeVisible();
    await expect(page.getByText("X-Burger E2E")).not.toBeVisible();
  });
});

test.describe("Login centralizado — isolamento entre sessão administrativa e sessão de dispositivo", () => {
  test("logout administrativo não remove um dispositivo já ativado no mesmo navegador", async ({ page }) => {
    await seedAdminSession(page, superAdminUsuarioMock);
    await seedDeviceSession(page, dispositivoMock("TOTEM"));
    await mockJson(page, "**/api/auth/logout", 204, {});

    await page.goto("/admin");
    await expect(page.getByText(superAdminUsuarioMock.nome)).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login$/);

    const dispositivoRestante = await page.evaluate(() => window.localStorage.getItem("totem.device.data"));
    expect(dispositivoRestante).not.toBeNull();

    await mockJson(page, "**/api/totem/cardapio", 200, cardapioMock());
    await page.goto("/totem");
    await expect(page.getByText("X-Burger E2E")).toBeVisible();
  });

  test("trocar dispositivo (Caixa) não remove uma sessão administrativa aberta no mesmo navegador", async ({
    page,
  }) => {
    await seedAdminSession(page, superAdminUsuarioMock);
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    page.on("dialog", (dialog) => void dialog.accept());

    await page.goto("/caixa");
    await page.getByRole("button", { name: "Trocar dispositivo" }).click();

    await expect(page).toHaveURL(/\/ativar-dispositivo$/);
    const usuarioRestante = await page.evaluate(() => window.localStorage.getItem("totem.user.data"));
    expect(usuarioRestante).not.toBeNull();

    await mockJson(page, "**/api/admin/dispositivos", 200, []);
    await page.goto("/admin/dispositivos");
    await expect(page).toHaveURL(/\/admin\/dispositivos$/);
  });
});

test.describe("Login centralizado — token de operador nunca vai no header Authorization", () => {
  test("com operador identificado no Caixa, Authorization carrega o token do dispositivo e X-Operador-Token o do operador — nunca invertido", async ({
    page,
  }) => {
    await seedDeviceSession(page, dispositivoMock("CAIXA"));
    await mockJson(page, "**/api/auth/operador/login", 200, operadorLoginResponseMock());
    await mockJson(page, "**/api/caixa/pedidos/pendentes", 200, pedidoPendenteCaixaMock());

    let authorizationHeader: string | undefined;
    let operadorHeader: string | undefined;
    await page.route("**/api/caixa/pedidos/pendentes", async (route) => {
      const headers = route.request().headers();
      authorizationHeader = headers["authorization"];
      operadorHeader = headers["x-operador-token"];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(pedidoPendenteCaixaMock()) });
    });

    await page.goto("/caixa");
    await page.getByLabel("Email do operador").fill(operadorMock.email);
    await page.getByLabel("Senha").fill("senha-operador-e2e");
    await page.getByRole("button", { name: "Identificar operador" }).click();

    await expect(page.getByText("A1")).toBeVisible();
    expect(authorizationHeader).toBe("Bearer e2e-access-token");
    expect(operadorHeader).toBe("e2e-operador-token");
    expect(authorizationHeader).not.toContain("e2e-operador-token");
  });
});
