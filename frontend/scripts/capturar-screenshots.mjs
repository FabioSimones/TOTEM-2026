// TASK-124.1: script standalone de captura de screenshots — deliberadamente FORA da suíte de
// testes (não usa `playwright test`, não lê `playwright.config.ts`, não depende de `webServer`).
// Conecta-se a um frontend/backend JÁ em execução (o usuário mantém os serviços de pé — este
// script nunca inicia nada) e produz PNGs reais em `docs/screenshots/` para uso no README e no
// material de portfólio.
//
// Uso:
//   node scripts/capturar-screenshots.mjs
//
// Variáveis de ambiente (todas opcionais; sem elas, só as telas públicas são capturadas):
//   SCREENSHOT_BASE_URL          — default http://localhost:5173
//   SCREENSHOT_ADMIN_EMAIL       — login de SUPER_ADMIN/ADMIN_RESTAURANTE
//   SCREENSHOT_ADMIN_PASSWORD    — senha correspondente
//   SCREENSHOT_DEVICE_TOKEN      — código de ativação de um dispositivo já cadastrado (Totem/Caixa/Cozinha)
//   SCREENSHOT_OPERATOR_EMAIL    — login de operador (Caixa/Cozinha)
//   SCREENSHOT_OPERATOR_PASSWORD — senha do operador
//
// Nenhuma credencial é impressa, logada ou salva em disco por este script.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "..", "..", "docs", "screenshots");
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:5173";

const ADMIN_EMAIL = process.env.SCREENSHOT_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SCREENSHOT_ADMIN_PASSWORD;

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MOBILE_VIEWPORT = { width: 375, height: 812 };

async function verificarServico(url, nome) {
  try {
    const resposta = await fetch(url, { signal: AbortSignal.timeout(3000) });
    console.log(`[ok] ${nome} respondeu (${resposta.status}) em ${url}`);
    return true;
  } catch (erro) {
    console.log(`[bloqueado] ${nome} não respondeu em ${url} (${erro.message}). Este script NUNCA inicia serviços.`);
    return false;
  }
}

async function capturar(page, nomeArquivo, { seletorEspera } = {}) {
  if (seletorEspera) {
    await page.waitForSelector(seletorEspera, { state: "visible", timeout: 10_000 });
  }
  const destino = path.join(OUTPUT_DIR, nomeArquivo);
  await page.screenshot({ path: destino, fullPage: false });
  console.log(`[captura] ${nomeArquivo}`);
}

async function alternarParaTemaClaro(page) {
  const temaAtual = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  if (temaAtual === "light") return;
  await page.getByRole("button", { name: /Alternar para modo/ }).click();
  await page.waitForFunction(
    () => document.documentElement.getAttribute("data-theme") === "light",
    { timeout: 3000 },
  );
}

async function capturarTelasPublicas(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);

  // ---- Login (tema escuro, padrão da aplicação) ----
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await capturar(page, "login-dark.png", { seletorEspera: "text=Acesse sua conta" });

  // ---- Login (tema claro) ----
  await alternarParaTemaClaro(page);
  await capturar(page, "login-light.png");

  // ---- Ativação de dispositivo ----
  await page.goto(`${BASE_URL}/ativar-dispositivo`, { waitUntil: "networkidle" });
  await capturar(page, "ativacao-dispositivo.png", { seletorEspera: "text=Ativar Dispositivo" });

  await page.close();
}

async function capturarAdmin(context) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("[pendente] SCREENSHOT_ADMIN_EMAIL/SCREENSHOT_ADMIN_PASSWORD não definidas — telas administrativas não capturadas.");
    return;
  }

  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("E-mail").fill(ADMIN_EMAIL);
  await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/admin/, { timeout: 10_000 });

  await capturar(page, "dashboard-admin-dark.png", { seletorEspera: "role=navigation" });

  await page.goto(`${BASE_URL}/admin/restaurantes`, { waitUntil: "networkidle" });
  await capturar(page, "admin-restaurantes.png", { seletorEspera: "role=heading" });

  await page.goto(`${BASE_URL}/admin/dispositivos`, { waitUntil: "networkidle" });
  await capturar(page, "admin-dispositivos.png", { seletorEspera: "role=heading" });

  await page.goto(`${BASE_URL}/admin/categorias`, { waitUntil: "networkidle" });
  await capturar(page, "admin-categorias.png", { seletorEspera: "role=heading" });

  await page.goto(`${BASE_URL}/admin/produtos`, { waitUntil: "networkidle" });
  await capturar(page, "admin-produtos.png", { seletorEspera: "role=heading" });

  await page.goto(`${BASE_URL}/admin/usuarios`, { waitUntil: "networkidle" });
  await capturar(page, "admin-usuarios.png", { seletorEspera: "role=heading" });

  await page.goto(`${BASE_URL}/admin/pedidos`, { waitUntil: "networkidle" });
  await capturar(page, "admin-pedidos.png", { seletorEspera: "role=heading" });

  // Mobile do dashboard, mesma sessão.
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
  await capturar(page, "mobile-admin.png", { seletorEspera: "role=navigation" });
  await page.setViewportSize(DESKTOP_VIEWPORT);

  await page.close();
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const backendOk = await verificarServico("http://127.0.0.1:8080/actuator/health", "backend");
  const frontendOk = await verificarServico(BASE_URL, "frontend");

  if (!frontendOk) {
    console.log("Frontend inacessível — nenhuma captura pode ser produzida. Verifique se o Vite está de pé e ajuste SCREENSHOT_BASE_URL se necessário.");
    process.exitCode = 1;
    return;
  }
  if (!backendOk) {
    console.log("[aviso] backend não respondeu — telas que dependem de API (login, dashboard) podem falhar.");
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT, deviceScaleFactor: 2 });

  try {
    await capturarTelasPublicas(context);
    await capturarAdmin(context);
    // Totem/Caixa/Cozinha dependem de um código de ativação de dispositivo real
    // (SCREENSHOT_DEVICE_TOKEN) — não implementado ainda porque nenhum código estava disponível
    // nesta execução; ver docs/screenshots/README.md para o estado pendente.
  } finally {
    await context.close();
    await browser.close();
  }

  console.log("Concluído.");
}

main().catch((erro) => {
  console.error("Falha ao capturar screenshots:", erro.message);
  process.exitCode = 1;
});
