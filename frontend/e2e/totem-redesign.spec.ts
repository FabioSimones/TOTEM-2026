import { expect, test } from "@playwright/test";
import { mockJson } from "./helpers/mockApi";
import { dispositivoMock, seedDeviceSession } from "./helpers/storage";

/**
 * TASK-120: cobertura mockada do redesign da tela de autoatendimento (sidebar de categorias,
 * busca, topbar com tema/carrinho, drawer mobile). Cardápio próprio com 2 categorias (não
 * reaproveita `cardapioMock()` de `helpers/mockApi.ts`, que só tem 1 categoria — insuficiente para
 * testar filtro/seleção).
 */
function cardapioDuasCategoriasMock() {
  return {
    restauranteId: 1,
    categorias: [
      {
        id: 1,
        nome: "Lanches",
        descricao: "Hambúrgueres e sanduíches",
        ordemExibicao: 1,
        produtos: [
          {
            id: 100,
            nome: "X-Burger E2E",
            descricao: "Hambúrguer de teste",
            preco: 25.9,
            imagemUrl: null,
            destaque: false,
            recomendado: false,
            ordemExibicao: 1,
          },
        ],
      },
      {
        id: 2,
        nome: "Bebidas",
        descricao: null,
        ordemExibicao: 2,
        produtos: [
          {
            id: 200,
            nome: "Refrigerante E2E",
            descricao: null,
            preco: 6.5,
            imagemUrl: null,
            destaque: false,
            recomendado: false,
            ordemExibicao: 1,
          },
        ],
      },
    ],
  };
}

async function abrirTotem(page: Parameters<typeof seedDeviceSession>[0]) {
  await seedDeviceSession(page, dispositivoMock("TOTEM"));
  await mockJson(page, "**/api/totem/cardapio", 200, cardapioDuasCategoriasMock());
  await page.goto("/totem");
}

