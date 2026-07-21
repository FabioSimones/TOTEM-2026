import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AcompanhamentoPedido } from "../../components/totem/AcompanhamentoPedido";
import { AppLayout } from "../../components/layout/AppLayout";
import { CartModal } from "../../components/totem/CartModal";
import { CategoriaCardapioSection } from "../../components/totem/CategoriaCardapioSection";
import { PagamentoPedido } from "../../components/totem/PagamentoPedido";
import { PagamentoResultado } from "../../components/totem/PagamentoResultado";
import { PedidoCriadoResumo } from "../../components/totem/PedidoCriadoResumo";
import { ProdutoCard } from "../../components/totem/ProdutoCard";
import { ProductSelectionModal } from "../../components/totem/ProductSelectionModal";
import { TOTEM_TODAS_CATEGORIAS, type TotemCategoriaSelecionada } from "../../components/totem/TotemSidebar";
import { TotemHero } from "../../components/totem/TotemHero";
import { TotemLayout } from "../../components/totem/TotemLayout";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { useCart } from "../../hooks/useCart";
import { buscarCardapio, consultarPedido, criarPedido, iniciarPagamento } from "../../services/totemService";
import { clearDeviceSession, getDeviceAccessToken, getStoredDispositivo } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { CartItem, ProdutoParaCarrinho } from "../../types/cart";
import type {
  CardapioTotemResponse,
  CriarPedidoTotemRequest,
  FormaPagamento,
  IniciarPagamentoTotemRequest,
  PagamentoTotemResponse,
  PedidoTotemResponse,
  ProdutoCardapioResponse,
  TipoConsumo,
} from "../../types/totem";
import { normalizarTextoBusca } from "../../utils/texto";
import { isPedidoFinalizado } from "../../utils/pedidoStatus";

/** TASK-120.3: estado unificado do `ProductSelectionModal` — cobre tanto "adicionar" (a partir do
 * cardápio) quanto "editar" (a partir de um item do carrinho). `aberturaId` garante um `key` novo a
 * cada abertura (mesmo produto reaberto duas vezes, ou trocando de modo), sem depender de um
 * `useEffect` interno para resetar quantidade/observação — ver comentário em
 * `ProductSelectionModal.tsx`. */
interface ModalProdutoState {
  produto: ProdutoParaCarrinho;
  modo: "adicionar" | "editar";
  quantidadeInicial: number;
  observacaoInicial: string;
  aberturaId: number;
}

const INTERVALO_POLLING_MS = 15000;
const TITULO_APP_LAYOUT = "Cardápio";
const DESCRICAO_APP_LAYOUT = "Selecione uma categoria para ver os produtos disponíveis.";

