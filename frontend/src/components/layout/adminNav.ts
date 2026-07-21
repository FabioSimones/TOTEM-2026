import type { ComponentType, SVGProps } from "react";
import type { PerfilUsuario } from "../../types/auth";
import {
  CategoriaIcon,
  DashboardIcon,
  DispositivoIcon,
  PedidoIcon,
  ProdutoIcon,
  RestauranteIcon,
  UsuarioIcon,
} from "./AdminIcons";

export interface AdminNavItem {
  path: string;
  label: string;
  /** Descrição contextual usada pela `AdminTopbar` como subtítulo da página. */
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * Perfis que veem este item na sidebar — reflete a regra de autorização já existente
   * (RoleGuard/backend, ver auditoria da TASK-118), nunca a substitui. Rotas com `RoleGuard`
   * (`/admin/restaurantes`, `/admin/usuarios`) usam exatamente o mesmo conjunto de perfis do
   * `allowedRoles` em `AppRoutes.tsx` — a ocultação na sidebar é só uma conveniência de UX, a
   * proteção real continua na rota e no backend.
   */
  roles: PerfilUsuario[];
}

/**
 * Fonte única para sidebar (`AdminSidebar`) e cabeçalho (`AdminTopbar`, título/descrição por rota
 * via `useLocation()`), evitando duplicar título/descrição em cada página — ver TASK-118.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    path: "/admin",
    label: "Dashboard",
    description: "Visão geral do sistema",
    icon: DashboardIcon,
    roles: ["SUPER_ADMIN", "ADMIN_RESTAURANTE"],
  },
  {
    path: "/admin/restaurantes",
    label: "Restaurantes",
    description: "Gerencie os restaurantes da plataforma",
    icon: RestauranteIcon,
    roles: ["SUPER_ADMIN"],
  },
  {
    path: "/admin/dispositivos",
    label: "Dispositivos",
    description: "Ative e acompanhe os equipamentos",
    icon: DispositivoIcon,
    roles: ["SUPER_ADMIN", "ADMIN_RESTAURANTE"],
  },
  {
    path: "/admin/categorias",
    label: "Categorias",
    description: "Organize o cardápio",
    icon: CategoriaIcon,
    roles: ["SUPER_ADMIN", "ADMIN_RESTAURANTE"],
  },
  {
    path: "/admin/produtos",
    label: "Produtos",
    description: "Gerencie itens, preços e disponibilidade",
    icon: ProdutoIcon,
    roles: ["SUPER_ADMIN", "ADMIN_RESTAURANTE"],
  },
  {
    path: "/admin/usuarios",
    label: "Usuários",
    description: "Gerencie acessos e perfis",
    icon: UsuarioIcon,
    roles: ["SUPER_ADMIN", "ADMIN_RESTAURANTE"],
  },
  {
    path: "/admin/pedidos",
    label: "Pedidos",
    description: "Acompanhe os pedidos do restaurante",
    icon: PedidoIcon,
    roles: ["SUPER_ADMIN", "ADMIN_RESTAURANTE"],
  },
];

export function itensVisiveisParaPerfil(perfil: PerfilUsuario | undefined): AdminNavItem[] {
  if (!perfil) {
    return [];
  }
  return ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(perfil));
}

export function encontrarItemPorRota(pathname: string): AdminNavItem | undefined {
  // Rotas administrativas nunca se aninham por prefixo (ex.: "/admin/produtos" não é prefixo de
  // "/admin/produtos-x"), então comparação exata é suficiente e evita falso-positivo.
  return ADMIN_NAV_ITEMS.find((item) => item.path === pathname);
}
