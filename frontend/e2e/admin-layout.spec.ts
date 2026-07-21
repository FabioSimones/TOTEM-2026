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

/** TASK-122: usuários suficientes para o conteúdo principal (`/admin/usuarios`) ultrapassar várias
 * telas de altura — usado para validar que a coluna lateral (`.admin-sidebar-column`) acompanha
 * toda a extensão do documento, sem faixa vazia, enquanto o conteúdo interno (`nav.admin-sidebar`)
 * permanece sticky/visível durante a rolagem. Mesma estratégia geométrica já validada em
 * `totem-redesign.spec.ts` (TASK-120.5) — boundingBox/scrollHeight, nunca screenshot. */
function usuarioLongoMock(id: number) {
  return {
    id,
    restauranteId: null,
    nome: `Usuário Longo ${id} E2E`,
    email: `usuario.longo.${id}@totem.local`,
    perfil: "SUPER_ADMIN" as const,
    ativo: true,
    criadoEm: "2026-01-01T00:00:00Z",
    atualizadoEm: null,
  };
}

async function abrirUsuariosComPaginaLonga(page: import("@playwright/test").Page) {
  await seedAdminSession(page, superAdminUsuarioMock);
  await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());
  await mockJson(page, "**/api/admin/restaurantes", 200, []);
  await mockJson(
    page,
    "**/api/admin/usuarios**",
    200,
    Array.from({ length: 40 }, (_, i) => usuarioLongoMock(i + 1)),
  );
  await page.goto("/admin/usuarios");
  // Garante que a listagem (assíncrona) já renderizou os 40 usuários antes de medir o documento —
  // sem isso, `scrollHeight` é lido ainda com a lista vazia (só sidebar/topbar de uma tela).
  await page.getByText("Usuário Longo 40 E2E").waitFor();
  // Espera as fontes carregarem: sem isso, a métrica de altura pode ser lida entre dois reflows
  // (fonte de fallback → fonte definitiva), tornando `scrollHeight` instável entre duas leituras.
  await page.evaluate(() => document.fonts.ready);
}

test.describe("Layout administrativo — continuidade vertical da sidebar em páginas longas (TASK-122, mockado)", () => {
  async function medir(page: import("@playwright/test").Page) {
    return page.evaluate(() => {
      const coluna = document.querySelector(".admin-sidebar-column")!;
      const caixa = coluna.getBoundingClientRect();
      return {
        alturaColuna: caixa.height,
        // Convertido para coordenadas absolutas do documento (não relativas ao viewport atual),
        // para poder comparar com `scrollY + innerHeight` depois de rolar.
        topoColunaDocumento: caixa.top + window.scrollY,
        alturaDocumento: document.documentElement.scrollHeight,
      };
    });
  }

  test("conteúdo principal ultrapassa a altura da viewport com muitos usuários", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirUsuariosComPaginaLonga(page);

    const { alturaDocumento } = await medir(page);
    expect(alturaDocumento).toBeGreaterThan(900 * 1.5);
  });

  test("a coluna lateral acompanha toda a altura do documento — sem faixa vazia no final da página", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirUsuariosComPaginaLonga(page);

    const inicial = await medir(page);
    // A coluna deve ocupar (ao menos) toda a altura relevante do documento, não só uma viewport.
    expect(inicial.alturaColuna).toBeGreaterThanOrEqual(inicial.alturaDocumento - 4);

    await page.mouse.wheel(0, inicial.alturaDocumento);
    await expect
      .poll(async () => (await medir(page)).alturaColuna)
      .toBeGreaterThanOrEqual(inicial.alturaDocumento - 4);

    // Depois de rolar até o fim, a última posição visível do documento ainda deve estar coberta
    // pela coluna — ou seja, o fundo lateral não "acaba" antes do fim da lista.
    const final = await medir(page);
    const scrollYFinal = await page.evaluate(() => window.scrollY + window.innerHeight);
    expect(final.topoColunaDocumento + final.alturaColuna).toBeGreaterThanOrEqual(
      Math.min(scrollYFinal, final.alturaDocumento) - 4,
    );
  });

  test("o conteúdo interno (nav) permanece sticky e visível após rolar até o final da página", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirUsuariosComPaginaLonga(page);

    const nav = page.getByRole("navigation", { name: "Navegação administrativa" });
    await expect(nav).toBeInViewport();

    const { alturaDocumento } = await medir(page);
    await page.mouse.wheel(0, alturaDocumento);

    await expect(nav).toBeInViewport();
    await expect(page.getByRole("link", { name: "Usuários" })).toBeVisible();
  });

  test("recolhida: a coluna também acompanha toda a altura do documento", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirUsuariosComPaginaLonga(page);

    await page.getByRole("button", { name: "Recolher menu administrativo" }).click();
    await expect(page.getByRole("button", { name: "Expandir menu administrativo" })).toBeVisible();

    const recolhida = await medir(page);
    expect(recolhida.alturaColuna).toBeGreaterThanOrEqual(recolhida.alturaDocumento - 4);

    // Expandir de volta preserva o mesmo comportamento.
    await page.getByRole("button", { name: "Expandir menu administrativo" }).click();
    await expect(page.getByRole("button", { name: "Recolher menu administrativo" })).toBeVisible();
    const expandida = await medir(page);
    expect(expandida.alturaColuna).toBeGreaterThanOrEqual(expandida.alturaDocumento - 4);
  });

  test("sem scroll horizontal e sem rolagem dupla problemática em página longa", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirUsuariosComPaginaLonga(page);

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);

    // A navegação da sidebar só rola internamente quando excede sua própria altura disponível —
    // com os 7 itens fixos do menu administrativo, ela não deve ter overflow vertical próprio.
    const overflowNav = await page
      .locator("nav.admin-sidebar")
      .evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(overflowNav).toBeLessThanOrEqual(0);
  });

  test("dashboard curto: a coluna preenche pelo menos a viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());

    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();

    const { alturaColuna } = await medir(page);
    expect(alturaColuna).toBeGreaterThanOrEqual(880);
  });

  test("dark: a coluna lateral continua contínua e visível em página longa", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirUsuariosComPaginaLonga(page);

    // Define o tema diretamente via atributo — o alvo aqui é validar que a coluna lateral continua
    // contínua sob o tema escuro, não a mecânica do botão de alternância (coberta em outro teste).
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));

    const { alturaColuna, alturaDocumento } = await medir(page);
    expect(alturaColuna).toBeGreaterThanOrEqual(alturaDocumento - 4);
  });

  test("mobile: página longa não cria coluna lateral permanente; drawer continua funcional", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await abrirUsuariosComPaginaLonga(page);

    const caixaColuna = await page.locator(".admin-sidebar-column").boundingBox();
    // No mobile a coluna recolhe a zero — não deve reservar espaço lateral atrás do drawer fechado.
    expect(caixaColuna?.width ?? 0).toBeLessThanOrEqual(1);

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);

    await page.getByRole("button", { name: "Abrir menu administrativo" }).click();
    const nav = page.getByRole("navigation", { name: "Navegação administrativa" });
    await expect(nav).toBeInViewport();

    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(nav).not.toBeInViewport();
  });

  test("ADMIN_RESTAURANTE: coluna acompanha o layout com o conjunto reduzido de itens", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedAdminSession(page, adminRestauranteUsuarioMock);
    await mockJson(page, "**/api/admin/dashboard", 200, dashboardAdminResumoMock());

    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "Restaurantes" })).toHaveCount(0);

    const { alturaColuna, alturaDocumento } = await medir(page);
    expect(alturaColuna).toBeGreaterThanOrEqual(alturaDocumento - 4);
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
