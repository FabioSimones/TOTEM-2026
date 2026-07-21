import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CardapioTotemResponse } from "../../types/totem";
import type { DispositivoAutenticadoResponse } from "../../types/auth";
import { getDeviceAccessToken, getStoredDispositivo, saveDeviceSession } from "../../services/tokenStorage";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { TotemHomePage } from "./TotemHomePage";

const dispositivoTotemMock: DispositivoAutenticadoResponse = {
  id: 1,
  nome: "Totem Teste",
  codigoIdentificacao: "TOTEM-1",
  tipoDispositivo: "TOTEM",
  restauranteId: 1,
  ativo: true,
  ultimoAcesso: null,
};

const { buscarCardapioMock } = vi.hoisted(() => ({
  buscarCardapioMock: vi.fn(),
}));

vi.mock("../../services/totemService", () => ({
  buscarCardapio: buscarCardapioMock,
  consultarPedido: vi.fn(),
  criarPedido: vi.fn(),
  iniciarPagamento: vi.fn(),
}));

function renderPagina() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/totem"]}>
        <Routes>
          <Route path="/totem" element={<TotemHomePage />} />
          <Route path="/ativar-dispositivo" element={<p>Tela de ativação</p>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

function ativarSessaoDeDispositivo(dispositivo: DispositivoAutenticadoResponse = dispositivoTotemMock) {
  saveDeviceSession({
    accessToken: "device-token-teste",
    refreshToken: "refresh-token-teste",
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshExpiresIn: 604800,
    dispositivo,
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

/**
 * Auditoria de autenticação, achado corrigido: antes o guard de TotemHomePage só checava a
 * existência do accessToken, sem validar o tipo do dispositivo salvo — um dispositivo
 * CAIXA/COZINHA/ADMINISTRACAO ativado neste navegador passava por este guard e só falhava
 * depois, no 403 do backend.
 */
describe("TotemHomePage sem dispositivo ativado", () => {
  it("redireciona para /ativar-dispositivo e não busca o cardápio", async () => {
    renderPagina();

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(buscarCardapioMock).not.toHaveBeenCalled();
  });
});

describe("TotemHomePage com dispositivo incompatível (TASK-116)", () => {
  it("dispositivo CAIXA: redireciona para /ativar-dispositivo e não busca o cardápio nem exibe o fluxo do Totem", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoTotemMock, tipoDispositivo: "CAIXA" });

    renderPagina();

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(screen.queryByText("Carregando cardápio...")).not.toBeInTheDocument();
    expect(buscarCardapioMock).not.toHaveBeenCalled();
  });

  it("dispositivo COZINHA: redireciona para /ativar-dispositivo e não busca o cardápio", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoTotemMock, tipoDispositivo: "COZINHA" });

    renderPagina();

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(buscarCardapioMock).not.toHaveBeenCalled();
  });

  it("dispositivo ADMINISTRACAO: redireciona para /ativar-dispositivo e não busca o cardápio", async () => {
    ativarSessaoDeDispositivo({ ...dispositivoTotemMock, tipoDispositivo: "ADMINISTRACAO" });

    renderPagina();

    expect(await screen.findByText("Tela de ativação")).toBeInTheDocument();
    expect(buscarCardapioMock).not.toHaveBeenCalled();
  });
});

