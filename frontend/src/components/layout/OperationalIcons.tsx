import type { SVGProps } from "react";

/**
 * TASK-119: ícones dos painéis operacionais (Caixa/Cozinha) — mesmo espírito geométrico de
 * `AdminIcons.tsx` (viewBox 24x24, traço `currentColor`, sem preenchimento, `aria-hidden`/
 * `focusable="false"`), num arquivo próprio porque o vocabulário visual aqui é operacional
 * (relógio, iniciar, pronto, trocar), não administrativo. Ícones já cobertos por `AdminIcons.tsx`
 * (pedido, pagamento, usuário, dispositivo) são reexportados em vez de duplicados.
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

export function CaixaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3" y="7" width="18" height="12" rx="1.6" />
      <path d="M3 11h18M7 15h3" />
    </IconBase>
  );
}

export function CozinhaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 10.5a8 8 0 0 1 16 0Z" />
      <path d="M4 10.5h16M5.5 10.5V19h13v-8.5" />
      <path d="M9.5 21h5" />
    </IconBase>
  );
}

/**
 * TASK-119 (achado de QA visual): "Trocar operador" e "Trocar dispositivo" usavam o mesmo ícone
 * genérico de troca — em mobile, onde só o ícone fica visível (texto ocultado por espaço), os dois
 * botões ficavam indistinguíveis a olho, mesmo com `aria-label` diferente cada um. Substituídos por
 * um ícone de pessoa-com-setas e um de dispositivo-com-setas, cada um específico da própria ação.
 */
export function TrocarOperadorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="7.5" r="3" />
      <path d="M4.5 19c1-3.2 3-5 5.5-5" />
      <path d="M15 6h5.5M18 3.5 20.5 6 18 8.5M20.5 15h-5.5M18 12.5 15.5 15 18 17.5" />
    </IconBase>
  );
}

export function TrocarDispositivoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="2.5" y="6" width="13" height="9" rx="1.4" />
      <path d="M6.5 19h5" />
      <path d="M19 4v6M16.5 6.5 19 4l2.5 2.5M19 20v-6M16.5 17.5 19 20l2.5-2.5" />
    </IconBase>
  );
}

export function AtualizarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5M19.5 12a7.5 7.5 0 0 1-12.6 5.5" />
      <path d="M17.5 3.5v3.5H14M6.5 20.5V17H10" />
    </IconBase>
  );
}

export function RelogioIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12.5" r="8" />
      <path d="M12 8v4.5l3 2M9.5 2.5h5" />
    </IconBase>
  );
}

export function IniciarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M7 4.5v15l13-7.5Z" />
    </IconBase>
  );
}

export function ProntoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </IconBase>
  );
}

export { DispositivoIcon, MoedaIcon, PedidoIcon, UsuarioIcon } from "./AdminIcons";
