import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { AdminVoltarLink } from "../../components/admin/AdminVoltarLink";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { obterDashboard } from "../../services/adminDashboardService";
import { useAuth } from "../../auth/useAuth";
import { ApiError } from "../../types/api";
import type { DashboardAdminResponse } from "../../types/dashboardAdmin";
import { getRestauranteIdEscopo, isAdminRestaurante } from "../../utils/adminScope";
import { formatarDataReferencia } from "../../utils/dateTime";
import { formatCurrencyBRL } from "../../utils/formatters";

interface CardResumo {
  rotulo: string;
  valor: string;
}

function montarCards(resumo: DashboardAdminResponse): CardResumo[] {
  return [
    { rotulo: "Total de pedidos hoje", valor: String(resumo.totalPedidosHoje) },
    { rotulo: "Pendentes de pagamento", valor: String(resumo.pendentesPagamento) },
    { rotulo: "Pagos aguardando cozinha", valor: String(resumo.pagosAguardandoCozinha) },
    { rotulo: "Em operação (cozinha)", valor: String(resumo.emOperacao) },
    { rotulo: "Prontos para retirada", valor: String(resumo.prontosRetirada) },
    { rotulo: "Retirados hoje", valor: String(resumo.retiradosHoje) },
    { rotulo: "Cancelados hoje", valor: String(resumo.canceladosHoje) },
    { rotulo: "Expirados hoje", valor: String(resumo.expiradosHoje) },
    { rotulo: "Valor pago hoje", valor: formatCurrencyBRL(resumo.valorPagoHoje) },
  ];
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user: usuario, logout } = useAuth();
  const adminRestaurante = isAdminRestaurante(usuario);
  const restauranteIdEscopo = getRestauranteIdEscopo(usuario);

  const [resumo, setResumo] = useState<DashboardAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);

  const carregarResumo = useCallback(async () => {
    setLoading(true);
    setErro(null);
    setSemAutorizacao(false);

    try {
      const response = await obterDashboard({ restauranteId: restauranteIdEscopo ?? undefined });
      setResumo(response);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setSemAutorizacao(true);
        if (error.status === 401) {
          await logout();
          setErro("Sessão expirada. Faça login novamente.");
        } else {
          setErro("Você não tem permissão para acessar o dashboard.");
        }
      } else {
        setErro(error instanceof ApiError ? error.message : "Não foi possível carregar o dashboard. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }, [restauranteIdEscopo, logout]);

  useEffect(() => {
    void carregarResumo();
  }, [carregarResumo]);

  return (
    <AppLayout
      title="Dashboard"
      description="Visão rápida da operação: contadores de pedidos do dia e da fila atual."
    >
      <AdminVoltarLink />

      <div className="caixa-toolbar">
        <Button type="button" onClick={() => void carregarResumo()} loading={loading}>
          Atualizar
        </Button>
      </div>

      {adminRestaurante && (
        <p className="totem-estado admin-filtro-restaurante">
          Você está operando apenas no restaurante vinculado à sua conta.
        </p>
      )}

      {erro && (
        <div className="totem-estado totem-estado--erro">
          <ErrorMessage message={erro} />
          {semAutorizacao ? (
            <Button type="button" onClick={() => navigate("/login")}>
              Ir para login
            </Button>
          ) : (
            <Button type="button" onClick={() => void carregarResumo()}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {!semAutorizacao && !erro && (
        <>
          {loading && <p className="totem-estado">Carregando dashboard...</p>}

          {!loading && resumo && (
            <>
              {resumo.restauranteNome && (
                <p className="totem-estado dashboard-admin__restaurante">
                  Restaurante: {resumo.restauranteNome}
                </p>
              )}
              <p className="totem-estado dashboard-admin__data">
                Data de referência: {formatarDataReferencia(resumo.dataReferencia)}
              </p>

              <div className="dashboard-admin__grid">
                {montarCards(resumo).map((card) => (
                  <div key={card.rotulo} className="dashboard-admin__card">
                    <span className="dashboard-admin__card-rotulo">{card.rotulo}</span>
                    <strong className="dashboard-admin__card-valor">{card.valor}</strong>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !resumo && <p className="totem-estado">Não foi possível carregar o dashboard.</p>}
        </>
      )}
    </AppLayout>
  );
}
