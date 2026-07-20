import { useCallback, useEffect, useState } from "react";
import { DispositivoAcessoCard } from "../../components/dispositivo/DispositivoAcessoCard";
import { OperadorPainel } from "../../components/operador/OperadorPainel";
import { AppLayout } from "../../components/layout/AppLayout";
import { PedidoCozinhaCard } from "../../components/cozinha/PedidoCozinhaCard";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { useDispositivoOperacional } from "../../hooks/useDispositivoOperacional";
import { atualizarStatusPedidoCozinha, listarPedidosCozinha } from "../../services/cozinhaService";
import { clearOperadorSession, getOperadorToken } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { PedidoCozinhaResponse } from "../../types/cozinha";
import { getProximoStatusCozinha } from "../../utils/cozinhaStatus";
import { rotuloTipoDispositivo } from "../../utils/tipoDispositivo";

export function CozinhaHomePage() {
  const {
    dispositivo,
    operador,
    dispositivoCompativel,
    setOperador,
    invalidarSessaoDispositivo,
    handleAtivarDispositivo,
    handleTrocarDispositivo,
  } = useDispositivoOperacional("COZINHA");

  const [pedidos, setPedidos] = useState<PedidoCozinhaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const [acoesEmAndamento, setAcoesEmAndamento] = useState<Set<number>>(new Set());
  const [errosAcao, setErrosAcao] = useState<Record<number, string | null>>({});

  const carregarPedidos = useCallback(async () => {
    setLoading(true);
    setErro(null);
    setMensagemSucesso(null);

    try {
      const response = await listarPedidosCozinha();
      setPedidos(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // TASK-112: token de dispositivo ou de operador inválido/expirado — sem distinção possível
        // aqui (a listagem exige os dois desde a TASK-111), limpa ambos e volta ao card de acesso.
        setPedidos([]);
        invalidarSessaoDispositivo();
      } else if (error instanceof ApiError && error.status === 403) {
        setErro("Este dispositivo ou operador não tem permissão para acessar a Cozinha.");
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
  }, [invalidarSessaoDispositivo]);

  useEffect(() => {
    if (!dispositivo || !dispositivoCompativel || !operador) {
      setLoading(false);
      return;
    }
    void carregarPedidos();
  }, [dispositivo, dispositivoCompativel, operador, carregarPedidos]);

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
          if (getOperadorToken()) {
            // TASK-092: mesma lógica do Caixa — 401 com operador identificado é mais provável ser
            // o token do operador expirado do que o do dispositivo.
            clearOperadorSession();
            setOperador(null);
            setErrosAcao((atual) => ({ ...atual, [pedidoId]: "Sessão do operador expirada. Identifique-se novamente." }));
          } else {
            setPedidos([]);
            invalidarSessaoDispositivo();
          }
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
    [pedidos, carregarPedidos, marcarAcaoEmAndamento, invalidarSessaoDispositivo, setOperador],
  );

  // TASK-112: sem dispositivo (nunca ativado, ou sessão invalidada) — card com caminho claro para ativar.
  if (!dispositivo) {
    return (
      <AppLayout title="Cozinha" description="Pedidos enviados para preparo e atualização de status." centralizado>
        <DispositivoAcessoCard
          titulo="Cozinha não ativada"
          mensagem="Este terminal de Cozinha ainda não foi ativado. Ative o equipamento para continuar."
          acaoPrincipal={{ rotulo: "Ativar este dispositivo", onAcionar: handleAtivarDispositivo }}
        />
      </AppLayout>
    );
  }

  // TASK-112: dispositivo autenticado, mas de outro tipo (ex.: CAIXA abrindo /cozinha).
  if (!dispositivoCompativel) {
    return (
      <AppLayout title="Cozinha" description="Pedidos enviados para preparo e atualização de status." centralizado>
        <DispositivoAcessoCard
          titulo="Dispositivo incompatível"
          mensagem={`Este equipamento está ativado como ${rotuloTipoDispositivo(dispositivo.tipoDispositivo)}, não como Cozinha.`}
          acaoPrincipal={{ rotulo: "Trocar dispositivo", onAcionar: handleTrocarDispositivo }}
        />
      </AppLayout>
    );
  }

  // TASK-111/112: sem operador identificado, a tela mostra só o login centralizado — nenhum pedido é
  // buscado nem renderizado (ver o efeito acima, que só chama carregarPedidos quando há operador).
  if (!operador) {
    return (
      <AppLayout title="Cozinha" description="Identifique-se para acessar a Cozinha." centralizado>
        <OperadorPainel
          operador={null}
          onIdentificado={(response) => setOperador(response.operador)}
          onTrocar={() => setOperador(null)}
          mensagemIdentificacao="Identifique-se para acessar a Cozinha."
          acaoTrocarDispositivo={{ rotulo: "Trocar dispositivo", onAcionar: handleTrocarDispositivo }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Cozinha" description="Pedidos enviados para preparo e atualização de status.">
      <OperadorPainel
        operador={operador}
        onIdentificado={(response) => setOperador(response.operador)}
        onTrocar={() => {
          // TASK-111: troca de operador oculta os pedidos imediatamente — a próxima renderização já
          // cai no branch "!operador" acima, então isto é só higiene de estado.
          setOperador(null);
          setPedidos([]);
          setErro(null);
          setMensagemSucesso(null);
        }}
        acaoTrocarDispositivo={{ rotulo: "Trocar dispositivo", onAcionar: handleTrocarDispositivo }}
      />

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
          <Button type="button" onClick={() => void carregarPedidos()}>
            Tentar novamente
          </Button>
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
