import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearOperadorSession,
  getOperador,
  getStoredDispositivo,
  limparSessaoOperacionalCompleta,
} from "../services/tokenStorage";
import type { DispositivoAutenticadoResponse, OperadorAutenticadoResponse, TipoDispositivo } from "../types/auth";

interface UseDispositivoOperacionalResult {
  dispositivo: DispositivoAutenticadoResponse | null;
  operador: OperadorAutenticadoResponse | null;
  /** `false` tanto quando não há dispositivo quanto quando há um de outro tipo. */
  dispositivoCompativel: boolean;
  setOperador: (operador: OperadorAutenticadoResponse | null) => void;
  /** Token de dispositivo inválido/expirado: limpa dispositivo+operador e força a tela de volta ao card de ativação. */
  invalidarSessaoDispositivo: () => void;
  /** Sem dispositivo ainda: garante que não sobra operador residual e vai para a ativação. */
  handleAtivarDispositivo: () => void;
  /** Dispositivo presente (compatível ou não): confirma, limpa dispositivo+operador e vai para a ativação. */
  handleTrocarDispositivo: () => void;
}

/**
 * TASK-112: estado compartilhado por CaixaHomePage/CozinhaHomePage para a camada "dispositivo" —
 * a de "operador" já era estado local antes (TASK-111), mas `dispositivo` era só lido uma vez
 * dentro de um `useEffect`, nunca reativo. Isso deixava a tela presa em estados inconsistentes
 * quando a sessão do dispositivo era invalidada no meio de uma ação (o valor antigo continuava
 * "válido" aos olhos do React até a próxima navegação manual). Centralizar aqui evita duplicar essa
 * lógica de limpeza/confirmação nas duas páginas.
 */
export function useDispositivoOperacional(tipoEsperado: TipoDispositivo): UseDispositivoOperacionalResult {
  const navigate = useNavigate();
  const [dispositivo, setDispositivo] = useState<DispositivoAutenticadoResponse | null>(() => getStoredDispositivo());
  const [operador, setOperador] = useState<OperadorAutenticadoResponse | null>(() => getOperador());

  const invalidarSessaoDispositivo = useCallback(() => {
    limparSessaoOperacionalCompleta();
    setDispositivo(null);
    setOperador(null);
  }, []);

  const handleAtivarDispositivo = useCallback(() => {
    clearOperadorSession();
    setOperador(null);
    navigate("/ativar-dispositivo");
  }, [navigate]);

  const handleTrocarDispositivo = useCallback(() => {
    const confirmado = window.confirm(
      "Ao trocar o dispositivo, a sessão do operador e a autenticação deste equipamento serão removidas. Deseja continuar?",
    );
    if (!confirmado) {
      return;
    }
    limparSessaoOperacionalCompleta();
    setDispositivo(null);
    setOperador(null);
    navigate("/ativar-dispositivo");
  }, [navigate]);

  return {
    dispositivo,
    operador,
    dispositivoCompativel: dispositivo?.tipoDispositivo === tipoEsperado,
    setOperador,
    invalidarSessaoDispositivo,
    handleAtivarDispositivo,
    handleTrocarDispositivo,
  };
}
