import type { UsuarioAutenticadoResponse } from "../types/auth";
import type { RestauranteAdminResponse } from "../types/restaurante";

/**
 * Só melhora a experiência do ADMIN_RESTAURANTE no frontend (esconder opções que o backend
 * bloquearia de qualquer forma) — a segurança real continua inteiramente no backend (TASK-058).
 */
export function isSuperAdmin(usuario: UsuarioAutenticadoResponse | null): boolean {
  return usuario?.perfil === "SUPER_ADMIN";
}

export function isAdminRestaurante(usuario: UsuarioAutenticadoResponse | null): boolean {
  return usuario?.perfil === "ADMIN_RESTAURANTE";
}

/** Restaurante ao qual o usuário está restrito, ou `null` para SUPER_ADMIN (acesso global). */
export function getRestauranteIdEscopo(usuario: UsuarioAutenticadoResponse | null): number | null {
  if (!usuario || isSuperAdmin(usuario)) {
    return null;
  }
  return usuario.restauranteId;
}

export function filtrarRestaurantesPorEscopo(
  restaurantes: RestauranteAdminResponse[],
  usuario: UsuarioAutenticadoResponse | null,
): RestauranteAdminResponse[] {
  if (!usuario || isSuperAdmin(usuario)) {
    return restaurantes;
  }
  return restaurantes.filter((restaurante) => restaurante.id === usuario.restauranteId);
}
