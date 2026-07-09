import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { PedidoPendenteCard } from "../../components/caixa/PedidoPendenteCard";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { listarPendencias } from "../../services/caixaService";
import { clearSession, getAccessToken } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { PedidoPendenteCaixaResponse } from "../../types/caixa";

export function CaixaHomePage() {
  const navigate = useNavigate();
  const [pendencias, setPendencias] = useState<PedidoPendenteCaixaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);

  const carregarPendencias = useCallback(async () => {
    setLoading(true);
    setErro(null);
    setSemAutorizacao(false);

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

  return (
    <AppLayout title="Caixa" description="Pedidos pendentes de pagamento em dinheiro e envio à cozinha.">
      <div className="caixa-toolbar">
        <Button type="button" onClick={() => void carregarPendencias()} loading={loading}>
          Atualizar lista
        </Button>
      </div>

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
            <PedidoPendenteCard key={pedido.pedidoId} pedido={pedido} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
