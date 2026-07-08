import type { ReactNode } from "react";
import { ModuleHeader } from "./ModuleHeader";

interface AppLayoutProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

/** Layout compartilhado por todas as telas: cabeçalho do módulo + conteúdo. */
export function AppLayout({ title, description, children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <ModuleHeader title={title} description={description} />
      <main className="app-layout__content">{children}</main>
    </div>
  );
}
