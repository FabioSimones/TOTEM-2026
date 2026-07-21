import { expect, test } from "@playwright/test";
import { mockJson, superAdminUsuarioMock } from "./helpers/mockApi";
import { seedAdminSession } from "./helpers/storage";

/**
 * TASK-119.1 — corrige a sobreposição de e-mail/perfil/restaurante nos cards de `/admin/usuarios`
 * (a `dl.pedido-pendente-card__detalhes` compartilhada com Caixa/Cozinha formava 2-3 colunas
 * estreitas demais para esses valores). Este spec confirma, no navegador real, que os três campos
 * ficam em blocos separados e que nenhum texto longo gera overlap/scroll horizontal.
 */
const restaurantesMock = [
  {
    id: 1,
    nome: "Restaurante com Nome Bastante Longo para Testar Quebra de Linha Ltda",
    cnpj: "12345678000199",
    endereco: null,
    ativo: true,
    criadoEm: "2026-01-01T00:00:00Z",
    atualizadoEm: "2026-01-01T00:00:00Z",
  },
];

const usuariosMock = [
  {
    id: 1,
    restauranteId: null,
    nome: "Admin Geral",
    email: "admin.local@totem.local",
    perfil: "SUPER_ADMIN",
    ativo: true,
    criadoEm: "2026-01-01T00:00:00Z",
    atualizadoEm: null,
  },
  {
    id: 2,
    restauranteId: 1,
    nome: "Responsável do Restaurante",
    email: "responsavel.do.restaurante.com.email.bem.longo@totem-fastfood.local",
    perfil: "ADMIN_RESTAURANTE",
    ativo: true,
    criadoEm: "2026-01-01T00:00:00Z",
    atualizadoEm: null,
  },
  {
    id: 3,
    restauranteId: 1,
    nome: "Operador Caixa 01",
    email: "caixa01@totem.local",
    perfil: "OPERADOR_CAIXA",
    ativo: true,
    criadoEm: "2026-01-01T00:00:00Z",
    atualizadoEm: null,
  },
  {
    id: 4,
    restauranteId: 1,
    nome: "Operador Cozinha 01",
    email: "cozinha01@totem.local",
    perfil: "OPERADOR_COZINHA",
    ativo: true,
    criadoEm: "2026-01-01T00:00:00Z",
    atualizadoEm: null,
  },
];

async function abrirUsuarios(page: import("@playwright/test").Page) {
  await seedAdminSession(page, superAdminUsuarioMock);
  await mockJson(page, "**/api/admin/restaurantes", 200, restaurantesMock);
  await mockJson(page, "**/api/admin/usuarios**", 200, usuariosMock);
  await page.goto("/admin/usuarios");
  await expect(page.getByText("admin.local@totem.local")).toBeVisible();
}

test.describe("Cards de Usuários — layout dos dados (TASK-119.1)", () => {
  test("E-mail, Perfil e Restaurante aparecem em blocos separados, com rótulo e valor", async ({ page }) => {
    await abrirUsuarios(page);

    const card = page.locator(".pedido-pendente-card", { hasText: "admin.local@totem.local" });
    const campos = card.locator(".usuario-card__campo");
    await expect(campos).toHaveCount(3);

    await expect(campos.nth(0).locator(".usuario-card__rotulo")).toHaveText("E-mail");
    await expect(campos.nth(0).locator(".usuario-card__valor")).toHaveText("admin.local@totem.local");
    await expect(campos.nth(1).locator(".usuario-card__rotulo")).toHaveText("Perfil");
    await expect(campos.nth(1).locator(".usuario-card__valor")).toHaveText("Super administrador");
    await expect(campos.nth(2).locator(".usuario-card__rotulo")).toHaveText("Restaurante");
    await expect(campos.nth(2).locator(".usuario-card__valor")).toHaveText("—");
  });

  test("perfil amigável nunca mostra o enum técnico, para nenhum dos 4 perfis", async ({ page }) => {
    await abrirUsuarios(page);

    await expect(page.getByText("Super administrador")).toBeVisible();
    await expect(page.getByText("Administrador do restaurante")).toBeVisible();
    await expect(page.getByText("Operador de caixa")).toBeVisible();
    await expect(page.getByText("Operador de cozinha")).toBeVisible();
    for (const enumTecnico of ["SUPER_ADMIN", "ADMIN_RESTAURANTE", "OPERADOR_CAIXA", "OPERADOR_COZINHA"]) {
      await expect(page.getByText(enumTecnico, { exact: true })).toHaveCount(0);
    }
  });

  test("e-mail e restaurante longos ficam totalmente visíveis, sem cortar", async ({ page }) => {
    await abrirUsuarios(page);

    const emailLongo = "responsavel.do.restaurante.com.email.bem.longo@totem-fastfood.local";
    await expect(page.getByText(emailLongo)).toBeVisible();
    await expect(
      page.getByText("Restaurante com Nome Bastante Longo para Testar Quebra de Linha Ltda").first(),
    ).toBeVisible();
  });

  test("desktop: nenhum card gera scroll horizontal (scrollWidth <= clientWidth)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirUsuarios(page);

    const larguras = await page.locator(".pedido-pendente-card").evaluateAll((cards) =>
      cards.map((card) => ({ scrollWidth: card.scrollWidth, clientWidth: card.clientWidth })),
    );
    expect(larguras.length).toBeGreaterThan(0);
    for (const { scrollWidth, clientWidth } of larguras) {
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    }
    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);
  });

  test("mobile (375px): mesmo card com e-mail longo sem scroll horizontal nem overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await abrirUsuarios(page);

    const larguras = await page.locator(".pedido-pendente-card").evaluateAll((cards) =>
      cards.map((card) => ({ scrollWidth: card.scrollWidth, clientWidth: card.clientWidth })),
    );
    for (const { scrollWidth, clientWidth } of larguras) {
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    }
    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);

    await expect(page.getByRole("button", { name: "Editar" }).first()).toBeVisible();
  });

  test("botões de ação continuam presentes e funcionais após a mudança de layout", async ({ page }) => {
    await abrirUsuarios(page);

    const card = page.locator(".pedido-pendente-card", { hasText: "caixa01@totem.local" });
    await expect(card.getByRole("button", { name: "Editar" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Desativar" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Alterar senha" })).toBeVisible();
  });
});