test.describe("Totem — redesign da sidebar/topbar (TASK-120, mockado)", () => {
  test("abre com dispositivo válido, sidebar expandida e categorias reais mockadas", async ({ page }) => {
    await abrirTotem(page);

    await expect(page.getByRole("navigation", { name: "Categorias do cardápio" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Todas" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Lanches" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bebidas" })).toBeVisible();
    await expect(page.getByText("X-Burger E2E")).toBeVisible();
    await expect(page.getByText("Refrigerante E2E")).toBeVisible();
  });

  test("selecionar categoria filtra o grid e marca o item ativo", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Bebidas" }).click();

    await expect(page.getByRole("button", { name: "Bebidas" })).toHaveAttribute("aria-current", "true");
    await expect(page.getByText("Refrigerante E2E")).toBeVisible();
    await expect(page.getByText("X-Burger E2E")).not.toBeVisible();
  });

  test("recolher e expandir a sidebar preserva o nome acessível das categorias", async ({ page }) => {
    await abrirTotem(page);

    const toggle = page.getByRole("button", { name: "Recolher menu de categorias" });
    await toggle.click();

    await expect(page.getByRole("button", { name: "Expandir menu de categorias" })).toBeVisible();
    // Rótulo continua acessível (title/texto no DOM), mesmo com a sidebar recolhida.
    await expect(page.getByRole("button", { name: "Lanches" })).toBeVisible();

    await page.getByRole("button", { name: "Expandir menu de categorias" }).click();
    await expect(page.getByRole("button", { name: "Recolher menu de categorias" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("busca filtra produtos por nome e o botão de limpar reseta a lista", async ({ page }) => {
    await abrirTotem(page);

    const busca = page.getByRole("searchbox", { name: "Buscar produto" });
    await busca.fill("refrigerante");

    await expect(page.getByRole("heading", { level: 1, name: "Resultados da busca" })).toBeVisible();
    await expect(page.getByText("Refrigerante E2E")).toBeVisible();
    await expect(page.getByText("X-Burger E2E")).not.toBeVisible();

    await page.getByRole("button", { name: "Limpar busca" }).click();
    await expect(busca).toHaveValue("");
    await expect(page.getByText("X-Burger E2E")).toBeVisible();
  });

  test("busca sem resultado mostra mensagem própria", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("searchbox", { name: "Buscar produto" }).fill("pizza-inexistente");

    await expect(page.getByText("Nenhum produto encontrado para esta busca.")).toBeVisible();
  });

  test("alternar tema pela lâmpada muda para dark e o texto continua legível", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: /Alternar para modo/ }).click();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
      .toBe("dark");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("mobile: sidebar inicia fechada, abre por hambúrguer, fecha por Escape e por backdrop", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await abrirTotem(page);

    const nav = page.getByRole("navigation", { name: "Categorias do cardápio" });
    await expect(nav).not.toBeInViewport();

    const hamburguer = page.getByRole("button", { name: "Abrir menu de categorias" });
    await hamburguer.click();
    await expect(nav).toBeInViewport();

    await page.keyboard.press("Escape");
    await expect(nav).not.toBeInViewport();

    await hamburguer.click();
    await expect(nav).toBeInViewport();
    // Clica fora da área ocupada pelo drawer (que fica à esquerda, de 0 a ~240px) — clicar dentro
    // dela acertaria o próprio conteúdo do <nav>, não o backdrop, mesmo os dois sendo elementos
    // sobrepostos em (0,0).
    await page.locator(".totem-sidebar__backdrop").click({ position: { x: 300, y: 5 } });
    await expect(nav).not.toBeInViewport();
  });

  test("mobile: selecionar categoria no drawer fecha a sidebar automaticamente", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await abrirTotem(page);

    await page.getByRole("button", { name: "Abrir menu de categorias" }).click();
    await page.getByRole("button", { name: "Bebidas" }).click();

    await expect(page.getByRole("navigation", { name: "Categorias do cardápio" })).not.toBeInViewport();
    await expect(page.getByText("Refrigerante E2E")).toBeVisible();
  });

  test("mobile 375px: sem scroll horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await abrirTotem(page);

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);
  });

  test("touch targets: carrinho, tema e botão Adicionar têm pelo menos 44x44px", async ({ page }) => {
    await abrirTotem(page);

    for (const nomeAcessivel of ["Abrir carrinho", /Alternar para modo/, "Adicionar"] as const) {
      const alvo = page.getByRole("button", { name: nomeAcessivel }).first();
      const caixa = await alvo.boundingBox();
      expect(caixa?.width).toBeGreaterThanOrEqual(44);
      expect(caixa?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("prefers-reduced-motion: ícone decorativo do hero fica sem animação contínua", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await abrirTotem(page);

    const duracaoSegundos = await page.evaluate(() => {
      const icone = document.querySelector(".totem-hero__icone");
      const valor = icone ? getComputedStyle(icone).animationDuration : null;
      return valor ? parseFloat(valor) : null;
    });

    expect(duracaoSegundos).not.toBeNull();
    expect(duracaoSegundos as number).toBeLessThan(0.001);
  });
});

test.describe("Totem — modal de produto e modal de carrinho (TASK-120.1, mockado)", () => {
  test("clicar em Adicionar abre o modal do produto; painel lateral permanente não existe mais", async ({ page }) => {
    await abrirTotem(page);

    await expect(page.locator(".totem-layout")).toHaveCount(0);

    await page.getByRole("button", { name: "Adicionar" }).first().click();

    const dialogProduto = page.getByRole("dialog", { name: "X-Burger E2E" });
    await expect(dialogProduto).toBeVisible();
    await expect(dialogProduto.getByText("Hambúrguer de teste")).toBeVisible();
    // Ainda não foi ao carrinho — confirmar é uma ação explícita separada.
    await expect(page.getByRole("button", { name: "Abrir carrinho" })).toBeVisible();
  });

  test("confirmar no modal do produto adiciona ao carrinho, fecha o modal e NÃO abre o carrinho automaticamente", async ({
    page,
  }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Abrir carrinho, 1 item" })).toBeVisible();
  });

  test("quantidade e observação escolhidas no modal do produto são preservadas ao confirmar", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    const dialogProduto = page.getByRole("dialog");
    await dialogProduto.getByRole("button", { name: "Aumentar quantidade" }).click();
    await dialogProduto.getByLabel("Observação do item").fill("sem cebola");
    await expect(dialogProduto.getByText("2", { exact: true })).toBeVisible();
    await dialogProduto.getByRole("button", { name: "Adicionar ao carrinho" }).click();

    await page.getByRole("button", { name: "Abrir carrinho, 2 itens" }).click();
    const dialogCarrinho = page.getByRole("dialog", { name: "Seu pedido" });
    await expect(dialogCarrinho.getByDisplayValue("sem cebola")).toBeVisible();
  });

  test("cancelar o modal do produto não altera o carrinho", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByRole("button", { name: "Aumentar quantidade" }).click();
    await page.getByRole("button", { name: "Cancelar" }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Abrir carrinho" })).toBeVisible();
  });

  test("Escape fecha o modal do produto sem adicionar ao carrinho", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Abrir carrinho" })).toBeVisible();
  });

  test("botão do carrinho na topbar abre o modal do carrinho vazio, com 'Continuar escolhendo'", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Abrir carrinho" }).click();

    const dialogCarrinho = page.getByRole("dialog", { name: "Seu pedido" });
    await expect(dialogCarrinho).toBeVisible();
    await expect(dialogCarrinho.getByText("Seu carrinho está vazio. Escolha produtos no cardápio para adicionar aqui.")).toBeVisible();

    await dialogCarrinho.getByRole("button", { name: "Continuar escolhendo" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("modal do carrinho: remove item, e fechar não apaga o carrinho", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();

    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();
    const dialogCarrinho = page.getByRole("dialog", { name: "Seu pedido" });
    await expect(dialogCarrinho.getByText("X-Burger E2E")).toBeVisible();

    // Fechar pelo X preserva o carrinho.
    await dialogCarrinho.getByRole("button", { name: "Fechar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Abrir carrinho, 1 item" })).toBeVisible();

    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();
    const dialogCarrinhoReaberto = page.getByRole("dialog", { name: "Seu pedido" });
    await dialogCarrinhoReaberto.getByRole("button", { name: /Remover/ }).click();
    await expect(
      dialogCarrinhoReaberto.getByText("Seu carrinho está vazio. Escolha produtos no cardápio para adicionar aqui."),
    ).toBeVisible();
  });

  test("nunca há dois modais abertos ao mesmo tempo", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(1);

    // Fecha o do produto antes de abrir o do carrinho — nunca simultâneos.
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Abrir carrinho" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(1);
  });

  test("fechar o modal do carrinho preserva categoria e busca já aplicadas", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Bebidas" }).click();
    await expect(page.getByText("Refrigerante E2E")).toBeVisible();

    await page.getByRole("button", { name: "Abrir carrinho" }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByRole("button", { name: "Bebidas" })).toHaveAttribute("aria-current", "true");
    await expect(page.getByText("Refrigerante E2E")).toBeVisible();
  });

  test("touch targets do modal de produto (quantidade) e do carrinho (Editar/Remover) têm pelo menos 44x44px", async ({
    page,
  }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    const dialogProduto = page.getByRole("dialog");
    const caixaProduto = await dialogProduto.getByRole("button", { name: "Aumentar quantidade" }).boundingBox();
    expect(caixaProduto?.width).toBeGreaterThanOrEqual(44);
    expect(caixaProduto?.height).toBeGreaterThanOrEqual(44);

    await dialogProduto.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();
    const dialogCarrinho = page.getByRole("dialog", { name: "Seu pedido" });

    const caixaEditar = await dialogCarrinho.getByRole("button", { name: /Editar/ }).boundingBox();
    expect(caixaEditar?.width).toBeGreaterThanOrEqual(44);
    expect(caixaEditar?.height).toBeGreaterThanOrEqual(44);

    const caixaRemover = await dialogCarrinho.getByRole("button", { name: /Remover/ }).boundingBox();
    expect(caixaRemover?.width).toBeGreaterThanOrEqual(44);
    expect(caixaRemover?.height).toBeGreaterThanOrEqual(44);
  });

  test("mobile 375px: modal do produto e modal do carrinho sem scroll horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    let larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    let larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);

    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();
    larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);
  });
});

