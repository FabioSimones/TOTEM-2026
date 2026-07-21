import { expect, test } from "@playwright/test";
import {
  adminRestauranteUsuarioMock,
  dashboardAdminResumoMock,
  loginResponseAdminRestauranteMock,
  loginResponseMock,
  mockJson,
  superAdminUsuarioMock,
} from "./helpers/mockApi";
import { seedAdminSession } from "./helpers/storage";

/**
 * TASK-118 — homologação do novo layout administrativo (sidebar + topbar) via login real
 * (formulário, clique) e via sessão pré-semeada (`seedAdminSession`) para os cenários que não
 * precisam repetir o fluxo de login. Todos mockados via page.route.
 */
test.describe("Layout administrativo — sidebar expandida/recolhida", () => {
  test("login SUPER_ADMIN mostra sidebar expandida com nome, perfil e links permitidos", async ({ page }) => {
    await mockJson(page, "**/api/auth/login", 200, loginResponseMock());
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(superAdminUsuarioMock.email);
    await page.getByLabel("Senha").fill("senha-qualquer-e2e");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("navigation", { name: "Navegação administrativa" })).toBeVisible();
    await expect(page.getByText("Superadministrador")).toBeVisible();

    for (const nome of ["Dashboard", "Restaurantes", "Dispositivos", "Categorias", "Produtos", "Usuários", "Pedidos"]) {
      await expect(page.getByRole("link", { name: nome })).toBeVisible();
    }
  });

  test("recolher a sidebar reduz sua largura e o conteúdo ganha espaço; expandir reverte", async ({ page }) => {
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());

    await page.goto("/admin");

    const sidebar = page.locator(".admin-sidebar");
    const larguraExpandida = (await sidebar.boundingBox())?.width ?? 0;

    await page.getByRole("button", { name: "Recolher menu administrativo" }).click();
    // Espera o botão trocar de rótulo (confirma que o estado React já respondeu ao clique) e a
    // transição CSS de width (--transition-base, 300ms) terminar antes de medir.
    await expect(page.getByRole("button", { name: "Expandir menu administrativo" })).toBeVisible();
    await expect
      .poll(async () => (await sidebar.boundingBox())?.width ?? 0)
      .toBeLessThan(larguraExpandida);

    // O nome do link continua acessível mesmo recolhido (texto oculto visualmente, não do DOM).
    await expect(page.getByRole("link", { name: "Dispositivos" })).toBeVisible();

    await page.getByRole("button", { name: "Expandir menu administrativo" }).click();
    await expect(page.getByRole("button", { name: "Recolher menu administrativo" })).toBeVisible();
    await expect
      .poll(async () => (await sidebar.boundingBox())?.width ?? 0)
      .toBeGreaterThan(larguraExpandida - 5);
  });

  test("navegar por um item com a sidebar recolhida funciona normalmente", async ({ page }) => {
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());
    await mockJson(page, "**/api/admin/dispositivos", 200, []);

    await page.goto("/admin");
    await page.getByRole("button", { name: "Recolher menu administrativo" }).click();
    await page.getByRole("link", { name: "Dispositivos" }).click();

    await expect(page).toHaveURL(/\/admin\/dispositivos$/);
    await expect(page.getByRole("heading", { level: 1, name: "Dispositivos" })).toBeVisible();
  });

  test("alternar o tema funciona a partir da topbar do painel administrativo", async ({ page }) => {
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());

    await page.goto("/admin");

    const temaAntes = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await page.getByRole("button", { name: /Alternar para modo/ }).click();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
      .not.toBe(temaAntes);
  });

  test("logout navega para /login e não remove nenhuma sessão de dispositivo (verificado em spec dedicado de TASK-116)", async ({
    page,
  }) => {
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());
    await mockJson(page, "**/api/auth/logout", 204, {});

    await page.goto("/admin");
    await page.getByRole("button", { name: "Sair" }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("Layout administrativo — drawer mobile", () => {
  test("mobile: sidebar fechada por padrão; hambúrguer abre o drawer com backdrop", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());

    await page.goto("/admin");

    await expect(page.locator(".admin-sidebar--mobile-open")).toHaveCount(0);

    await page.getByRole("button", { name: "Abrir menu administrativo" }).click();

    await expect(page.locator(".admin-sidebar--mobile-open")).toHaveCount(1);
    await expect(page.locator(".admin-sidebar__backdrop")).toBeVisible();
  });

  test("mobile: clicar no backdrop fecha o drawer", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());

    await page.goto("/admin");
    await page.getByRole("button", { name: "Abrir menu administrativo" }).click();
    // Clica bem à direita do viewport (375px) — a área coberta pelo drawer (85vw ≈ 319px) fica à
    // esquerda; nesse ponto só o backdrop está por cima, o drawer não intercepta o clique.
    await page.locator(".admin-sidebar__backdrop").click({ position: { x: 360, y: 10 } });

    await expect(page.locator(".admin-sidebar--mobile-open")).toHaveCount(0);
  });

  test("mobile: Escape fecha o drawer", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());

    await page.goto("/admin");
    await page.getByRole("button", { name: "Abrir menu administrativo" }).click();
    await page.keyboard.press("Escape");

    await expect(page.locator(".admin-sidebar--mobile-open")).toHaveCount(0);
  });

  test("mobile: selecionar uma rota no drawer fecha o menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());
    await mockJson(page, "**/api/admin/produtos**", 200, []);
    await mockJson(page, "**/api/admin/restaurantes**", 200, []);
    await mockJson(page, "**/api/admin/categorias**", 200, []);

    await page.goto("/admin");
    await page.getByRole("button", { name: "Abrir menu administrativo" }).click();
    await page.getByRole("link", { name: "Produtos" }).click();

    await expect(page).toHaveURL(/\/admin\/produtos$/);
    await expect(page.locator(".admin-sidebar--mobile-open")).toHaveCount(0);
  });

  test("mobile: sem scroll horizontal no dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());

    await page.goto("/admin");

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);
  });
});

test.describe("Layout administrativo — ADMIN_RESTAURANTE", () => {
  test("sidebar não mostra o link 'Restaurantes'", async ({ page }) => {
    await seedAdminSession(page, adminRestauranteUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());

    await page.goto("/admin");

    await expect(page.getByRole("navigation", { name: "Navegação administrativa" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Restaurantes" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("acesso direto a /admin/restaurantes continua bloqueado pelo RoleGuard mesmo vindo do redirecionamento de login", async ({
    page,
  }) => {
    // Mesmo mecanismo já estável de `login-centralizado.spec.ts` (ProtectedRoute.location.state.from):
    // uma única navegação até a rota protegida (sem sessão) → login → volta à MESMA rota, sem um
    // segundo `page.goto` de tela cheia — evita a instabilidade observada com reloads encadeados.
    await mockJson(page, "**/api/auth/login", 200, loginResponseAdminRestauranteMock());

    await page.goto("/admin/restaurantes");
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("E-mail").fill(adminRestauranteUsuarioMock.email);
    await page.getByLabel("Senha").fill("senha-qualquer-e2e");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/admin\/restaurantes$/);
    await expect(page.getByText(/não tem permissão para acessar esta página/)).toBeVisible();
  });
});
