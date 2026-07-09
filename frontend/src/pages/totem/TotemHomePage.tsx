import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AcompanhamentoPedido } from "../../components/totem/AcompanhamentoPedido";
import { AppLayout } from "../../components/layout/AppLayout";
import { CartSummary } from "../../components/totem/CartSummary";
import { CategoriaCardapioSection } from "../../components/totem/CategoriaCardapioSection";
import { PagamentoPedido } from "../../components/totem/PagamentoPedido";
import { PagamentoResultado } from "../../components/totem/PagamentoResultado";
import { PedidoCriadoResumo } from "../../components/totem/PedidoCriadoResumo";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { useCart } from "../../hooks/useCart";
import { buscarCardapio, consultarPedido, criarPedido, iniciarPagamento } from "../../services/totemService";
import { clearSession, getAccessToken } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type {
  CardapioTotemResponse,
  CriarPedidoTotemRequest,
  FormaPagamento,
  IniciarPagamentoTotemRequest,
  PagamentoTotemResponse,
  PedidoTotemResponse,
  TipoConsumo,
} from "../../types/totem";
import { isPedidoFinalizado } from "../../utils/pedidoStatus";

const INTERVALO_POLLING_MS = 15000;

export function TotemHomePage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [cardapio, setCardapio] = useState<CardapioTotemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);

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
          clearSession();
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
    if (!getAccessToken()) {
      navigate("/ativar-dispositivo", { replace: true });
      return;
    }
    void carregarCardapio();
  }, [navigate, carregarCardapio]);

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
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
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
          clearSession();
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
        clearSession();
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
  }, []);

  const categorias = cardapio?.categorias ?? [];

  return (
    <AppLayout title="Cardápio" description="Selecione uma categoria para ver os produtos disponíveis.">
      {loading && <p className="totem-estado">Carregando cardápio...</p>}

      {!loading && erro && (
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
      )}

      {!loading && !erro && pagamentoResultado && (
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
      )}

      {!loading && !erro && !pagamentoResultado && pedidoCriado && mostrarPagamento && (
        <>
          <PagamentoPedido
            pedido={pedidoCriado}
            onPay={handlePay}
            pagando={pagandoPedido}
            erro={erroPagamento}
          />
          {pagamentoSemAutorizacao && (
            <Button type="button" onClick={() => navigate("/ativar-dispositivo")}>
              Ir para ativação de dispositivo
            </Button>
          )}
        </>
      )}

      {!loading && !erro && !pagamentoResultado && pedidoCriado && !mostrarPagamento && (
        <PedidoCriadoResumo pedido={pedidoCriado} onNovoPedido={handleNovoPedido} onGoToPayment={handleGoToPayment} />
      )}

      {!loading && !erro && !pagamentoResultado && !pedidoCriado && categorias.length === 0 && (
        <p className="totem-estado">Nenhum produto disponível no momento.</p>
      )}

      {!loading && !erro && !pagamentoResultado && !pedidoCriado && categorias.length > 0 && (
        <div className="totem-layout">
          <div className="totem-layout__cardapio">
            {categorias.map((categoria) => (
              <CategoriaCardapioSection key={categoria.id} categoria={categoria} onAddProduct={cart.addItem} />
            ))}
          </div>

          <CartSummary
            itens={cart.itens}
            totalEstimado={cart.totalEstimado}
            onIncrement={cart.increment}
            onDecrement={cart.decrement}
            onRemove={cart.removeItem}
            onChangeObservacao={cart.setObservacao}
            onClear={cart.clearCart}
            onCreateOrder={handleCreateOrder}
            criandoPedido={criandoPedido}
            erroPedido={erroPedido}
          />
          {pedidoSemAutorizacao && (
            <Button type="button" onClick={() => navigate("/ativar-dispositivo")}>
              Ir para ativação de dispositivo
            </Button>
          )}
        </div>
      )}
    </AppLayout>
  );
}