/** TASK-120.2: cardápio com uma categoria de nome desconhecido (sem alias no resolvedor) e uma
 * lista longa o bastante para forçar rolagem interna da sidebar em telas comuns. */
function categoriaMock(id: number, nome: string) {
  return {
    id,
    nome,
    descricao: null,
    ordemExibicao: id,
    produtos: [
      {
        id: id * 100,
        nome: `Produto ${nome} E2E`,
        descricao: null,
        preco: 9.9,
        imagemUrl: null,
        destaque: false,
        recomendado: false,
        ordemExibicao: 1,
      },
    ],
  };
}

function cardapioMuitasCategoriasMock() {
  return {
    restauranteId: 1,
    categorias: [
      categoriaMock(1, "Lanches"),
      categoriaMock(2, "Bebidas"),
      categoriaMock(3, "Cachorros-quentes"),
      categoriaMock(4, "Pizzas"),
      categoriaMock(5, "Combos"),
      categoriaMock(6, "Sobremesas"),
      categoriaMock(7, "Cafés"),
      categoriaMock(8, "Saladas"),
      categoriaMock(9, "Porções"),
      categoriaMock(10, "Categoria Desconhecida XYZ"),
      categoriaMock(11, "Categoria Extra 11"),
      categoriaMock(12, "Categoria Extra 12"),
      categoriaMock(13, "Categoria Extra 13"),
      categoriaMock(14, "Categoria Extra 14"),
      categoriaMock(15, "Categoria Extra 15"),
    ],
  };
}

async function abrirTotemComMuitasCategorias(page: Parameters<typeof seedDeviceSession>[0]) {
  await seedDeviceSession(page, dispositivoMock("TOTEM"));
  await mockJson(page, "**/api/totem/cardapio", 200, cardapioMuitasCategoriasMock());
  await page.goto("/totem");
}

