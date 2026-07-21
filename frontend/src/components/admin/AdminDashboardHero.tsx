interface AdminDashboardHeroProps {
  nome: string;
  descricao: string;
}

/**
 * Ilustração decorativa própria (não reaproveita `FoodIcons` da TASK-117 para não duplicar a mesma
 * composição visual do login) — um "painel de indicadores" estilizado, coerente com o contexto de
 * gestão do dashboard. Puramente decorativo: `aria-hidden`, `focusable="false"`, flutuação sutil só
 * com `transform`/`opacity`, herdando a regra global de `prefers-reduced-motion` (TASK-113/117) sem
 * lógica JS própria.
 */
function DashboardIllustration() {
  return (
    <svg
      className="admin-hero__illustration"
      viewBox="0 0 120 120"
      width="120"
      height="120"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="14" y="20" width="92" height="80" rx="10" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
      <path d="M28 78 44 58 58 68 92 38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="92" cy="38" r="5" fill="currentColor" />
      <circle cx="58" cy="68" r="4" fill="currentColor" opacity="0.85" />
      <circle cx="44" cy="58" r="4" fill="currentColor" opacity="0.85" />
      <circle cx="28" cy="78" r="4" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

/**
 * TASK-118: área de boas-vindas do dashboard administrativo — eyebrow + saudação personalizada +
 * explicação contextual por perfil (texto vem de `AdminDashboardPage`, que já sabe se é
 * SUPER_ADMIN/ADMIN_RESTAURANTE) + ilustração decorativa.
 */
export function AdminDashboardHero({ nome, descricao }: AdminDashboardHeroProps) {
  return (
    <section className="admin-hero">
      <span className="admin-hero__blob admin-hero__blob--top" aria-hidden="true" />
      <span className="admin-hero__blob admin-hero__blob--bottom" aria-hidden="true" />

      <div className="admin-hero__content">
        <p className="admin-hero__eyebrow">Painel administrativo</p>
        <p className="admin-hero__greeting">Bem-vindo, {nome}!</p>
        <p className="admin-hero__description">{descricao}</p>
      </div>

      <DashboardIllustration />
    </section>
  );
}
