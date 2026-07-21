/**
 * TASK-120: hero institucional da tela de autoatendimento — sem preço, produto ou promoção
 * fictícios (a referência visual usava um banner "Combo Especial por R$29,90" que não existe no
 * catálogo real). Ícone puramente decorativo, `aria-hidden`, com a mesma flutuação sutil e
 * respeito a `prefers-reduced-motion` já usados em `components/auth/FoodIcons.tsx`.
 */
function HeroBurgerIcon() {
  return (
    <svg
      className="totem-hero__icone"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 20c0-7.2 7.2-13 16-13s16 5.8 16 13"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="7" y="20" width="34" height="5" rx="2.5" fill="currentColor" />
      <rect x="9" y="27" width="30" height="4" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="9" y="33" width="30" height="4" rx="2" fill="currentColor" opacity="0.55" />
      <path
        d="M6 39c0-2.8 2.3-5 5-5h26c2.7 0 5 2.2 5 5s-2.3 5-5 5H11c-2.7 0-5-2.2-5-5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TotemHero() {
  return (
    <div className="totem-hero">
      <div>
        <h2 className="totem-hero__titulo">Monte seu pedido</h2>
        <p className="totem-hero__descricao">Escolha os produtos e acompanhe seu carrinho.</p>
      </div>
      <HeroBurgerIcon />
    </div>
  );
}
