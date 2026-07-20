import { useCallback, useEffect, useState } from "react";
import { DispositivoAcessoCard } from "../../components/dispositivo/DispositivoAcessoCard";
import { OperadorPainel } from "../../components/operador/OperadorPainel";
import { AppLayout } from "../../components/layout/AppLayout";
import { PedidoPendenteCard } from "../../components/caixa/PedidoPendenteCard";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { useDispositivoOperacional } from "../../hooks/useDispositivoOperacional";
import {
  cancelarPedido,
  confirmarPagamentoDinheiro,
  enviarPedidoParaCozinha,
  listarPendencias,
  marcarPedidoComoRetirado,
} from "../../services/caixaService";
import { clearOperadorSession, getOperadorToken } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { PedidoPendenteCaixaResponse } from "../../types/caixa";
import { rotuloTipoDispositivo } from "../../utils/tipoDispositivo";

export function CaixaHomePage() {
  const {
    dispositivo,
    operador,
    dispositivoCompativel,
    setOperador,
    invalidarSessaoDispositivo,
    handleAtivarDispositivo,
    handleTrocarDispositivo,
  } = useDispositivoOperacional("CAIXA");

  const [pendencias, setPendencias] = useState<PedidoPendenteCaixaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const [acoesEmAndamento, setAcoesEmAndamento] = useState<Set<number>>(new Set());
  const [errosAcao, setErrosAcao] = useState<Record<number, string | null>>({});

  const carregarPendencias = useCallback(async () => {
    setLoading(true);
    setErro(null);
    setMensagemSucesso(null);

    try {
      const response = await listarPendencias();
      setPendencias(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // TASK-112: token de dispositivo ou de operador inválido/expirado — sem distinção possível
        // aqui (a listagem exige os dois desde a TASK-111), limpa ambos e volta ao card de acesso.
        setPendencias([]);
        invalidarSessaoDispositivo();
      } else if (error instanceof ApiError && error.status === 403) {
        setErro("Este dispositivo ou operador não tem permissão para acessar o Caixa.");
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
  }, [invalidarSessaoDispositivo]);

  useEffect(() => {
    if (!dispositivo || !dispositivoCompativel || !operador) {
      setLoading(false);
      return;
    }
    void carregarPendencias();
  }, [dispositivo, dispositivoCompativel, operador, carregarPendencias]);

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
        if (getOperadorToken()) {
          // TASK-092: 401 numa ação com operador identificado é mais provável ser o token do
          // operador (curto, sem refresh) expirado do que o do dispositivo (que já tenta se
          // renovar sozinho via api.ts) — limpa só o operador, preserva a sessão do dispositivo.
          clearOperadorSession();
          setOperador(null);
          setErrosAcao((atual) => ({ ...atual, [pedidoId]: "Sessão do operador expirada. Identifique-se novamente." }));
        } else {
          setPendencias([]);
          invalidarSessaoDispositivo();
        }
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
    [invalidarSessaoDispositivo, setOperador],
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

  const handleRetirarPedido = useCallback(
    async (pedidoId: number) => {
      setErrosAcao((atual) => ({ ...atual, [pedidoId]: null }));
      marcarAcaoEmAndamento(pedidoId, true);

      try {
        const response = await marcarPedidoComoRetirado(pedidoId);
        await carregarPendencias();
        setMensagemSucesso(`Pedido ${response.numeroPedido} marcado como retirado.`);
      } catch (error) {
        tratarErroAcao(pedidoId, error, "Não foi possível marcar o pedido como retirado. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(pedidoId, false);
      }
    },
    [carregarPendencias, marcarAcaoEmAndamento, tratarErroAcao],
  );

  const handleCancelarPedido = useCallback(
    async (pedidoId: number, motivo: string) => {
      setErrosAcao((atual) => ({ ...atual, [pedidoId]: null }));
      marcarAcaoEmAndamento(pedidoId, true);

      try {
        const response = await cancelarPedido(pedidoId, { motivo });
        await carregarPendencias();
        setMensagemSucesso(`Pedido ${response.numeroPedido} cancelado.`);
      } catch (error) {
        tratarErroAcao(pedidoId, error, "Não foi possível cancelar o pedido. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(pedidoId, false);
      }
    },
    [carregarPendencias, marcarAcaoEmAndamento, tratarErroAcao],
  );

  // TASK-112: sem dispositivo (nunca ativado, ou sessão invalidada) — card com caminho claro para ativar.
  if (!dispositivo) {
    return (
      <AppLayout title="Caixa" description="Pedidos pendentes de pagamento em dinheiro, envio à cozinha e retirada." centralizado>
        <DispositivoAcessoCard
          titulo="Caixa não ativado"
          mensagem="Este Caixa ainda não foi ativado. Ative o equipamento para continuar."
          acaoPrincipal={{ rotulo: "Ativar este dispositivo", onAcionar: handleAtivarDispositivo }}
        />
      </AppLayout>
    );
  }

  // TASK-112: dispositivo autenticado, mas de outro tipo (ex.: COZINHA abrindo /caixa).
  if (!dispositivoCompativel) {
    return (
      <AppLayout title="Caixa" description="Pedidos pendentes de pagamento em dinheiro, envio à cozinha e retirada." centralizado>
        <DispositivoAcessoCard
          titulo="Dispositivo incompatível"
          mensagem={`Este equipamento está ativado como ${rotuloTipoDispositivo(dispositivo.tipoDispositivo)}, não como Caixa.`}
          acaoPrincipal={{ rotulo: "Trocar dispositivo", onAcionar: handleTrocarDispositivo }}
        />
      </AppLayout>
    );
  }

  // TASK-111/112: sem operador identificado, a tela mostra só o login centralizado — nenhum pedido é
  // buscado nem renderizado (ver o efeito acima, que só chama carregarPendencias quando há operador).
  if (!operador) {
    return (
      <AppLayout title="Caixa" description="Identifique-se para acessar o Caixa." centralizado>
        <OperadorPainel
          operador={null}
          onIdentificado={(response) => setOperador(response.operador)}
          onTrocar={() => setOperador(null)}
          mensagemIdentificacao="Identifique-se para acessar o Caixa."
          acaoTrocarDispositivo={{ rotulo: "Trocar dispositivo", onAcionar: handleTrocarDispositivo }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Caixa" description="Pedidos pendentes de pagamento em dinheiro, envio à cozinha e retirada.">
      <OperadorPainel
        operador={operador}
        onIdentificado={(response) => setOperador(response.operador)}
        onTrocar={() => {
          // TASK-111: troca de operador oculta os pedidos imediatamente — a próxima renderização já
          // cai no branch "!operador" acima, então isto é só higiene de estado (evita reter dados
          // do operador anterior em memória entre uma troca e a próxima identificação).
          setOperador(null);
          setPendencias([]);
          setErro(null);
          setMensagemSucesso(null);
        }}
        acaoTrocarDispositivo={{ rotulo: "Trocar dispositivo", onAcionar: handleTrocarDispositivo }}
      />

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
          <Button type="button" onClick={() => void carregarPendencias()}>
            Tentar novamente
          </Button>
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
              onRetirarPedido={handleRetirarPedido}
              onCancelarPedido={handleCancelarPedido}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
