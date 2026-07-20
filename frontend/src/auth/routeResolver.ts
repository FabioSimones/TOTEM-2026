import { getStoredDispositivo } from "../services/tokenStorage";
import type { PerfilUsuario, TipoDispositivo, UsuarioAutenticadoResponse } from "../types/auth";

/** Perfil autenticado sem destino configurado na matriz de redirecionamento (ver auditoria, seção 12). */
export class PerfilNaoConfiguradoError extends Error {
  constructor(perfil: string) {
    super(`Perfil "${perfil}" não possui destino configurado no sistema.`);
    this.name = "PerfilNaoConfiguradoError";
  }
}

const ROTA_POR_PERFIL: Record<PerfilUsuario, string> = {
  SUPER_ADMIN: "/admin",
  ADMIN_RESTAURANTE: "/admin",
  OPERADOR_CAIXA: "/caixa",
  OPERADOR_COZINHA: "/cozinha",
};

const DISPOSITIVO_EXIGIDO_POR_PERFIL: Partial<Record<PerfilUsuario, TipoDispositivo>> = {
  OPERADOR_CAIXA: "CAIXA",
  OPERADOR_COZINHA: "COZINHA",
};

export type HomeRouteResult =
  | { kind: "route"; path: string }
  | { kind: "device-required"; tipoDispositivo: TipoDispositivo; mensagem: string };

/**
 * Calcula o destino pós-login a partir do perfil retornado por POST /api/auth/login.
 *
 * Regra crítica (auditoria, seção 2/12): operadores de Caixa/Cozinha só podem ser liberados para
 * `/caixa`/`/cozinha` quando o navegador já tem uma sessão de dispositivo COMPATÍVEL ativada. O
 * login central identifica e orienta o perfil humano, mas nunca substitui a exigência do JWT
 * DEVICE — se não houver dispositivo compatível, o resultado orienta para `/ativar-dispositivo`
 * em vez de liberar a interface operacional só com o token de usuário.
 */
export function resolveHomeRoute(usuario: UsuarioAutenticadoResponse): HomeRouteResult {
  const destino = ROTA_POR_PERFIL[usuario.perfil];
  if (!destino) {
    throw new PerfilNaoConfiguradoError(usuario.perfil);
  }

  const tipoDispositivoExigido = DISPOSITIVO_EXIGIDO_POR_PERFIL[usuario.perfil];
  if (tipoDispositivoExigido) {
    const dispositivo = getStoredDispositivo();
    if (!dispositivo || dispositivo.tipoDispositivo !== tipoDispositivoExigido) {
      return {
        kind: "device-required",
        tipoDispositivo: tipoDispositivoExigido,
        mensagem:
          `Este usuário possui perfil de operador de ${tipoDispositivoExigido === "CAIXA" ? "caixa" : "cozinha"}, ` +
          `mas este navegador ainda não está vinculado a um dispositivo ${tipoDispositivoExigido === "CAIXA" ? "Caixa" : "Cozinha"}.`,
      };
    }
  }

  return { kind: "route", path: destino };
}
