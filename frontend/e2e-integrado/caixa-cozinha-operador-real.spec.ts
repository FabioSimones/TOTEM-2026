import { expect, test, type Page } from "@playwright/test";
import { consultarPedidoAdmin, prepararCenarioCaixaCozinha } from "./helpers/backendApi";
import { seedRealDeviceSession } from "./helpers/storage";

/**
 * TASK-105: segundo E2E *integrado* — sem mocks, contra backend real. Reaproveita os helpers da
 * TASK-104 (login admin, criar restaurante/categoria/produto/dispositivo) e adiciona operadores e
 * dispositivos CAIXA/COZINHA. O pedido é criado e pago via API real do Totem (não pela UI — o foco
 * desta task é Caixa/Cozinha/operador, não repetir o fluxo do Totem já coberto em
 * `totem-pedido-real.spec.ts`), e dois `BrowserContext` simulam dois terminais físicos diferentes
 * (Caixa e Cozinha) ao mesmo tempo, cada um com sua própria sessão de dispositivo no `localStorage`.
 *
 * Cada ação é escopada ao card do pedido específico (por `numeroPedido`, não por posição na lista)
 * — como os dados se acumulam no banco descartável entre execuções (sem cleanup automatizado), uma
 * busca genérica por "o botão Enviar para cozinha" poderia acertar um pedido de uma execução
 * anterior que ficou pendente.
 */

function cardDoPedido(page: Page, numeroPedido: string) {
  return page.locator("article", { has: page.getByRole("heading", { name: numeroPedido, exact: true }) });
}

