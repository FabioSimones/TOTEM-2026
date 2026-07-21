import type { IconType } from "react-icons";
import {
  FaBottleWater,
  FaBowlFood,
  FaBurger,
  FaCarrot,
  FaHotdog,
  FaIceCream,
  FaKitchenSet,
  FaMugSaucer,
  FaPizzaSlice,
  FaTableCellsLarge,
  FaUtensils,
} from "react-icons/fa6";
import { normalizarTextoBusca } from "../../utils/texto";

/** Ícone genérico para categorias sem correspondência conhecida — nunca o antigo "+". */
const ICONE_CATEGORIA_DESCONHECIDA: IconType = FaUtensils;

/**
 * TASK-120.2: regra temporária baseada só no nome normalizado da categoria — não existe (e esta
 * task não cria) um campo de ícone no domínio. Cada chave já passou por `normalizarChaveIcone`
 * (minúsculas, sem acento, hífen/espaço unificados); múltiplas chaves apontam para o mesmo ícone
 * (singular/plural, sinônimos comuns já vistos no projeto ou citados no briefing da task).
 * Deliberadamente nenhuma heurística automática (stemming, distância de edição) — só aliases
 * explícitos, fáceis de auditar e estender. Nunca mapeado por `categoria.id` (varia entre
 * bancos/restaurantes). Evolução futura (não implementada aqui, ver docs/roadmap-pos-mvp.md):
 * campo de ícone explícito no cadastro de categoria.
 */
const ALIASES_ICONE_CATEGORIA: Record<string, IconType> = {
  todas: FaTableCellsLarge,
  todos: FaTableCellsLarge,
  cardapio: FaTableCellsLarge,

  bebida: FaBottleWater,
  bebidas: FaBottleWater,
  refrigerante: FaBottleWater,
  refrigerantes: FaBottleWater,
  suco: FaBottleWater,
  sucos: FaBottleWater,

  hamburguer: FaBurger,
  hamburgueres: FaBurger,
  lanche: FaBurger,
  lanches: FaBurger,

  "cachorro quente": FaHotdog,
  "cachorros quentes": FaHotdog,
  "hot dog": FaHotdog,
  "hot dogs": FaHotdog,
  hotdog: FaHotdog,
  hotdogs: FaHotdog,

  pizza: FaPizzaSlice,
  pizzas: FaPizzaSlice,

  batata: FaBowlFood,
  batatas: FaBowlFood,
  "batata frita": FaBowlFood,
  "batatas fritas": FaBowlFood,
  porcao: FaBowlFood,
  porcoes: FaBowlFood,
  fritas: FaBowlFood,

  sobremesa: FaIceCream,
  sobremesas: FaIceCream,
  sorvete: FaIceCream,
  sorvetes: FaIceCream,

  combo: FaKitchenSet,
  combos: FaKitchenSet,
  refeicao: FaKitchenSet,
  refeicoes: FaKitchenSet,

  cafe: FaMugSaucer,
  cafes: FaMugSaucer,

  salada: FaCarrot,
  saladas: FaCarrot,
  saudavel: FaCarrot,
  saudaveis: FaCarrot,
};

/** Colapsa hífen/underscore em espaço e normaliza espaços repetidos, além do que
 * `normalizarTextoBusca` já faz (minúsculas, sem acento, sem espaço nas bordas) — permite que
 * "Cachorro-quente" e "cachorro quente" caiam na mesma chave do alias. */
function normalizarChaveIcone(nome: string): string {
  return normalizarTextoBusca(nome)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Devolve o componente de ícone (react-icons) correspondente ao nome da categoria, ou o
 * fallback genérico quando não há alias reconhecido. */
export function resolverIconeCategoria(nomeCategoria: string): IconType {
  const chave = normalizarChaveIcone(nomeCategoria);
  return ALIASES_ICONE_CATEGORIA[chave] ?? ICONE_CATEGORIA_DESCONHECIDA;
}

type CategoryIconSize = "sm" | "md" | "lg";

interface CategoryIconProps {
  categoryName: string;
  size?: CategoryIconSize;
  className?: string;
}

/**
 * Camada fina sobre `resolverIconeCategoria` — mantém tamanho (tokens `--icon-size-*`) e
 * acessibilidade consistentes. Sempre decorativo (`aria-hidden`/`focusable="false"`): o nome
 * acessível da categoria vem sempre do texto/`aria-label` do botão que o envolve, nunca do ícone.
 */
export function CategoryIcon({ categoryName, size = "md", className }: CategoryIconProps) {
  const Icone = resolverIconeCategoria(categoryName);
  const classes = `category-icon category-icon--${size}${className ? ` ${className}` : ""}`;
  return <Icone aria-hidden="true" focusable="false" className={classes} />;
}
