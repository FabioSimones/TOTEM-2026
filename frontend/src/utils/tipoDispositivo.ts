import type { TipoDispositivo } from "../types/auth";

const ROTULOS: Record<TipoDispositivo, string> = {
  TOTEM: "Totem",
  CAIXA: "Caixa",
  COZINHA: "Cozinha",
  ADMINISTRACAO: "Administração",
};

/** Nome amigável de um tipo de dispositivo, usado nas mensagens de incompatibilidade (TASK-112). */
export function rotuloTipoDispositivo(tipo: TipoDispositivo): string {
  return ROTULOS[tipo];
}
