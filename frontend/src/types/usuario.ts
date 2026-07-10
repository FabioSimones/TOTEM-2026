import type { PerfilUsuario } from "./auth";

export type { PerfilUsuario };

/**
 * POST /api/admin/usuarios — `restauranteId` é obrigatório para todo perfil
 * exceto SUPER_ADMIN (que nunca pode ter restaurante). `senha` só existe
 * no cadastro; nunca é enviada em nenhuma outra chamada.
 */
export interface CriarUsuarioRequest {
  restauranteId?: number;
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
  ativo?: boolean;
}

/** PUT /api/admin/usuarios/{id} — não aceita senha nem ativo (usar PATCH .../ativar|desativar). */
export interface AtualizarUsuarioRequest {
  restauranteId?: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

/** PATCH /api/admin/usuarios/{id}/senha — único campo aceito, nunca a senha atual (o admin não precisa conhecê-la). */
export interface AlterarSenhaUsuarioRequest {
  novaSenha: string;
}

/** GET/POST/PUT/PATCH /api/admin/usuarios — resposta completa do backend. Nunca inclui senha/senhaHash. */
export interface UsuarioAdminResponse {
  id: number;
  restauranteId: number | null;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string | null;
}
