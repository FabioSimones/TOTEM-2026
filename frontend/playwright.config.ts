import { defineConfig, devices } from "@playwright/test";

/**
 * TASK-102: primeira suíte E2E do frontend. Usa 127.0.0.1 (não "localhost") de forma consistente
 * entre webServer e baseURL — localStorage é isolado por origem (esquema+host+porta), então um
 * mismatch de host faria a sessão injetada via addInitScript não aparecer para a página.
 *
 * Todos os testes mockam a API via `page.route` (ver `e2e/helpers/mockApi.ts`) — nenhum depende de
 * um backend real rodando. Isso mantém a suíte determinística e rápida, ao custo de não validar a
 * integração real com o backend (fica para uma task futura, ver `frontend/README.md`).
 */
const HOST = "127.0.0.1";
const PORT = 5173;
const baseURL = `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host ${HOST} --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
