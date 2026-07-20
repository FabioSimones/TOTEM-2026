import { expect, test } from "@playwright/test";
import { mockJson, superAdminUsuarioMock } from "./helpers/mockApi";
import { seedAdminSession } from "./helpers/storage";

/**
 * TASK-115: cobertura mockada (não exaustiva — cada formulário tem cobertura mais completa em
 * Vitest) do fluxo ponta a ponta de validação inline: abrir modal, submeter vazio, ver erro perto
 * do campo, confirmar que o foco vai para o primeiro campo inválido, corrigir e salvar.
 */
test.describe("Validação inline nos formulários administrativos (mockado)", () => {
  test("Restaurante: submit vazio mostra erro inline, foca o campo e permite corrigir e salvar", async ({ page }) => {
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/restaurantes", 200, []);

    await page.goto("/admin/restaurantes");
    await page.getByRole("button", { name: "Novo restaurante" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cadastrar restaurante" }).click();

    const erroNome = dialog.getByText("Informe o nome do restaurante.");
    await expect(erroNome).toBeVisible();
    await expect(dialog.getByLabel("Nome")).toBeFocused();
    await expect(dialog.getByLabel("Nome")).toHaveAttribute("aria-invalid", "true");

    const restauranteCriado = {
      id: 50,
      nome: "Totem Burger E2E",
      cnpj: "12345678000199",
      endereco: null,
      ativo: true,
      criadoEm: "2026-01-01T00:00:00Z",
      atualizadoEm: "2026-01-01T00:00:00Z",
    };
    await mockJson(page, "**/api/admin/restaurantes", 201, restauranteCriado);

    await dialog.getByLabel("Nome").fill("Totem Burger E2E");
    await dialog.getByLabel("CNPJ").fill("12345678000199");
    await dialog.getByRole("button", { name: "Cadastrar restaurante" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("Produto: submit sem campos obrigatórios mostra erros inline, mantém o modal aberto e foca o primeiro campo inválido", async ({
    page,
  }) => {
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/restaurantes", 200, [
      {
        id: 1,
        nome: "Totem Burger",
        cnpj: "12345678000199",
        endereco: null,
        ativo: true,
        criadoEm: "2026-01-01T00:00:00Z",
        atualizadoEm: "2026-01-01T00:00:00Z",
      },
    ]);
    await mockJson(page, "**/api/admin/categorias**", 200, [
      { id: 5, restauranteId: 1, nome: "Lanches", descricao: null, ordemExibicao: 1, ativa: true },
    ]);
    await mockJson(page, "**/api/admin/produtos**", 200, []);

    await page.goto("/admin/produtos");
    await page.getByRole("button", { name: "Novo produto" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cadastrar produto" }).click();

    await expect(dialog.getByText("Informe o nome do produto.")).toBeVisible();
    await expect(dialog.getByText("Informe um preço válido maior que zero.")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(dialog.getByLabel("Nome")).toBeFocused();
  });

  test("Usuário: e-mail inválido mostra mensagem acessível; ao corrigir, o cadastro prossegue", async ({ page }) => {
    await seedAdminSession(page, superAdminUsuarioMock);
    await mockJson(page, "**/api/admin/restaurantes", 200, [
      {
        id: 1,
        nome: "Totem Burger",
        cnpj: "12345678000199",
        endereco: null,
        ativo: true,
        criadoEm: "2026-01-01T00:00:00Z",
        atualizadoEm: "2026-01-01T00:00:00Z",
      },
    ]);
    await mockJson(page, "**/api/admin/usuarios**", 200, []);

    await page.goto("/admin/usuarios");
    await page.getByRole("button", { name: "Novo usuário" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("Nome").fill("Maria Operadora");
    await dialog.getByLabel("Email").fill("email-invalido");
    await dialog.getByLabel("Senha").fill("senha12345");
    await dialog.getByRole("button", { name: "Cadastrar usuário" }).click();

    const erroEmail = dialog.getByText(/Informe um e-mail válido/);
    await expect(erroEmail).toBeVisible();
    await expect(dialog.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");

    const usuarioCriado = {
      id: 30,
      restauranteId: 1,
      nome: "Maria Operadora",
      email: "maria@totem.local",
      perfil: "OPERADOR_CAIXA",
      ativo: true,
      criadoEm: "2026-01-01T00:00:00Z",
      atualizadoEm: null,
    };
    await mockJson(page, "**/api/admin/usuarios", 201, usuarioCriado);

    await dialog.getByLabel("Email").fill("maria@totem.local");
    await dialog.getByRole("button", { name: "Cadastrar usuário" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
