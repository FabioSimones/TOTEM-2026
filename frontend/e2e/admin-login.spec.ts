import { expect, test } from "@playwright/test";
import { loginResponseMock, mockJson, superAdminUsuarioMock } from "./helpers/mockApi";

test.describe("Login administrativo (mockado)", () => {
  test("login com credenciais válidas redireciona para /admin e mostra o usuário autenticado", async ({ page }) => {
    await mockJson(page, "**/api/auth/login", 200, loginResponseMock());

    await page.goto("/admin/login");

    await expect(page.getByRole("heading", { name: "Login Administrativo" })).toBeVisible();

    await page.getByLabel("E-mail").fill(superAdminUsuarioMock.email);
    await page.getByLabel("Senha").fill("senha-qualquer-e2e");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText(superAdminUsuarioMock.nome)).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("credenciais inválidas mostram mensagem de erro e permanecem em /admin/login", async ({ page }) => {
    await mockJson(page, "**/api/auth/login", 401, {
      timestamp: "2026-01-01T00:00:00Z",
      status: 401,
      error: "Unauthorized",
      message: "E-mail ou senha inválidos.",
      path: "/api/auth/login",
    });

    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill("errado@totem.local");
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert")).toHaveText("E-mail ou senha inválidos.");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
