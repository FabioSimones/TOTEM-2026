import type { ReactNode } from "react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { LoginBrandPanel } from "./LoginBrandPanel";

interface AuthSplitLayoutProps {
  children: ReactNode;
}

/**
 * TASK-117: casca de duas colunas para o login central — substitui `AppLayout`/`ModuleHeader`
 * somente em `/login` (as demais telas continuam usando o cabeçalho padrão do app). Painel
 * institucional (`LoginBrandPanel`) à esquerda em telas largas; em mobile/tablet estreito, o CSS
 * (`.auth-split`, ver `global.css`) empilha o painel institucional acima do formulário, nunca o
 * esconde por completo (mantém a marca visível).
 *
 * `ThemeToggle` fica no canto do painel do formulário (não numa barra full-width, como no
 * `ModuleHeader` padrão) — mesmo componente, mesma classe `.theme-toggle`, só reposicionado.
 */
export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="auth-split">
      <LoginBrandPanel />

      <div className="auth-split__panel">
        <div className="auth-split__panel-header">
          <ThemeToggle />
        </div>
        <div className="auth-split__panel-content">{children}</div>
      </div>
    </div>
  );
}
