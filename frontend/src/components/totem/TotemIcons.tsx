import type { SVGProps } from "react";

/**
 * TASK-120: ícones SVG próprios da tela do Totem — mesmo espírito de `AdminIcons.tsx`
 * (`viewBox 0 0 24 24`, traço em `currentColor`, sem preenchimento, sempre `aria-hidden`/
 * `focusable="false"`), mas mantidos aqui, dentro de `components/totem`, para não acoplar a tela
 * de autoatendimento (voltada ao cliente) ao módulo administrativo. O nome acessível de cada ícone
 * vem sempre do botão/link que o envolve, nunca do ícone em si.
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

export function TotemMenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </IconBase>
  );
}

export function TotemSearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.5-4.5" />
    </IconBase>
  );
}

export function TotemClearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </IconBase>
  );
}

export function TotemCartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3.5 4.5h2l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h7.6a1.8 1.8 0 0 0 1.75-1.4L21 8.5H6.4" />
      <circle cx="10" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none" />
    </IconBase>
  );
}
