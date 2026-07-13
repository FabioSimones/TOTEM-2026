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
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  usuario: UsuarioAutenticadoResponse;
}

/** POST /api/auth/refresh — troca um refreshToken válido por um novo par accessToken/refreshToken (rotação). */
export interface RefreshRequest {
  refreshToken: string;
}

/** Resposta de refresh: exatamente um entre usuario e dispositivo é preenchido. */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  usuario: UsuarioAutenticadoResponse | null;
  dispositivo: DispositivoAutenticadoResponse | null;
}

/** POST /api/auth/logout — revoga o refreshToken informado. Idempotente. */
export interface LogoutRequest {
  refreshToken: string;
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
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  dispositivo: DispositivoAutenticadoResponse;
}
