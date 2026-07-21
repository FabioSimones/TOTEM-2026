import type { ComponentType, SVGProps } from "react";

interface DashboardMetricCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string | number | null;
  loading?: boolean;
  /** Erro só deste indicador — nunca derruba os demais cards nem a página (TASK-118). */
  error?: string | null;
}

/**
 * TASK-118: card de indicador reutilizável do dashboard administrativo. Reaproveita as classes já
 * existentes `dashboard-admin__card*` (antes só usadas pela extinta `AdminDashboardPage` "de
 * métricas") em vez de criar uma variante nova — mesmo visual, agora com slot de ícone e estados de
 * loading/erro por card.
 */
export function DashboardMetricCard({ icon: Icon, label, value, loading, error }: DashboardMetricCardProps) {
  return (
    <div className="dashboard-admin__card">
      <Icon className="dashboard-admin__card-icon" aria-hidden="true" focusable="false" />
      {loading ? (
        <span className="dashboard-admin__card-valor dashboard-admin__card-valor--loading">Carregando…</span>
      ) : error ? (
        <span className="dashboard-admin__card-erro">{error}</span>
      ) : (
        <strong className="dashboard-admin__card-valor">{value ?? "—"}</strong>
      )}
      <span className="dashboard-admin__card-rotulo">{label}</span>
    </div>
  );
}
