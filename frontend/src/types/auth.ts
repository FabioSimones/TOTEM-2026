export type TipoDispositivo = "TOTEM" | "CAIXA" | "COZINHA" | "ADMINISTRACAO";

export type PerfilUsuario = "SUPER_ADMIN" | "ADMIN_RESTAURANTE" | "OPERADOR_CAIXA" | "OPERADOR_COZINHA";

/** POST /api/auth/login */
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface UsuarioAutenticadoResponse {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  restauranteId: number | null;
  ativo: boolean;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: UsuarioAutenticadoResponse;
}

/** POST /api/auth/dispositivos/ativar */
export interface AtivarDispositivoRequest {
  codigoAtivacao: string;
}

export interface DispositivoAutenticadoResponse {
  id: number;
  nome: string;
  codigoIdentificacao: string;
  tipoDispositivo: TipoDispositivo;
  restauranteId: number;
  ativo: boolean;
  ultimoAcesso: string | null;
}

export interface AtivarDispositivoResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  dispositivo: DispositivoAutenticadoResponse;
}