export function TotemHomePage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [cardapio, setCardapio] = useState<CardapioTotemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);

  // "Todas" é o padrão (mesmo comportamento de hoje, sem sidebar) — evita um "flash" da visão
  // completa antes de colapsar para a primeira categoria assim que o cardápio chega.
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<TotemCategoriaSelecionada>(TOTEM_TODAS_CATEGORIAS);
  const [busca, setBusca] = useState("");

  // TASK-120.1: substituem o painel lateral permanente por dois modais com responsabilidades
  // separadas — nunca abertos ao mesmo tempo (modalProduto sempre fecha antes de abrir o
  // carrinho, e vice-versa, já que cada um só é aberto por uma ação explícita do próprio usuário).
  const [modalProduto, setModalProduto] = useState<ModalProdutoState | null>(null);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const proximaAberturaId = useRef(0);

  const [pedidoCriado, setPedidoCriado] = useState<PedidoTotemResponse | null>(null);
  const [criandoPedido, setCriandoPedido] = useState(false);
  const [erroPedido, setErroPedido] = useState<string | null>(null);
  const [pedidoSemAutorizacao, setPedidoSemAutorizacao] = useState(false);

  const [mostrarPagamento, setMostrarPagamento] = useState(false);
  const [pagandoPedido, setPagandoPedido] = useState(false);
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);
  const [pagamentoSemAutorizacao, setPagamentoSemAutorizacao] = useState(false);
  const [pagamentoResultado, setPagamentoResultado] = useState<PagamentoTotemResponse | null>(null);

  const [pedidoAtual, setPedidoAtual] = useState<PedidoTotemResponse | null>(null);
  const [atualizandoPedido, setAtualizandoPedido] = useState(false);
  const [erroAtualizacaoPedido, setErroAtualizacaoPedido] = useState<string | null>(null);
  const [atualizacaoSemAutorizacao, setAtualizacaoSemAutorizacao] = useState(false);

  const carregarCardapio = useCallback(async () => {
    setLoading(true);
    setErro(null);
    setSemAutorizacao(false);

    try {
      const response = await buscarCardapio();
      setCardapio(response);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setSemAutorizacao(true);
        if (error.status === 401) {
          // Token inválido/expirado: não serve para mais nada, força nova ativação.
          clearDeviceSession();
          setErro("Sessão expirada. Ative o dispositivo novamente para continuar.");
        } else {
          // 403: token válido, mas sem permissão de TOTEM — pode ser legítimo
          // para outro módulo, então a sessão não é apagada.
          setErro("Este dispositivo não tem permissão para acessar o cardápio do Totem.");
        }
      } else {
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar o cardápio. Tente novamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Achado da auditoria: antes só checava a existência do token, sem validar o tipo do
    // dispositivo salvo — um dispositivo CAIXA/COZINHA/ADMINISTRACAO ativado neste navegador
    // passava por este guard e só falhava depois, no 403 do backend.
    const dispositivo = getStoredDispositivo();
    if (!getDeviceAccessToken() || !dispositivo || dispositivo.tipoDispositivo !== "TOTEM") {
      navigate("/ativar-dispositivo", { replace: true });
      return;
    }
    void carregarCardapio();
  }, [navigate, carregarCardapio]);

  const categorias = useMemo(() => cardapio?.categorias ?? [], [cardapio]);

  const handleSelecionarProduto = useCallback((produto: ProdutoCardapioResponse) => {
    proximaAberturaId.current += 1;
    setModalProduto({
      produto,
      modo: "adicionar",
      quantidadeInicial: 1,
      observacaoInicial: "",
      aberturaId: proximaAberturaId.current,
    });
  }, []);

  const handleEditarItem = useCallback((item: CartItem) => {
    proximaAberturaId.current += 1;
    // Nunca dois modais simultâneos: fecha o carrinho antes de abrir o modal de edição do produto.
    setCarrinhoAberto(false);
    setModalProduto({
      produto: {
        id: item.produtoId,
        nome: item.nome,
        descricao: item.descricao,
        preco: item.preco,
        imagemUrl: item.imagemUrl,
      },
      modo: "editar",
      quantidadeInicial: item.quantidade,
      observacaoInicial: item.observacao ?? "",
      aberturaId: proximaAberturaId.current,
    });
  }, []);

  const handleFecharModalProduto = useCallback(() => {
    const estavaEditando = modalProduto?.modo === "editar";
    setModalProduto(null);
    if (estavaEditando) {
      // Edição concluída (salva ou cancelada) — volta para o carrinho, de onde a edição partiu.
      setCarrinhoAberto(true);
    }
  }, [modalProduto]);

  const handleConfirmarProduto = useCallback(
    (produto: ProdutoParaCarrinho, quantidade: number, observacao: string) => {
      if (modalProduto?.modo === "editar") {
        cart.atualizarItem(produto.id, quantidade, observacao);
      } else {
        cart.addItem(produto, quantidade, observacao || undefined);
      }
    },
    [cart, modalProduto],
  );

  const handleCreateOrder = useCallback(
    async (dados: { clienteNome: string; tipoConsumo: TipoConsumo }) => {
      setCriandoPedido(true);
      setErroPedido(null);
      setPedidoSemAutorizacao(false);

      const request: CriarPedidoTotemRequest = {
        tipoConsumo: dados.tipoConsumo,
        clienteNome: dados.clienteNome,
        itens: cart.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          ...(item.observacao ? { observacao: item.observacao } : {}),
        })),
      };

      try {
        const response = await criarPedido(request);
        setPedidoCriado(response);
        cart.clearCart();
        setCarrinhoAberto(false);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearDeviceSession();
          setPedidoSemAutorizacao(true);
          setErroPedido("Sessão expirada. Ative o dispositivo novamente para continuar.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroPedido("Este dispositivo não tem permissão para criar pedidos.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroPedido(
            "Um ou mais produtos do carrinho não estão mais disponíveis. Atualize o cardápio e tente novamente.",
          );
        } else if (error instanceof ApiError) {
          setErroPedido(error.message || "Não foi possível criar o pedido. Verifique os dados informados.");
        } else {
          setErroPedido("Não foi possível criar o pedido. Tente novamente.");
        }
      } finally {
        setCriandoPedido(false);
      }
    },
    [cart],
  );

  const handleGoToPayment = useCallback(() => {
    setErroPagamento(null);
    setPagamentoSemAutorizacao(false);
    setMostrarPagamento(true);
  }, []);

  const handlePay = useCallback(
    async (formaPagamento: FormaPagamento) => {
      if (!pedidoCriado) {
        return;
      }
      setPagandoPedido(true);
      setErroPagamento(null);
      setPagamentoSemAutorizacao(false);

      const request: IniciarPagamentoTotemRequest = { formaPagamento };

      try {
        const response = await iniciarPagamento(pedidoCriado.pedidoId, request);
        setPagamentoResultado(response);
        setPedidoAtual({ ...pedidoCriado, statusPedido: response.statusPedido });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearDeviceSession();
          setPagamentoSemAutorizacao(true);
          setErroPagamento("Sessão expirada. Ative o dispositivo novamente para continuar.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroPagamento("Este dispositivo não tem permissão para processar pagamentos.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroPagamento("Pedido não encontrado. Faça um novo pedido e tente novamente.");
        } else if (error instanceof ApiError && error.status === 400) {
          setErroPagamento(error.message || "Não foi possível processar o pagamento. O pedido pode já estar pago.");
        } else if (error instanceof ApiError) {
          setErroPagamento(error.message);
        } else {
          setErroPagamento("Não foi possível processar o pagamento. Tente novamente.");
        }
      } finally {
        setPagandoPedido(false);
      }
    },
    [pedidoCriado],
  );

  const handleAtualizarPedido = useCallback(async () => {
    if (!pedidoAtual) {
      return;
    }
    setAtualizandoPedido(true);
    setErroAtualizacaoPedido(null);
    setAtualizacaoSemAutorizacao(false);

    try {
      const response = await consultarPedido(pedidoAtual.pedidoId);
      setPedidoAtual(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearDeviceSession();
        setAtualizacaoSemAutorizacao(true);
        setErroAtualizacaoPedido("Sessão expirada. Ative o dispositivo novamente para continuar.");
      } else if (error instanceof ApiError && error.status === 403) {
        setErroAtualizacaoPedido("Este dispositivo não tem permissão para consultar este pedido.");
      } else if (error instanceof ApiError && error.status === 404) {
        setErroAtualizacaoPedido("Pedido não encontrado.");
      } else if (error instanceof ApiError) {
        setErroAtualizacaoPedido(error.message);
      } else {
        setErroAtualizacaoPedido("Não foi possível atualizar o status. Tente novamente.");
      }
    } finally {
      setAtualizandoPedido(false);
    }
  }, [pedidoAtual]);

  useEffect(() => {
    if (!pedidoAtual || isPedidoFinalizado(pedidoAtual.statusPedido)) {
      return;
    }
    const intervalId = window.setInterval(() => {
      void handleAtualizarPedido();
    }, INTERVALO_POLLING_MS);
    return () => window.clearInterval(intervalId);
  }, [pedidoAtual, handleAtualizarPedido]);

  const handleNovoPedido = useCallback(() => {
    setPedidoCriado(null);
    setErroPedido(null);
    setMostrarPagamento(false);
    setErroPagamento(null);
    setPagamentoSemAutorizacao(false);
    setPagamentoResultado(null);
    setPedidoAtual(null);
    setErroAtualizacaoPedido(null);
    setAtualizacaoSemAutorizacao(false);
    setModalProduto(null);
    setCarrinhoAberto(false);
  }, []);

  const buscaNormalizada = normalizarTextoBusca(busca);
  const buscando = buscaNormalizada.length > 0;

  const todosProdutos = useMemo(() => categorias.flatMap((categoria) => categoria.produtos), [categorias]);

  const produtosBusca = useMemo(() => {
    if (!buscando) {
      return null;
    }
    return todosProdutos.filter((produto) => {
      const nomeNormalizado = normalizarTextoBusca(produto.nome);
      const descricaoNormalizada = produto.descricao ? normalizarTextoBusca(produto.descricao) : "";
      return nomeNormalizado.includes(buscaNormalizada) || descricaoNormalizada.includes(buscaNormalizada);
    });
  }, [buscando, todosProdutos, buscaNormalizada]);

  const categoriaAtual =
    categoriaSelecionada === TOTEM_TODAS_CATEGORIAS
      ? null
      : (categorias.find((categoria) => categoria.id === categoriaSelecionada) ?? null);

  let tituloTopbar = "Cardápio";
  let descricaoTopbar: string | null = null;
  if (buscando) {
    tituloTopbar = "Resultados da busca";
  } else if (categoriaAtual) {
    tituloTopbar = categoriaAtual.nome;
    descricaoTopbar = categoriaAtual.descricao ?? null;
  } else {
    descricaoTopbar = "Selecione uma categoria ou veja todos os produtos.";
  }

  let corpoCardapio: ReactNode;
  if (buscando) {
    corpoCardapio =
      !produtosBusca || produtosBusca.length === 0 ? (
        <p className="totem-estado">Nenhum produto encontrado para esta busca.</p>
      ) : (
        <section className="categoria-section">
          <div className="categoria-section__grid">
            {produtosBusca.map((produto) => (
              <ProdutoCard key={produto.id} produto={produto} onSelecionar={handleSelecionarProduto} />
            ))}
          </div>
        </section>
      );
  } else if (categoriaSelecionada === TOTEM_TODAS_CATEGORIAS) {
    corpoCardapio = categorias.map((categoria) => (
      <CategoriaCardapioSection
        key={categoria.id}
        categoria={categoria}
        onSelecionarProduto={handleSelecionarProduto}
      />
    ));
  } else if (categoriaAtual) {
    corpoCardapio =
      categoriaAtual.produtos.length === 0 ? (
        <p className="totem-estado">Nenhum produto disponível nesta categoria.</p>
      ) : (
        <CategoriaCardapioSection categoria={categoriaAtual} onSelecionarProduto={handleSelecionarProduto} />
      );
  } else {
    corpoCardapio = null;
  }

  if (loading) {
    return (
      <AppLayout title={TITULO_APP_LAYOUT} description={DESCRICAO_APP_LAYOUT}>
        <p className="totem-estado">Carregando cardápio...</p>
      </AppLayout>
    );
  }

  if (erro) {
    return (
      <AppLayout title={TITULO_APP_LAYOUT} description={DESCRICAO_APP_LAYOUT}>
        <div className="totem-estado totem-estado--erro">
          <ErrorMessage message={erro} />
          {semAutorizacao ? (
            <Button type="button" onClick={() => navigate("/ativar-dispositivo")}>
              Ir para ativação de dispositivo
            </Button>
          ) : (
            <Button type="button" onClick={() => void carregarCardapio()}>
              Tentar novamente
            </Button>
          )}
        </div>
      </AppLayout>
    );
  }

  if (pagamentoResultado) {
    return (
      <AppLayout title={TITULO_APP_LAYOUT} description={DESCRICAO_APP_LAYOUT}>
        <div className="totem-pos-pagamento">
          <PagamentoResultado resultado={pagamentoResultado} onNovoPedido={handleNovoPedido} />

          {pedidoAtual && (
            <AcompanhamentoPedido
              pedido={pedidoAtual}
              onAtualizar={() => void handleAtualizarPedido()}
              atualizando={atualizandoPedido}
              erro={erroAtualizacaoPedido}
            />
          )}

          {atualizacaoSemAutorizacao && (
            <Button type="button" onClick={() => navigate("/ativar-dispositivo")}>
              Ir para ativação de dispositivo
            </Button>
          )}
        </div>
      </AppLayout>
    );
  }

  if (pedidoCriado && mostrarPagamento) {
    return (
      <AppLayout title={TITULO_APP_LAYOUT} description={DESCRICAO_APP_LAYOUT}>
        <PagamentoPedido pedido={pedidoCriado} onPay={handlePay} pagando={pagandoPedido} erro={erroPagamento} />
        {pagamentoSemAutorizacao && (
          <Button type="button" onClick={() => navigate("/ativar-dispositivo")}>
            Ir para ativação de dispositivo
          </Button>
        )}
      </AppLayout>
    );
  }

  if (pedidoCriado) {
    return (
      <AppLayout title={TITULO_APP_LAYOUT} description={DESCRICAO_APP_LAYOUT}>
        <PedidoCriadoResumo pedido={pedidoCriado} onNovoPedido={handleNovoPedido} onGoToPayment={handleGoToPayment} />
      </AppLayout>
    );
  }

  if (categorias.length === 0) {
    return (
      <AppLayout title={TITULO_APP_LAYOUT} description={DESCRICAO_APP_LAYOUT}>
        <p className="totem-estado">Nenhum produto disponível no momento.</p>
      </AppLayout>
    );
  }

  return (
    <>
      <TotemLayout
        categorias={categorias}
        categoriaSelecionada={categoriaSelecionada}
        onSelectCategoria={setCategoriaSelecionada}
        titulo={tituloTopbar}
        descricao={descricaoTopbar}
        busca={busca}
        onChangeBusca={setBusca}
        totalItensCarrinho={cart.totalItens}
        onAbrirCarrinho={() => setCarrinhoAberto(true)}
      >
        <TotemHero />
        {corpoCardapio}
      </TotemLayout>

      <ProductSelectionModal
        key={modalProduto?.aberturaId ?? "nenhum"}
        produto={modalProduto?.produto ?? null}
        modo={modalProduto?.modo}
        quantidadeInicial={modalProduto?.quantidadeInicial}
        observacaoInicial={modalProduto?.observacaoInicial}
        onFechar={handleFecharModalProduto}
        onConfirmar={handleConfirmarProduto}
      />

      <CartModal
        aberto={carrinhoAberto}
        onFechar={() => setCarrinhoAberto(false)}
        itens={cart.itens}
        totalEstimado={cart.totalEstimado}
        onEditarItem={handleEditarItem}
        onRemove={cart.removeItem}
        onClear={cart.clearCart}
        onCreateOrder={handleCreateOrder}
        criandoPedido={criandoPedido}
        erroPedido={erroPedido}
        semAutorizacao={pedidoSemAutorizacao}
        onIrParaAtivacao={() => navigate("/ativar-dispositivo")}
      />
    </>
  );
}