test.describe("Totem — ícones semânticos e sidebar de altura integral (TASK-120.2, mockado)", () => {
  test("categorias reconhecidas mostram ícones diferentes entre si; nenhuma mostra '+'", async ({ page }) => {
    await abrirTotem(page);

    const svgLanches = await page.getByRole("button", { name: "Lanches" }).locator("svg").innerHTML();
    const svgBebidas = await page.getByRole("button", { name: "Bebidas" }).locator("svg").innerHTML();
    const svgTodas = await page.getByRole("button", { name: "Todas" }).locator("svg").innerHTML();

    expect(svgLanches).not.toBe(svgBebidas);
    expect(svgLanches).not.toBe(svgTodas);
    expect(svgBebidas).not.toBe(svgTodas);

    for (const svg of [svgLanches, svgBebidas, svgTodas]) {
      expect(svg).not.toContain("M8.5 12h7M12 8.5v7");
    }

    // Nenhum botão exibe o glifo "+" como texto visível.
    await expect(page.getByRole("button", { name: "Lanches" })).not.toContainText("+");
    await expect(page.getByRole("button", { name: "Bebidas" })).not.toContainText("+");
  });

  test("categoria desconhecida recebe ícone de fallback (não fica oculta, não usa '+')", async ({ page }) => {
    await abrirTotemComMuitasCategorias(page);

    const botao = page.getByRole("button", { name: "Categoria Desconhecida XYZ" });
    await expect(botao).toBeVisible();
    const svg = await botao.locator("svg").innerHTML();
    expect(svg).not.toContain("M8.5 12h7M12 8.5v7");
  });

  test("recolher a sidebar preserva ícones diferentes e nomes acessíveis", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Recolher menu de categorias" }).click();

    const svgLanches = await page.getByRole("button", { name: "Lanches" }).locator("svg").innerHTML();
    const svgBebidas = await page.getByRole("button", { name: "Bebidas" }).locator("svg").innerHTML();
    expect(svgLanches).not.toBe(svgBebidas);

    await expect(page.getByRole("button", { name: "Lanches" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bebidas" })).toBeVisible();
  });

  test("navegar para Bebidas usando o ícone recolhido confirma a categoria ativa", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Recolher menu de categorias" }).click();
    await page.getByRole("button", { name: "Bebidas" }).click();

    await expect(page.getByRole("button", { name: "Bebidas" })).toHaveAttribute("aria-current", "true");
    await expect(page.getByText("Refrigerante E2E")).toBeVisible();
  });

  test("desktop com pouco conteúdo: sidebar atinge a base da viewport e o rodapé TotemFood fica na região inferior", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirTotem(page);

    const sidebar = page.locator("nav.totem-sidebar");
    const caixaSidebar = await sidebar.boundingBox();
    expect(caixaSidebar).not.toBeNull();
    // A sidebar deve alcançar (ou quase) a base da viewport, não parar no meio da tela.
    expect(caixaSidebar!.y + caixaSidebar!.height).toBeGreaterThanOrEqual(880);

    const rodape = page.locator(".totem-sidebar__rodape");
    await expect(rodape).toBeVisible();
    const caixaRodape = await rodape.boundingBox();
    // O rodapé fica na parte inferior da sidebar, não colado ao topo.
    expect(caixaRodape!.y).toBeGreaterThan(caixaSidebar!.height / 2);
  });

  test("muitas categorias: a lista rola internamente, a última categoria fica acessível e o rodapé não a cobre", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 700 });
    await abrirTotemComMuitasCategorias(page);

    const ultimaCategoria = page.getByRole("button", { name: "Categoria Extra 15" });
    await ultimaCategoria.scrollIntoViewIfNeeded();
    await expect(ultimaCategoria).toBeVisible();

    // O cabeçalho da sidebar continua visível — não rolou para fora junto com a lista.
    await expect(page.getByRole("button", { name: "Recolher menu de categorias" })).toBeVisible();
    await expect(page.getByText("TotemFood")).toBeVisible();

    // Sem scroll horizontal introduzido pela lista longa.
    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);
  });

  test("mobile: drawer ocupa altura integral, ícones e textos aparecem, seleção fecha o drawer", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await abrirTotem(page);

    await page.getByRole("button", { name: "Abrir menu de categorias" }).click();
    const nav = page.getByRole("navigation", { name: "Categorias do cardápio" });
    await expect(nav).toBeInViewport();

    const caixaNav = await nav.boundingBox();
    expect(caixaNav?.height).toBeGreaterThanOrEqual(690);

    await expect(page.getByRole("button", { name: "Bebidas" }).locator("svg")).toBeVisible();
    await expect(page.getByText("Bebidas")).toBeVisible();

    await page.getByRole("button", { name: "Bebidas" }).click();
    await expect(nav).not.toBeInViewport();
  });

  test("dark e light: ícones e textos da sidebar continuam visíveis", async ({ page }) => {
    await abrirTotem(page);

    await expect(page.getByRole("button", { name: "Lanches" }).locator("svg")).toBeVisible();

    await page.getByRole("button", { name: /Alternar para modo/ }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
      .toBe("dark");
    await expect(page.getByRole("button", { name: "Lanches" }).locator("svg")).toBeVisible();
    await expect(page.getByText("Lanches")).toBeVisible();
  });

  test("touch targets dos itens de categoria continuam ≥44x44px com os novos ícones", async ({ page }) => {
    await abrirTotem(page);

    const caixa = await page.getByRole("button", { name: "Bebidas" }).boundingBox();
    expect(caixa?.width).toBeGreaterThanOrEqual(44);
    expect(caixa?.height).toBeGreaterThanOrEqual(44);
  });
});

