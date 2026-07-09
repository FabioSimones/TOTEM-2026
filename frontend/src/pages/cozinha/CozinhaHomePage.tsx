import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { PedidoCozinhaCard } from "../../components/cozinha/PedidoCozinhaCard";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { atualizarStatusPedidoCozinha, listarPedidosCozinha } from "../../services/cozinhaService";
import { clearSession, getAccessToken } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { PedidoCozinhaResponse } from "../../types/cozinha";
import { getProximoStatusCozinha } from "../../utils/cozinhaStatus";

export function CozinhaHomePage() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<PedidoCozinhaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const [acoesEmAndamento, setAcoesEmAndamento] = useState<Set<number>>(new Set());
  const [errosAcao, setErrosAcao] = useState<Record<number, string | null>>({});

  const carregarPedidos = useCallback(async () => {
    setLoading(true);
    setErro(null);
    setSemAutorizacao(false);
    setMensagemSucesso(null);

    try {
      const response = await listarPedidosCozinha();
      setPedidos(response);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setSemAutorizacao(true);
        if (error.status === 401) {
          // Token inválido/expirado: não serve para mais nada, força nova ativação.
          clearSession();
          setErro("Sessão expirada. Ative o dispositivo novamente para continuar.");
        } else {
          // 403: token válido, mas sem permissão de COZINHA — pode ser legítimo
          // para outro módulo (Totem/Caixa), então a sessão não é apagada.
          setErro("Este dispositivo não tem permissão para acessar a Cozinha.");
        }
      } else {
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os pedidos. Tente novamente.",
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
    void carregarPedidos();
  }, [navigate, carregarPedidos]);

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

  const handleAvancarStatus = useCallback(
    async (pedidoId: number) => {
      const pedido = pedidos.find((item) => item.pedidoId === pedidoId);
      const proximoStatus = pedido ? getProximoStatusCozinha(pedido.statusPedido) : null;
      if (!proximoStatus) {
        return;
      }

      setErrosAcao((atual) => ({ ...atual, [pedidoId]: null }));
      marcarAcaoEmAndamento(pedidoId, true);

      try {
        const response = await atualizarStatusPedidoCozinha(pedidoId, { statusPedido: proximoStatus });
        await carregarPedidos();
        setMensagemSucesso(`Pedido ${response.numeroPedido} atualizado para ${response.statusAtual}.`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Ative o dispositivo novamente para continuar.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErrosAcao((atual) => ({
            ...atual,
            [pedidoId]: "Este dispositivo não tem permissão para executar esta ação.",
          }));
        } else if (error instanceof ApiError && error.status === 404) {
          setErrosAcao((atual) => ({ ...atual, [pedidoId]: "Pedido não encontrado." }));
        } else if (error instanceof ApiError && error.status === 400) {
          setErrosAcao((atual) => ({
            ...atual,
            [pedidoId]: error.message || "Não foi possível atualizar o status. Verifique o status atual do pedido.",
          }));
        } else if (error instanceof ApiError) {
          setErrosAcao((atual) => ({ ...atual, [pedidoId]: error.message }));
        } else {
          setErrosAcao((atual) => ({ ...atual, [pedidoId]: "Não foi possível atualizar o status. Tente novamente." }));
        }
      } finally {
        marcarAcaoEmAndamento(pedidoId, false);
      }
    },
    [pedidos, carregarPedidos, marcarAcaoEmAndamento],
  );

  return (
    <AppLayout title="Cozinha" description="Pedidos enviados para preparo e atualização de status.">
      <div className="caixa-toolbar">
        <Button type="button" onClick={() => void carregarPedidos()} loading={loading}>
          Atualizar lista
        </Button>
      </div>

      {!loading && !erro && mensagemSucesso && (
        <p className="ui-success-message" role="status">
          {mensagemSucesso}
        </p>
      )}

      {loading && <p className="totem-estado">Carregando pedidos...</p>}

      {!loading && erro && (
        <div className="totem-estado totem-estado--erro">
          <ErrorMessage message={erro} />
          {semAutorizacao ? (
            <Button type="button" onClick={() => navigate("/ativar-dispositivo")}>
              Ir para ativação de dispositivo
            </Button>
          ) : (
            <Button type="button" onClick={() => void carregarPedidos()}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {!loading && !erro && pedidos.length === 0 && (
        <p className="totem-estado">Nenhum pedido para preparar no momento.</p>
      )}

      {!loading && !erro && pedidos.length > 0 && (
        <div className="caixa-lista">
          {pedidos.map((pedido) => (
            <PedidoCozinhaCard
              key={pedido.pedidoId}
              pedido={pedido}
              executando={acoesEmAndamento.has(pedido.pedidoId)}
              erro={errosAcao[pedido.pedidoId] ?? null}
              onAvancarStatus={handleAvancarStatus}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
