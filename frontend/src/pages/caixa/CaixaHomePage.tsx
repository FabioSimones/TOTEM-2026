import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { PedidoPendenteCard } from "../../components/caixa/PedidoPendenteCard";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { confirmarPagamentoDinheiro, enviarPedidoParaCozinha, listarPendencias } from "../../services/caixaService";
import { clearSession, getAccessToken } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { PedidoPendenteCaixaResponse } from "../../types/caixa";

export function CaixaHomePage() {
  const navigate = useNavigate();
  const [pendencias, setPendencias] = useState<PedidoPendenteCaixaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const [acoesEmAndamento, setAcoesEmAndamento] = useState<Set<number>>(new Set());
  const [errosAcao, setErrosAcao] = useState<Record<number, string | null>>({});

  const carregarPendencias = useCallback(async () => {
    setLoading(true);
    setErro(null);
    setSemAutorizacao(false);
    setMensagemSucesso(null);

    try {
      const response = await listarPendencias();
      setPendencias(response);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setSemAutorizacao(true);
        if (error.status === 401) {
          // Token inválido/expirado: não serve para mais nada, força nova ativação.
          clearSession();
          setErro("Sessão expirada. Ative o dispositivo novamente para continuar.");
        } else {
          // 403: token válido, mas sem permissão de CAIXA — pode ser legítimo
          // para outro módulo (Totem/Cozinha), então a sessão não é apagada.
          setErro("Este dispositivo não tem permissão para acessar o Caixa.");
        }
      } else {
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar as pendências. Tente novamente.",
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
    void carregarPendencias();
  }, [navigate, carregarPendencias]);

  const marcarAcaoEmAndamento = useCallback((pedidoId: number, emAndamento: boolean) => {
    setAcoesEmAndamento((atual) => {
      const proximo = new Set(atual);
      if (emAndamento) {
        proximo.add(pedidoId);
      } else {
        proximo.delete(pedidoId);
      }
      return proximo;
    });
  }, []);

  const tratarErroAcao = useCallback(
    (pedidoId: number, error: unknown, mensagemPadrao: string) => {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        setSemAutorizacao(true);
        setErro("Sessão expirada. Ative o dispositivo novamente para continuar.");
      } else if (error instanceof ApiError && error.status === 403) {
        setErrosAcao((atual) => ({ ...atual, [pedidoId]: "Este dispositivo não tem permissão para executar esta ação." }));
      } else if (error instanceof ApiError && error.status === 404) {
        setErrosAcao((atual) => ({ ...atual, [pedidoId]: "Pedido não encontrado." }));
      } else if (error instanceof ApiError && error.status === 400) {
        setErrosAcao((atual) => ({ ...atual, [pedidoId]: error.message || mensagemPadrao }));
      } else if (error instanceof ApiError) {
        setErrosAcao((atual) => ({ ...atual, [pedidoId]: error.message }));
      } else {
        setErrosAcao((atual) => ({ ...atual, [pedidoId]: mensagemPadrao }));
      }
    },
    [],
  );

  const handleConfirmarPagamento = useCallback(
    async (pedidoId: number, observacao?: string) => {
      setErrosAcao((atual) => ({ ...atual, [pedidoId]: null }));
      marcarAcaoEmAndamento(pedidoId, true);

      try {
        const response = await confirmarPagamentoDinheiro(pedidoId, { observacao });
        await carregarPendencias();
        setMensagemSucesso(`Pagamento em dinheiro do pedido ${response.numeroPedido} confirmado.`);
      } catch (error) {
        tratarErroAcao(pedidoId, error, "Não foi possível confirmar o pagamento. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(pedidoId, false);
      }
    },
    [carregarPendencias, marcarAcaoEmAndamento, tratarErroAcao],
  );

  const handleEnviarCozinha = useCallback(
    async (pedidoId: number) => {
      setErrosAcao((atual) => ({ ...atual, [pedidoId]: null }));
      marcarAcaoEmAndamento(pedidoId, true);

      try {
        const response = await enviarPedidoParaCozinha(pedidoId);
        await carregarPendencias();
        setMensagemSucesso(`Pedido ${response.numeroPedido} enviado para a cozinha.`);
      } catch (error) {
        tratarErroAcao(pedidoId, error, "Não foi possível enviar o pedido para a cozinha. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(pedidoId, false);
      }
    },
    [carregarPendencias, marcarAcaoEmAndamento, tratarErroAcao],
  );

  return (
    <AppLayout title="Caixa" description="Pedidos pendentes de pagamento em dinheiro e envio à cozinha.">
      <div className="caixa-toolbar">
        <Button type="button" onClick={() => void carregarPendencias()} loading={loading}>
          Atualizar lista
        </Button>
      </div>

      {!loading && !erro && mensagemSucesso && (
        <p className="ui-success-message" role="status">
          {mensagemSucesso}
        </p>
      )}

      {loading && <p className="totem-estado">Carregando pendências...</p>}

      {!loading && erro && (
        <div className="totem-estado totem-estado--erro">
          <ErrorMessage message={erro} />
          {semAutorizacao ? (
            <Button type="button" onClick={() => navigate("/ativar-dispositivo")}>
              Ir para ativação de dispositivo
            </Button>
          ) : (
            <Button type="button" onClick={() => void carregarPendencias()}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {!loading && !erro && pendencias.length === 0 && (
        <p className="totem-estado">Nenhum pedido pendente no momento.</p>
      )}

      {!loading && !erro && pendencias.length > 0 && (
        <div className="caixa-lista">
          {pendencias.map((pedido) => (
            <PedidoPendenteCard
              key={pedido.pedidoId}
              pedido={pedido}
              executando={acoesEmAndamento.has(pedido.pedidoId)}
              erro={errosAcao[pedido.pedidoId] ?? null}
              onConfirmarPagamento={handleConfirmarPagamento}
              onEnviarCozinha={handleEnviarCozinha}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
