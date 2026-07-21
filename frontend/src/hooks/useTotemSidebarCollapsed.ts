import { useCallback, useState } from "react";

/**
 * TASK-120: preferência de UI da sidebar de categorias do Totem — mesma filosofia de
 * `useAdminSidebarCollapsed` (chave própria, não é dado de sessão, nunca lida por
 * `tokenStorage.ts`). Só se aplica em desktop — o chamador (`TotemLayout`) decide, por
 * breakpoint, se lê/escreve este valor; em mobile a sidebar sempre inicia fechada (drawer) e
 * nunca persiste.
 */
const SIDEBAR_COLLAPSED_KEY = "totem.totem.sidebarCollapsed";

function lerPreferenciaSalva(): boolean {
  try {
    const valor = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return valor === "true";
  } catch {
    return false;
  }
}

export function useTotemSidebarCollapsed(): [boolean, (valor: boolean) => void] {
  const [collapsed, setCollapsed] = useState<boolean>(lerPreferenciaSalva);

  const atualizar = useCallback((valor: boolean) => {
    setCollapsed(valor);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(valor));
    } catch {
      // Falha ao persistir não deve impedir o toggle de funcionar nesta sessão.
    }
  }, []);

  return [collapsed, atualizar];
}
