/** POST /api/auth/login */
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  tipo: string;
  expiraEmSegundos: number;
}

/** POST /api/auth/dispositivos/ativar */
export interface AtivarDispositivoRequest {
  codigoAtivacao: string;
}

export interface AtivarDispositivoResponse {
  accessToken: string;
  tipo: string;
  expiraEmSegundos: number;
  dispositivoId: number;
  tipoDispositivo: "TOTEM" | "CAIXA" | "COZINHA" | "ADMINISTRACAO";
}