test.describe("Caixa → Cozinha → Caixa com operadores reais (E2E integrado, sem mocks)", () => {
  test("pedido PAGO avança até RETIRADO com operador identificado em cada terminal; histórico audita operador+dispositivo", async ({
    browser,
    request,
  }) => {
    const cenario = await prepararCenarioCaixaCozinha(request);

    // ---- Terminal Caixa ----
    const caixaContext = await browser.newContext();
    const caixaPage = await caixaContext.newPage();
    caixaPage.on("dialog", (dialog) => void dialog.accept());
    await seedRealDeviceSession(caixaPage, cenario.caixaAtivado);
    await caixaPage.goto("/caixa");

    // TASK-123.1: desde a TASK-119.2, o intervalo "dispositivo pronto, operador ausente" já monta o
    // `OperationalLayout` (topbar completa) — o conteúdo central é o `OperadorPainel`, identificado
    // pelo seu <h1>, não mais um texto solto "Operador não identificado" da casca antiga.
    await expect(caixaPage.getByRole("heading", { level: 1, name: "Identifique-se para acessar o Caixa" })).toBeVisible();
    await caixaPage.getByLabel("Email do operador").fill(cenario.operadorCaixa.email);
    await caixaPage.getByLabel("Senha").fill(cenario.operadorCaixa.senha);
    await caixaPage.getByRole("button", { name: "Identificar operador" }).click();

    // A identidade do operador aparece na topbar (`OperationalTopbar`), não mais como um texto
    // "Operador: {nome}" solto na página — escopado ao landmark para não colidir com um nome de
    // cliente igual num card de pedido.
    const topbarCaixa = caixaPage.getByRole("banner");
    await expect(topbarCaixa.getByText(cenario.operadorCaixa.nome)).toBeVisible();
    await expect(topbarCaixa.getByRole("button", { name: "Trocar operador" })).toBeVisible();

    const cardCaixaInicial = cardDoPedido(caixaPage, cenario.numeroPedido);
    await expect(cardCaixaInicial).toBeVisible();
    await cardCaixaInicial.getByRole("button", { name: "Enviar para cozinha" }).click();
    await expect(caixaPage.getByText(`Pedido ${cenario.numeroPedido} enviado para a cozinha.`)).toBeVisible();
    await expect(cardDoPedido(caixaPage, cenario.numeroPedido)).toHaveCount(0);

    // ---- Terminal Cozinha ----
    const cozinhaContext = await browser.newContext();
    const cozinhaPage = await cozinhaContext.newPage();
    cozinhaPage.on("dialog", (dialog) => void dialog.accept());
    await seedRealDeviceSession(cozinhaPage, cenario.cozinhaAtivado);
    await cozinhaPage.goto("/cozinha");

    await expect(cozinhaPage.getByRole("heading", { level: 1, name: "Identifique-se para acessar a Cozinha" })).toBeVisible();
    await cozinhaPage.getByLabel("Email do operador").fill(cenario.operadorCozinha.email);
    await cozinhaPage.getByLabel("Senha").fill(cenario.operadorCozinha.senha);
    await cozinhaPage.getByRole("button", { name: "Identificar operador" }).click();

    const topbarCozinha = cozinhaPage.getByRole("banner");
    await expect(topbarCozinha.getByText(cenario.operadorCozinha.nome)).toBeVisible();
    await expect(topbarCozinha.getByRole("button", { name: "Trocar operador" })).toBeVisible();

    const cardCozinha = cardDoPedido(cozinhaPage, cenario.numeroPedido);
    await expect(cardCozinha).toBeVisible();
    await cardCozinha.getByRole("button", { name: "Iniciar preparo" }).click();
    await expect(cardCozinha.getByRole("button", { name: "Marcar como pronto" })).toBeVisible();
    await cardCozinha.getByRole("button", { name: "Marcar como pronto" }).click();
    // Cozinha só lista ENVIADO_PARA_COZINHA/EM_PREPARO — some da lista ao virar PRONTO.
    await expect(cardDoPedido(cozinhaPage, cenario.numeroPedido)).toHaveCount(0);

    // ---- Volta ao terminal Caixa ----
    await caixaPage.getByRole("button", { name: "Atualizar lista" }).click();
    const cardCaixaFinal = cardDoPedido(caixaPage, cenario.numeroPedido);
    await expect(cardCaixaFinal).toBeVisible();
    await cardCaixaFinal.getByRole("button", { name: "Marcar como retirado" }).click();
    await expect(caixaPage.getByText(`Pedido ${cenario.numeroPedido} marcado como retirado.`)).toBeVisible();

    await caixaContext.close();
    await cozinhaContext.close();

    // ---- Validação final via API real: status e histórico com auditoria de operador/dispositivo ----
    const detalhe = await consultarPedidoAdmin(request, cenario.adminAccessToken, cenario.pedidoId);
    expect(detalhe.statusPedido).toBe("RETIRADO");

    const nomeDispositivoCaixa = cenario.caixaAtivado.dispositivo.nome;
    const nomeDispositivoCozinha = cenario.cozinhaAtivado.dispositivo.nome;

    const envio = detalhe.historico.find((h) => h.statusNovo === "ENVIADO_PARA_COZINHA");
    expect(envio?.alteradoPorUsuarioNome).toBe(cenario.operadorCaixa.nome);
    expect(envio?.alteradoPorDispositivoNome).toBe(nomeDispositivoCaixa);

    const emPreparo = detalhe.historico.find((h) => h.statusNovo === "EM_PREPARO");
    expect(emPreparo?.alteradoPorUsuarioNome).toBe(cenario.operadorCozinha.nome);
    expect(emPreparo?.alteradoPorDispositivoNome).toBe(nomeDispositivoCozinha);

    const pronto = detalhe.historico.find((h) => h.statusNovo === "PRONTO");
    expect(pronto?.alteradoPorUsuarioNome).toBe(cenario.operadorCozinha.nome);
    expect(pronto?.alteradoPorDispositivoNome).toBe(nomeDispositivoCozinha);

    const retirado = detalhe.historico.find((h) => h.statusNovo === "RETIRADO");
    expect(retirado?.alteradoPorUsuarioNome).toBe(cenario.operadorCaixa.nome);
    expect(retirado?.alteradoPorDispositivoNome).toBe(nomeDispositivoCaixa);
  });
});
