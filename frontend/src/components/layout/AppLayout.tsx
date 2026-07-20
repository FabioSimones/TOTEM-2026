import type { ReactNode } from "react";
import { ModuleHeader } from "./ModuleHeader";

interface AppLayoutProps {
  title: string;
  description?: string;
  children?: ReactNode;
  /** Centraliza o conteúdo horizontal e verticalmente no espaço disponível (ex.: telas de login). */
  centralizado?: boolean;
}

/** Layout compartilhado por todas as telas: cabeçalho do módulo + conteúdo. */
export function AppLayout({ title, description, children, centralizado = false }: AppLayoutProps) {
  const classeConteudo = "app-layout__content" + (centralizado ? " app-layout__content--centralizado" : "");
  return (
    <div className="app-layout">
      <ModuleHeader title={title} description={description} />
      <main className={classeConteudo}>{children}</main>
    </div>
  );
}