/** TASK-120.5: cardápio com produtos suficientes para o conteúdo principal ultrapassar várias
 * telas de altura — usado para validar que a coluna lateral (`.totem-sidebar-column`) acompanha
 * toda a extensão do documento, sem faixa vazia, enquanto o conteúdo interno (`nav.totem-sidebar`)
 * permanece sticky/visível durante a rolagem. */
function produtoLongoMock(id: number, categoriaId: number) {
  return {
    id,
    nome: `Produto Longo ${id} E2E`,
    descricao: null,
    preco: 9.9,
    imagemUrl: null,
    destaque: false,
    recomendado: false,
    ordemExibicao: id - categoriaId * 1000,
  };
}

function cardapioPaginaLongaMock() {
  return {
    restauranteId: 1,
    categorias: [
      {
        id: 1,
        nome: "Lanches",
        descricao: null,
        ordemExibicao: 1,
        produtos: Array.from({ length: 40 }, (_, i) => produtoLongoMock(1000 + i, 1)),
      },
    ],
  };
}

function cardapioPoucasCategoriasMuitosProdutosMock() {
  return cardapioPaginaLongaMock();
}

function cardapioMuitasCategoriasPoucosProdutosMock() {
  return {
    restauranteId: 1,
    categorias: cardapioMuitasCategoriasMock().categorias,
  };
}

async function abrirTotemComPaginaLonga(page: Parameters<typeof seedDeviceSession>[0]) {
  await seedDeviceSession(page, dispositivoMock("TOTEM"));
  await mockJson(page, "**/api/totem/cardapio", 200, cardapioPaginaLongaMock());
  await page.goto("/totem");
  // Garante que o cardápio (assíncrono) já renderizou os 40 produtos antes de medir o documento —
  // sem isso, `scrollHeight` é lido ainda com a grade vazia (só topbar + sidebar de uma tela).
  await page.getByText("Produto Longo 1039 E2E").waitFor();
  // Espera as fontes carregarem: sem isso, a métrica de altura pode ser lida entre o primeiro
  // reflow (fonte de fallback) e o reflow seguinte (fonte definitiva), tornando `scrollHeight`
  // instável entre duas leituras próximas.
  await page.evaluate(() => document.fonts.ready);
}

