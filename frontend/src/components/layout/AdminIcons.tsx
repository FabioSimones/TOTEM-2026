import type { SVGProps } from "react";

/**
 * TASK-118: SVGs de navegação do painel administrativo — mesmo espírito dos ícones decorativos da
 * TASK-117 (`components/auth/FoodIcons.tsx`), mas aqui **funcionais** (acompanham um link real).
 * Estilo único e consistente: `viewBox="0 0 24 24"`, traço (`currentColor`), sem preenchimento —
 * herdam a cor do elemento pai (link da sidebar, botão), então se adaptam a hover/estado ativo/tema
 * sem nenhuma lógica JS. Sempre `aria-hidden`/`focusable="false"` — o nome acessível vem do link/
 * botão que os envolve (`aria-label`/texto visível), nunca do ícone em si.
 */
function IconBase({ children, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
    </IconBase>
  );
}

export function RestauranteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6 3v7a2 2 0 0 0 4 0V3M8 3v18M18 3c-2 0-3 2-3 5s1 4 3 4M18 3v15" />
    </IconBase>
  );
}

export function DispositivoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="12" rx="1.6" />
      <path d="M8 20h8M12 16v4" />
    </IconBase>
  );
}

export function CategoriaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M11.3 3.5 3.5 11.3a1.8 1.8 0 0 0 0 2.5l6.7 6.7a1.8 1.8 0 0 0 2.5 0l7.8-7.8a1.8 1.8 0 0 0 .5-1.3V4.5a1 1 0 0 0-1-1h-6.4a1.8 1.8 0 0 0-1.3.5Z" />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function ProdutoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16Z" />
      <path d="M3.5 8 12 12.5 20.5 8M12 12.5V20.5" />
    </IconBase>
  );
}

export function UsuarioIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
    </IconBase>
  );
}

export function PedidoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6 3.5h12v17l-2.5-1.5-2.5 1.5-2.5-1.5L8 20.5 5.5 19V4.7Z" transform="translate(0.5 0)" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" />
    </IconBase>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </IconBase>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M15 4.5 7.5 12l7.5 7.5" />
    </IconBase>
  );
}

export function MoedaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.5 9.7c0-1.3 1.1-2.2 2.5-2.2s2.5.8 2.5 2c0 2.6-5 1.4-5 4 0 1.2 1.1 2 2.5 2s2.5-.9 2.5-2.2" />
    </IconBase>
  );
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M9 4H5.6A1.6 1.6 0 0 0 4 5.6v12.8A1.6 1.6 0 0 0 5.6 20H9" />
      <path d="M14 8l4.5 4-4.5 4M18.2 12H9" />
    </IconBase>
  );
}
