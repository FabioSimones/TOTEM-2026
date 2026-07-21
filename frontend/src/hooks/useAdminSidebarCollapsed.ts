import { useCallback, useState } from "react";

/**
 * TASK-118: preferência de UI (não é dado de sessão — mesma filosofia de `totem.theme`, ver
 * `docs/design-system/temas.md`), chave própria, nunca lida por `tokenStorage.ts`. Só se aplica em
 * desktop — o chamador (`AdminLayout`) decide, por breakpoint, se lê/escreve este valor; em mobile
 * a sidebar sempre inicia fechada e nunca persiste (regra explícita da TASK-118).
 */
const SIDEBAR_COLLAPSED_KEY = "totem.admin.sidebarCollapsed";

function lerPreferenciaSalva(): boolean {
  try {
    const valor = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    // Só "true"/"false" são aceitos — qualquer outra coisa (chave ausente, valor corrompido de uma
    // versão futura/anterior) cai no padrão seguro (expandida), sem lançar nem quebrar a aplicação.
    return valor === "true";
  } catch {
    // localStorage indisponível (modo privado restritivo, quota, ambiente de teste) — degrada para
    // o padrão (expandida) em vez de quebrar a renderização do layout.
    return false;
  }
}

export function useAdminSidebarCollapsed(): [boolean, (valor: boolean) => void] {
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