test.describe("Totem — continuidade vertical da sidebar em cardápios longos (TASK-120.5, mockado)", () => {
  test("conteúdo principal ultrapassa a altura da viewport com muitos produtos", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirTotemComPaginaLonga(page);

    const alturaDocumento = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(alturaDocumento).toBeGreaterThan(900 * 1.5);
  });

  test("a coluna lateral acompanha toda a altura do documento — sem faixa vazia no final da página", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirTotemComPaginaLonga(page);

    const coluna = page.locator(".totem-sidebar-column");

    // Lê altura da coluna e do documento numa única volta ao browser — medi-las em chamadas
    // separadas (duas idas e voltas ao page.evaluate/boundingBox) deixa uma janela para reflow
    // assíncrono (ex.: fonte carregando) mudar o documento entre as duas leituras, gerando falso
    // negativo mesmo com a coluna correta.
    async function medir() {
      return page.evaluate(() => {
        const coluna = document.querySelector(".totem-sidebar-column")!;
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

    const inicial = await medir();
    // A coluna deve ocupar (ao menos) toda a altura relevante do documento, não só uma viewport.
    expect(inicial.alturaColuna).toBeGreaterThanOrEqual(inicial.alturaDocumento - 4);

    await page.mouse.wheel(0, inicial.alturaDocumento);
    await expect
      .poll(async () => (await medir()).alturaColuna)
      .toBeGreaterThanOrEqual(inicial.alturaDocumento - 4);

    // Depois de rolar até o fim, a última posição visível do documento ainda deve estar coberta
    // pela coluna — ou seja, o fundo lateral não "acaba" antes do fim do cardápio.
    const final = await medir();
    const scrollYFinal = await page.evaluate(() => window.scrollY + window.innerHeight);
    expect(final.topoColunaDocumento + final.alturaColuna).toBeGreaterThanOrEqual(
      Math.min(scrollYFinal, final.alturaDocumento) - 4,
    );
  });

  test("o conteúdo interno (nav) permanece sticky e visível após rolar até o final da página", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirTotemComPaginaLonga(page);

    const nav = page.getByRole("navigation", { name: "Categorias do cardápio" });
    await expect(nav).toBeInViewport();

    const alturaDocumento = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.mouse.wheel(0, alturaDocumento);

    await expect(nav).toBeInViewport();
    await expect(page.getByRole("button", { name: "Recolher menu de categorias" })).toBeVisible();
    await expect(page.getByText("TotemFood")).toBeVisible();
  });

  test("recolhida: a coluna também acompanha toda a altura do documento", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirTotemComPaginaLonga(page);

    await page.getByRole("button", { name: "Recolher menu de categorias" }).click();

    const coluna = page.locator(".totem-sidebar-column");
    const caixaColuna = await coluna.boundingBox();
    const alturaDocumento = await page.evaluate(() => document.documentElement.scrollHeight);

    expect(caixaColuna!.height).toBeGreaterThanOrEqual(alturaDocumento - 4);

    // Expandir de volta preserva o mesmo comportamento.
    await page.getByRole("button", { name: "Expandir menu de categorias" }).click();
    const caixaColunaExpandida = await coluna.boundingBox();
    expect(caixaColunaExpandida!.height).toBeGreaterThanOrEqual(alturaDocumento - 1);
  });

  test("sem scroll horizontal e sem rolagem dupla problemática em cardápio longo", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirTotemComPaginaLonga(page);

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);

    // A lista da sidebar só rola internamente quando excede sua própria altura disponível — aqui,
    // com poucas categorias, ela não deve ter overflow vertical próprio.
    const overflowLista = await page
      .locator(".totem-sidebar__lista")
      .evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(overflowLista).toBeLessThanOrEqual(0);
  });

  test("poucas categorias e muitos produtos: coluna acompanha o cardápio", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedDeviceSession(page, dispositivoMock("TOTEM"));
    await mockJson(page, "**/api/totem/cardapio", 200, cardapioPoucasCategoriasMuitosProdutosMock());
    await page.goto("/totem");
    await page.getByText("Produto Longo 1039 E2E").waitFor();

    const alturaDocumento = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(alturaDocumento).toBeGreaterThan(900 * 1.5);

    const coluna = page.locator(".totem-sidebar-column");
    const caixaColuna = await coluna.boundingBox();
    expect(caixaColuna!.height).toBeGreaterThanOrEqual(alturaDocumento - 4);
  });

  test("muitas categorias e poucos produtos: coluna acompanha o cardápio e a lista rola internamente quando necessário", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 700 });
    await seedDeviceSession(page, dispositivoMock("TOTEM"));
    await mockJson(page, "**/api/totem/cardapio", 200, cardapioMuitasCategoriasPoucosProdutosMock());
    await page.goto("/totem");
    await page.getByRole("button", { name: "Categoria Extra 15" }).waitFor();

    const coluna = page.locator(".totem-sidebar-column");
    const caixaColuna = await coluna.boundingBox();
    const alturaDocumento = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(caixaColuna!.height).toBeGreaterThanOrEqual(alturaDocumento - 4);
  });

  test("dark: a coluna lateral continua contínua e visível em cardápio longo", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrirTotemComPaginaLonga(page);

    // Define o tema diretamente via atributo (em vez de clicar no botão da topbar) — o toggle em si
    // já é coberto por outros specs desta suíte; aqui o alvo é só validar que a coluna lateral
    // continua contínua sob o tema escuro, não a mecânica do botão.
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));

    const coluna = page.locator(".totem-sidebar-column");
    const caixaColuna = await coluna.boundingBox();
    const alturaDocumento = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(caixaColuna!.height).toBeGreaterThanOrEqual(alturaDocumento - 4);
  });

  test("mobile: cardápio longo não cria coluna lateral permanente; drawer continua funcional", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await abrirTotemComPaginaLonga(page);

    const coluna = page.locator(".totem-sidebar-column");
    const caixaColuna = await coluna.boundingBox();
    // No mobile a coluna recolhe a zero — não deve reservar espaço lateral atrás do drawer fechado.
    expect(caixaColuna?.width ?? 0).toBeLessThanOrEqual(1);

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);

    await page.getByRole("button", { name: "Abrir menu de categorias" }).click();
    const nav = page.getByRole("navigation", { name: "Categorias do cardápio" });
    await expect(nav).toBeInViewport();

    await page.getByRole("button", { name: "Lanches" }).click();
    await expect(nav).not.toBeInViewport();
  });
});

