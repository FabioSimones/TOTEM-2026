/**
 * TASK-117: primeiros SVGs do projeto (antes só glifos/emoji — ver `docs/design-system/
 * componentes.md`, seção "Ícones"). Geometria própria, simples e consistente (mesmo `viewBox`,
 * mesmo peso de traço), desenhada para este painel institucional — não copiada de nenhuma
 * biblioteca externa.
 *
 * Puramente decorativos: `aria-hidden`/`focusable="false"` em cada `<svg>`, nunca recebem foco por
 * Tab e nunca entram na árvore de acessibilidade. O movimento (flutuação/rotação sutil) é aplicado
 * via classe CSS (`.food-icons__item`, ver `global.css`) usando só `transform`/`opacity` — herda a
 * regra global de `prefers-reduced-motion` (zera a duração da animação), sem lógica JS própria.
 */

function BurgerIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M8 20c0-7.2 7.2-13 16-13s16 5.8 16 13"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="7" y="20" width="34" height="5" rx="2.5" fill="currentColor" />
      <rect x="9" y="27" width="30" height="4" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="9" y="33" width="30" height="4" rx="2" fill="currentColor" opacity="0.55" />
      <path d="M6 39c0-2.8 2.3-5 5-5h26c2.7 0 5 2.2 5 5s-2.3 5-5 5H11c-2.7 0-5-2.2-5-5Z" fill="currentColor" />
    </svg>
  );
}

function FriesIcon() {
  return (
    <svg viewBox="0 0 48 48" width="42" height="42" fill="none" aria-hidden="true" focusable="false">
      <path d="M13 21 10 42h28l-3-21z" fill="currentColor" opacity="0.85" />
      <path d="M13 21h22l1.3-4H11.7z" fill="currentColor" />
      {[16, 21, 26, 31].map((x) => (
        <rect key={x} x={x - 1.4} y="8" width="2.8" height="17" rx="1.4" fill="currentColor" />
      ))}
    </svg>
  );
}

function DrinkIcon() {
  return (
    <svg viewBox="0 0 48 48" width="38" height="38" fill="none" aria-hidden="true" focusable="false">
      <path d="M14 14h20l-2.6 26a3 3 0 0 1-3 2.7H19.6a3 3 0 0 1-3-2.7z" fill="currentColor" opacity="0.85" />
      <rect x="12" y="9" width="24" height="6" rx="2" fill="currentColor" />
      <line x1="27" y1="4" x2="24" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Três ícones decorativos com flutuação independente (atraso/duração diferentes por item). */
export function FoodIcons() {
  return (
    <div className="food-icons" aria-hidden="true">
      <span className="food-icons__item food-icons__item--burger">
        <BurgerIcon />
      </span>
      <span className="food-icons__item food-icons__item--fries">
        <FriesIcon />
      </span>
      <span className="food-icons__item food-icons__item--drink">
        <DrinkIcon />
      </span>
    </div>
  );
}
