import { defineConfig, devices } from "@playwright/test";

/**
 * TASK-104: config separado da suíte E2E mockada (`playwright.config.ts`/`e2e/`) — os dois nunca
 * devem rodar no mesmo comando. Esta suíte (`e2e-integrado/`) não mocka nenhuma chamada de API: o
 * frontend real conversa com um backend real já rodando (ver `global-setup.ts` e
 * `frontend/README.md` seção "E2E integrado" para os pré-requisitos).
 *
 * Porta 5174 (não 5173) deliberadamente diferente da suíte mockada, para não colidir se as duas
 * forem executadas em sequência na mesma máquina. `webServer` só sobe o frontend (Vite) — o backend
 * nunca é iniciado por este config, precisa já estar de pé.
 */
const HOST = "127.0.0.1";
const PORT = 5174;
const baseURL = `http://${HOST}:${PORT}`;
const backendUrl = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:8080";

export default defineConfig({
  testDir: "./e2e-integrado",
  globalSetup: "./e2e-integrado/global-setup.ts",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["html", { outputFolder: "playwright-report-integrado", open: "never" }]],
  outputDir: "test-results-integrado",
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
    env: {
      VITE_API_BASE_URL: backendUrl,
    },
  },
});