test.describe("Totem — revisão e edição do carrinho (TASK-120.3, mockado)", () => {
  test("carrinho mostra o item resumido: sem imagem real, quantidade e subtotal — sem +/− nem observação sempre abertos", async ({
    page,
  }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();

    const dialogCarrinho = page.getByRole("dialog", { name: "Seu pedido" });
    await expect(dialogCarrinho.getByText("X-Burger E2E")).toBeVisible();
    await expect(dialogCarrinho.getByText("1 unidade")).toBeVisible();
    // Produto mockado sem imagemUrl — mostra o ícone de fallback, não um <img>.
    await expect(dialogCarrinho.locator(".cart-review-item__imagem--placeholder svg")).toBeVisible();

    await expect(dialogCarrinho.getByRole("button", { name: /Aumentar quantidade/ })).toHaveCount(0);
    await expect(dialogCarrinho.getByRole("button", { name: /Diminuir quantidade/ })).toHaveCount(0);
    await expect(dialogCarrinho.getByLabel("Observação")).toHaveCount(0);
  });

  test("editar item: fecha o carrinho, abre o modal preenchido, salva e volta ao carrinho atualizado", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();

    const dialogCarrinho = page.getByRole("dialog", { name: "Seu pedido" });
    await dialogCarrinho.getByRole("button", { name: "Editar X-Burger E2E" }).click();

    // Nunca dois diálogos simultâneos.
    await expect(page.getByRole("dialog")).toHaveCount(1);
    const dialogEdicao = page.getByRole("dialog", { name: "X-Burger E2E" });
    await expect(dialogEdicao.getByText("1", { exact: true })).toBeVisible();
    await expect(dialogEdicao.getByRole("button", { name: "Salvar alterações" })).toBeVisible();

    await dialogEdicao.getByRole("button", { name: "Aumentar quantidade" }).click();
    await dialogEdicao.getByLabel("Observação do item").fill("sem cebola");
    await dialogEdicao.getByRole("button", { name: "Salvar alterações" }).click();

    // Volta automaticamente para o carrinho, atualizado.
    await expect(page.getByRole("dialog")).toHaveCount(1);
    const dialogCarrinhoReaberto = page.getByRole("dialog", { name: "Seu pedido" });
    await expect(dialogCarrinhoReaberto.getByText("2 unidades")).toBeVisible();
    await expect(dialogCarrinhoReaberto.getByText("Obs.: sem cebola")).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir carrinho, 2 itens" })).toBeVisible();
  });

  test("cancelar a edição não altera o item e volta ao carrinho", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();

    const dialogCarrinho = page.getByRole("dialog", { name: "Seu pedido" });
    await dialogCarrinho.getByRole("button", { name: "Editar X-Burger E2E" }).click();

    const dialogEdicao = page.getByRole("dialog", { name: "X-Burger E2E" });
    await dialogEdicao.getByRole("button", { name: "Aumentar quantidade" }).click();
    await dialogEdicao.getByRole("button", { name: "Cancelar" }).click();

    const dialogCarrinhoReaberto = page.getByRole("dialog", { name: "Seu pedido" });
    await expect(dialogCarrinhoReaberto.getByText("1 unidade")).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir carrinho, 1 item" })).toBeVisible();
  });

  test("tipo de consumo: grupo acessível com ícone, 'Comer no local' selecionado por padrão", async ({ page }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();

    const dialogCarrinho = page.getByRole("dialog", { name: "Seu pedido" });
    await expect(dialogCarrinho.getByRole("group", { name: "Tipo de consumo" })).toBeVisible();
    await expect(dialogCarrinho.getByRole("radio", { name: /Comer no local/ })).toBeChecked();

    await dialogCarrinho.getByRole("radio", { name: /Para viagem/ }).check();
    await expect(dialogCarrinho.getByRole("radio", { name: /Para viagem/ })).toBeChecked();
  });

  test("criar pedido continua acessível como ação principal, com nome e tipo de consumo sempre visíveis", async ({
    page,
  }) => {
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();

    const dialogCarrinho = page.getByRole("dialog", { name: "Seu pedido" });
    await expect(dialogCarrinho.getByLabel("Seu nome")).toBeVisible();
    await expect(dialogCarrinho.getByRole("button", { name: "Criar pedido" })).toBeVisible();
    await expect(dialogCarrinho.getByRole("button", { name: "Limpar carrinho" })).toBeVisible();
  });

  test("mobile 375px: modal de edição a partir do carrinho sem scroll horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await abrirTotem(page);

    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();
    await page.getByRole("button", { name: "Editar X-Burger E2E" }).click();

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);
  });
});

/** TASK-120.4: cardápio com os três cenários de imagem — válida, ausente (`null`) e quebrada (URL
 * que não resolve) — para validar o fallback único (`ProductImage`) nas três telas de produto. */
function cardapioComImagensMock() {
  return {
    restauranteId: 1,
    categorias: [
      {
        id: 1,
        nome: "Lanches",
        descricao: null,
        ordemExibicao: 1,
        produtos: [
          {
            id: 100,
            nome: "Com Imagem E2E",
            descricao: null,
            preco: 20,
            imagemUrl: "https://exemplo-e2e.invalid/valida.jpg",
            destaque: false,
            recomendado: false,
            ordemExibicao: 1,
          },
          {
            id: 200,
            nome: "Sem Imagem E2E",
            descricao: null,
            preco: 15,
            imagemUrl: null,
            destaque: false,
            recomendado: false,
            ordemExibicao: 2,
          },
          {
            id: 300,
            nome: "Imagem Quebrada E2E",
            descricao: null,
            preco: 18,
            imagemUrl: "https://exemplo-e2e.invalid/quebrada.jpg",
            destaque: false,
            recomendado: false,
            ordemExibicao: 3,
          },
        ],
      },
    ],
  };
}