describe("TotemHomePage com dispositivo TOTEM compatível", () => {
  it("busca o cardápio normalmente", async () => {
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue({ categorias: [] });

    renderPagina();

    expect(await screen.findByText("Nenhum produto disponível no momento.")).toBeInTheDocument();
    expect(buscarCardapioMock).toHaveBeenCalledTimes(1);
    expect(getDeviceAccessToken()).toBe("device-token-teste");
    expect(getStoredDispositivo()?.tipoDispositivo).toBe("TOTEM");
  });

  it("exibe o estado de carregamento antes do cardápio responder", () => {
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockReturnValue(new Promise(() => {}));

    renderPagina();

    expect(screen.getByText("Carregando cardápio...")).toBeInTheDocument();
  });

  it("erro de rede exibe mensagem e botão de tentar novamente (sem sessão expirada)", async () => {
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockRejectedValue(new Error("network down"));

    renderPagina();

    expect(await screen.findByText("Não foi possível carregar o cardápio. Tente novamente.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});

const cardapioComDuasCategorias: CardapioTotemResponse = {
  restauranteId: 1,
  categorias: [
    {
      id: 1,
      nome: "Lanches",
      descricao: "Hambúrgueres e sanduíches",
      ordemExibicao: 1,
      produtos: [
        {
          id: 10,
          nome: "X-Burger Clássico",
          descricao: "Pão, hambúrguer, queijo",
          preco: 18.9,
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
          id: 20,
          nome: "Refrigerante Guaraná",
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

describe("TotemHomePage — sidebar, busca e carrinho (TASK-120)", () => {
  it("renderiza a sidebar com as categorias reais e inicia em 'Todas' (mesmo comportamento de hoje, sem flash de transição)", async () => {
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();

    expect(await screen.findByRole("button", { name: "Todas" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Lanches" })).not.toHaveAttribute("aria-current");
    expect(screen.getByText("X-Burger Clássico")).toBeInTheDocument();
    expect(screen.getByText("Refrigerante Guaraná")).toBeInTheDocument();
  });

  it("selecionar uma categoria filtra o grid para os produtos dela", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    await user.click(screen.getByRole("button", { name: "Bebidas" }));

    expect(screen.getByRole("heading", { level: 1, name: "Bebidas" })).toBeInTheDocument();
    expect(screen.getByText("Refrigerante Guaraná")).toBeInTheDocument();
    expect(screen.queryByText("X-Burger Clássico")).not.toBeInTheDocument();
  });

  it("voltar para 'Todas' mostra novamente todas as categorias empilhadas", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    await user.click(screen.getByRole("button", { name: "Bebidas" }));
    await screen.findByText("Refrigerante Guaraná");
    await user.click(screen.getByRole("button", { name: "Todas" }));

    expect(screen.getByText("X-Burger Clássico")).toBeInTheDocument();
    expect(screen.getByText("Refrigerante Guaraná")).toBeInTheDocument();
  });

  it("busca filtra por nome em todas as categorias, ignorando a categoria selecionada", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    await user.type(screen.getByRole("searchbox", { name: "Buscar produto" }), "guaran");

    expect(screen.getByRole("heading", { level: 1, name: "Resultados da busca" })).toBeInTheDocument();
    expect(screen.getByText("Refrigerante Guaraná")).toBeInTheDocument();
    expect(screen.queryByText("X-Burger Clássico")).not.toBeInTheDocument();
  });

  it("busca sem resultado mostra mensagem própria, distinta de categoria vazia", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    await user.type(screen.getByRole("searchbox", { name: "Buscar produto" }), "pizza");

    expect(screen.getByText("Nenhum produto encontrado para esta busca.")).toBeInTheDocument();
  });

});

describe("TotemHomePage — modal de produto e modal de carrinho (TASK-120.1)", () => {
  it("painel lateral permanente não existe mais no DOM", async () => {
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    expect(document.querySelector(".totem-layout")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Seu pedido" })).not.toBeInTheDocument();
  });

  it("clicar em Adicionar abre o modal do produto sem adicionar nada ao carrinho ainda", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    await user.click(within(screen.getByText("X-Burger Clássico").closest("article")!).getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("dialog", { name: "X-Burger Clássico" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir carrinho" })).toBeInTheDocument();
  });

  it("confirmar no modal do produto adiciona ao carrinho, fecha o modal e atualiza o contador — sem abrir o carrinho automaticamente", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    await user.click(within(screen.getByText("X-Burger Clássico").closest("article")!).getByRole("button", { name: "Adicionar" }));
    await user.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));

    expect(screen.queryByRole("dialog", { name: "X-Burger Clássico" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir carrinho, 1 item" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Seu pedido" })).not.toBeInTheDocument();
  });

  it("aumentar a quantidade no modal do produto antes de confirmar adiciona a quantidade escolhida", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    await user.click(within(screen.getByText("X-Burger Clássico").closest("article")!).getByRole("button", { name: "Adicionar" }));
    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    await user.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));

    expect(screen.getByRole("button", { name: "Abrir carrinho, 3 itens" })).toBeInTheDocument();
  });

  it("cancelar o modal do produto não altera o carrinho", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    await user.click(within(screen.getByText("X-Burger Clássico").closest("article")!).getByRole("button", { name: "Adicionar" }));
    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir carrinho" })).toBeInTheDocument();
  });

  it("botão do carrinho na topbar abre o modal do carrinho vazio com 'Continuar escolhendo'", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    await user.click(screen.getByRole("button", { name: "Abrir carrinho" }));

    expect(screen.getByRole("dialog", { name: "Seu pedido" })).toBeInTheDocument();
    expect(screen.getByText("Seu carrinho está vazio. Escolha produtos no cardápio para adicionar aqui.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continuar escolhendo" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("modal do carrinho com itens permite remover, e fechar não apaga o carrinho", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");
    await user.click(within(screen.getByText("X-Burger Clássico").closest("article")!).getByRole("button", { name: "Adicionar" }));
    await user.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));

    await user.click(screen.getByRole("button", { name: "Abrir carrinho, 1 item" }));
    const dialogCarrinho = screen.getByRole("dialog", { name: "Seu pedido" });
    expect(within(dialogCarrinho).getByText("X-Burger Clássico")).toBeInTheDocument();
    expect(within(dialogCarrinho).getByText("1 unidade")).toBeInTheDocument();

    // Fechar pelo X do modal preserva o carrinho.
    await user.click(within(dialogCarrinho).getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir carrinho, 1 item" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir carrinho, 1 item" }));
    const dialogCarrinhoReaberto = screen.getByRole("dialog", { name: "Seu pedido" });
    await user.click(within(dialogCarrinhoReaberto).getByRole("button", { name: /Remover/ }));
    expect(
      within(dialogCarrinhoReaberto).getByText("Seu carrinho está vazio. Escolha produtos no cardápio para adicionar aqui."),
    ).toBeInTheDocument();
  });

  it("Escape fecha o modal do produto sem adicionar ao carrinho", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    await user.click(within(screen.getByText("X-Burger Clássico").closest("article")!).getByRole("button", { name: "Adicionar" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir carrinho" })).toBeInTheDocument();
  });

  it("fechar qualquer modal preserva categoria e busca já aplicadas", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await screen.findByText("X-Burger Clássico");

    await user.click(screen.getByRole("button", { name: "Bebidas" }));
    await screen.findByText("Refrigerante Guaraná");

    await user.click(screen.getByRole("button", { name: "Abrir carrinho" }));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "Bebidas" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("Refrigerante Guaraná")).toBeInTheDocument();
  });
});

describe("TotemHomePage — revisão e edição do carrinho (TASK-120.3)", () => {
  async function adicionarXBurgerAoCarrinho(user: ReturnType<typeof userEvent.setup>) {
    await screen.findByText("X-Burger Clássico");
    await user.click(
      within(screen.getByText("X-Burger Clássico").closest("article")!).getByRole("button", { name: "Adicionar" }),
    );
    await user.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));
  }

  it("carrinho não mostra +/− permanentes nem campo de observação sempre aberto", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await adicionarXBurgerAoCarrinho(user);
    await user.click(screen.getByRole("button", { name: "Abrir carrinho, 1 item" }));

    expect(screen.queryByRole("button", { name: /Aumentar quantidade/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Diminuir quantidade/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Observação")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar X-Burger Clássico" })).toBeInTheDocument();
  });

  it("clicar em Editar fecha o carrinho, abre o modal preenchido com os valores atuais, e salvar atualiza o item e reabre o carrinho", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await adicionarXBurgerAoCarrinho(user);
    await user.click(screen.getByRole("button", { name: "Abrir carrinho, 1 item" }));

    await user.click(screen.getByRole("button", { name: "Editar X-Burger Clássico" }));

    // Nunca dois diálogos simultâneos — o carrinho fecha antes do modal de edição abrir.
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    const dialogEdicao = screen.getByRole("dialog", { name: "X-Burger Clássico" });
    expect(within(dialogEdicao).getByText("1", { exact: true })).toBeInTheDocument();
    expect(within(dialogEdicao).getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();

    await user.click(within(dialogEdicao).getByRole("button", { name: "Aumentar quantidade" }));
    await user.type(within(dialogEdicao).getByLabelText("Observação do item"), "sem cebola");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    // Volta automaticamente para o carrinho, com o item já atualizado.
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    const dialogCarrinho = screen.getByRole("dialog", { name: "Seu pedido" });
    expect(within(dialogCarrinho).getByText("2 unidades")).toBeInTheDocument();
    expect(within(dialogCarrinho).getByText("Obs.: sem cebola")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir carrinho, 2 itens" })).toBeInTheDocument();
  });

  it("cancelar a edição não altera o item e retorna ao carrinho preservando os demais itens", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await adicionarXBurgerAoCarrinho(user);
    await user.click(screen.getByRole("button", { name: "Bebidas" }));
    await user.click(
      within(screen.getByText("Refrigerante Guaraná").closest("article")!).getByRole("button", { name: "Adicionar" }),
    );
    await user.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));

    await user.click(screen.getByRole("button", { name: "Abrir carrinho, 2 itens" }));
    await user.click(screen.getByRole("button", { name: "Editar X-Burger Clássico" }));
    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    const dialogCarrinho = screen.getByRole("dialog", { name: "Seu pedido" });
    // Ambos os itens continuam com 1 unidade — a edição foi cancelada, nada mudou.
    expect(within(dialogCarrinho).getAllByText("1 unidade")).toHaveLength(2);
    expect(within(dialogCarrinho).getByText("Refrigerante Guaraná")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir carrinho, 2 itens" })).toBeInTheDocument();
  });

  it("tipo de consumo é um grupo acessível com 'Comer no local' selecionado por padrão", async () => {
    const user = userEvent.setup();
    ativarSessaoDeDispositivo();
    buscarCardapioMock.mockResolvedValue(cardapioComDuasCategorias);

    renderPagina();
    await adicionarXBurgerAoCarrinho(user);
    await user.click(screen.getByRole("button", { name: "Abrir carrinho, 1 item" }));

    expect(screen.getByRole("group", { name: "Tipo de consumo" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Comer no local/ })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: /Para viagem/ }));
    expect(screen.getByRole("radio", { name: /Para viagem/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Comer no local/ })).not.toBeChecked();
  });
});
