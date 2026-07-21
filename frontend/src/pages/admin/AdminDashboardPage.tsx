import { useCallback, useEffect, useState } from "react";
import { AdminDashboardHero } from "../../components/admin/AdminDashboardHero";
import { DashboardMetricCard } from "../../components/admin/DashboardMetricCard";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { MoedaIcon, PedidoIcon } from "../../components/layout/AdminIcons";
import { obterDashboard } from "../../services/adminDashboardService";
import { useAuth } from "../../auth/useAuth";
import { ApiError } from "../../types/api";
import type { DashboardAdminResponse } from "../../types/dashboardAdmin";
import { getRestauranteIdEscopo, isAdminRestaurante, isSuperAdmin } from "../../utils/adminScope";
import { formatarDataReferencia } from "../../utils/dateTime";
import { formatCurrencyBRL } from "../../utils/formatters";

interface CardMetrica {
  rotulo: string;
  valor: string;
  icon: typeof PedidoIcon;
}

function montarCards(resumo: DashboardAdminResponse): CardMetrica[] {
  return [
    { rotulo: "Total de pedidos hoje", valor: String(resumo.totalPedidosHoje), icon: PedidoIcon },
    { rotulo: "Pendentes de pagamento", valor: String(resumo.pendentesPagamento), icon: PedidoIcon },
    { rotulo: "Pagos aguardando cozinha", valor: String(resumo.pagosAguardandoCozinha), icon: PedidoIcon },
    { rotulo: "Em operação (cozinha)", valor: String(resumo.emOperacao), icon: PedidoIcon },
    { rotulo: "Prontos para retirada", valor: String(resumo.prontosRetirada), icon: PedidoIcon },
    { rotulo: "Retirados hoje", valor: String(resumo.retiradosHoje), icon: PedidoIcon },
    { rotulo: "Cancelados hoje", valor: String(resumo.canceladosHoje), icon: PedidoIcon },
    { rotulo: "Expirados hoje", valor: String(resumo.expiradosHoje), icon: PedidoIcon },
    { rotulo: "Valor pago hoje", valor: formatCurrencyBRL(resumo.valorPagoHoje), icon: MoedaIcon },
  ];
}

/**
 * TASK-118: dashboard inicial do Admin — fusão da antiga `AdminHomePage` (rota `/admin`, destino
 * real de `resolveHomeRoute` pós-login) com a antiga `AdminDashboardPage` (rota `/admin/dashboard`,
 * métricas reais via `GET /api/admin/dashboard`). A grade de "módulos" que existia em
 * `AdminHomePage` foi removida (decisão de produto da TASK-118: os módulos já estão na sidebar,
 * mantê-los aqui também seria duplicação). `/admin/dashboard` passou a redirecionar para `/admin`
 * (ver `AppRoutes.tsx`), não existem mais dois "dashboards".
 *
 * Indicadores são os mesmos 9 campos que `GET /api/admin/dashboard` já retornava — nenhum número é
 * inventado; se a consulta falha, o hero de boas-vindas continua visível e só a seção de métricas
 * mostra o erro (uma falha de indicador nunca derruba a página inteira).
 */
export function AdminDashboardPage() {
  const { user: usuario, logout } = useAuth();
  const adminRestaurante = isAdminRestaurante(usuario);
  const superAdmin = isSuperAdmin(usuario);
  const restauranteIdEscopo = getRestauranteIdEscopo(usuario);

  const [resumo, setResumo] = useState<DashboardAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarResumo = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      const response = await obterDashboard({ restauranteId: restauranteIdEscopo ?? undefined });
      setResumo(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await logout();
        setErro("Sessão expirada. Faça login novamente.");
      } else if (error instanceof ApiError && error.status === 403) {
        setErro("Você não tem permissão para ver os indicadores do dashboard.");
      } else {
        setErro(error instanceof ApiError ? error.message : "Não foi possível carregar os indicadores. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }, [restauranteIdEscopo, logout]);

  useEffect(() => {
    void carregarResumo();
  }, [carregarResumo]);

  if (!usuario) {
    return null;
  }

  const descricaoHero = superAdmin
    ? "Gerencie restaurantes, dispositivos, cardápios, usuários e pedidos em um só lugar. Use o menu lateral para navegar entre os módulos do sistema."
    : "Gerencie dispositivos, cardápio, usuários e pedidos do restaurante vinculado à sua conta. Use o menu lateral para navegar entre os módulos disponíveis.";

  return (
    <div className="admin-dashboard-page">
      <AdminDashboardHero nome={usuario.nome} descricao={descricaoHero} />

      {adminRestaurante && (
        <p className="totem-estado admin-filtro-restaurante">
          Você está operando apenas no restaurante vinculado à sua conta.
        </p>
      )}

      <div className="dashboard-admin__toolbar">
        <h2 className="dashboard-admin__secao-titulo">Indicadores de hoje</h2>
        <Button type="button" variant="secondary" onClick={() => void carregarResumo()} loading={loading}>
          Atualizar
        </Button>
      </div>

      {erro && (
        <div className="totem-estado totem-estado--erro">
          <ErrorMessage message={erro} />
          <Button type="button" onClick={() => void carregarResumo()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!erro && !loading && resumo && (
        <>
          {resumo.restauranteNome && (
            <p className="totem-estado dashboard-admin__restaurante">Restaurante: {resumo.restauranteNome}</p>
          )}
          <p className="totem-estado dashboard-admin__data">
            Data de referência: {formatarDataReferencia(resumo.dataReferencia)}
          </p>

          <div className="dashboard-admin__grid">
            {montarCards(resumo).map((card) => (
              <DashboardMetricCard key={card.rotulo} icon={card.icon} label={card.rotulo} value={card.valor} />
            ))}
          </div>
        </>
      )}

      {!erro && loading && (
        <div className="dashboard-admin__grid">
          {Array.from({ length: 4 }).map((_, indice) => (
            <DashboardMetricCard key={indice} icon={PedidoIcon} label="Carregando indicador…" value={null} loading />
          ))}
        </div>
      )}
    </div>
  );
}