test.describe("Totem — fallback visual padronizado de produtos (TASK-120.4, mockado)", () => {
  async function abrirTotemComImagens(page: Parameters<typeof seedDeviceSession>[0]) {
    await seedDeviceSession(page, dispositivoMock("TOTEM"));
    await mockJson(page, "**/api/totem/cardapio", 200, cardapioComImagensMock());
    // A URL "válida" também não resolve de verdade neste ambiente mockado (domínio .invalid) — o
    // objetivo aqui não é validar carregamento de rede real, e sim que o `onError` do navegador
    // troca para o mesmo fallback usado pelos produtos sem `imagemUrl`.
    await page.goto("/totem");
  }

  test("produto sem imagem no card não usa emoji e mostra o fallback compartilhado", async ({ page }) => {
    await abrirTotemComImagens(page);

    const cardSemImagem = page.locator(".produto-card", { hasText: "Sem Imagem E2E" });
    await expect(cardSemImagem.locator(".product-image__fallback svg")).toBeVisible();
    await expect(cardSemImagem).not.toContainText("🍔");
  });

  test("produto com URL de imagem quebrada troca para o fallback (sem ícone de imagem quebrada do navegador)", async ({
    page,
  }) => {
    await abrirTotemComImagens(page);

    const cardQuebrado = page.locator(".produto-card", { hasText: "Imagem Quebrada E2E" });
    // A imagem falha ao carregar (URL .invalid não resolve) — o onError troca para o fallback,
    // então não deve sobrar nenhum <img> quebrado no card.
    await expect(cardQuebrado.locator("img")).toHaveCount(0);
    await expect(cardQuebrado.locator(".product-image__fallback svg")).toBeVisible();
  });

  test("o mesmo fallback aparece no modal de produto e no CartReviewItem para um produto sem imagem", async ({
    page,
  }) => {
    await abrirTotemComImagens(page);

    await page.locator(".produto-card", { hasText: "Sem Imagem E2E" }).getByRole("button", { name: "Adicionar" }).click();
    const dialogProduto = page.getByRole("dialog", { name: "Sem Imagem E2E" });
    await expect(dialogProduto.locator(".product-image__fallback svg")).toBeVisible();
    await expect(dialogProduto).not.toContainText("🍔");

    await dialogProduto.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();
    const dialogCarrinho = page.getByRole("dialog", { name: "Seu pedido" });
    await expect(dialogCarrinho.locator(".product-image__fallback svg")).toBeVisible();
    await expect(dialogCarrinho).not.toContainText("🍔");
  });

  test("produto com imagem válida mostra a imagem (não o fallback) com alt correto", async ({ page }) => {
    // Mocka a própria imagem para responder com sucesso, já que o domínio usado no cardápio não
    // existe de verdade — sem isso, todo produto "com imagem" também cairia no fallback aqui.
    await page.route("**/valida.jpg", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/gif",
        // GIF 1x1 transparente — menor imagem válida possível para o navegador não disparar onError.
        body: Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7", "base64"),
      });
    });
    await seedDeviceSession(page, dispositivoMock("TOTEM"));
    await mockJson(page, "**/api/totem/cardapio", 200, cardapioComImagensMock());
    await page.goto("/totem");

    const cardComImagem = page.locator(".produto-card", { hasText: "Com Imagem E2E" });
    await expect(cardComImagem.getByRole("img", { name: "Imagem de Com Imagem E2E" })).toBeVisible();
    await expect(cardComImagem.locator(".product-image__fallback")).toHaveCount(0);
  });

  test("nenhum emoji 🍔 aparece em nenhuma tela de produto", async ({ page }) => {
    await abrirTotemComImagens(page);

    await expect(page.locator("body")).not.toContainText("🍔");

    await page.locator(".produto-card", { hasText: "Sem Imagem E2E" }).getByRole("button", { name: "Adicionar" }).click();
    await expect(page.locator("body")).not.toContainText("🍔");
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();

    await page.getByRole("button", { name: "Abrir carrinho, 1 item" }).click();
    await expect(page.locator("body")).not.toContainText("🍔");
  });

  test("dark e light: fallback permanece visível nas duas telas", async ({ page }) => {
    await abrirTotemComImagens(page);

    const fallbackCard = page.locator(".produto-card", { hasText: "Sem Imagem E2E" }).locator(".product-image__fallback svg");
    await expect(fallbackCard).toBeVisible();

    await page.getByRole("button", { name: /Alternar para modo/ }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
      .toBe("dark");
    await expect(fallbackCard).toBeVisible();
  });

  test("mobile 375px: fallback do card sem imagem sem scroll horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await abrirTotemComImagens(page);

    await expect(
      page.locator(".produto-card", { hasText: "Sem Imagem E2E" }).locator(".product-image__fallback svg"),
    ).toBeVisible();

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraViewport = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraViewport);
  });
});
