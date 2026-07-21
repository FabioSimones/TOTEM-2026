import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
import { CategoryIcon, resolverIconeCategoria } from "./categoryIconResolver";

describe("resolverIconeCategoria", () => {
  it("'Todas'/'Todos'/'Cardápio' resolvem para o ícone de grade", () => {
    expect(resolverIconeCategoria("Todas")).toBe(FaTableCellsLarge);
    expect(resolverIconeCategoria("Todos")).toBe(FaTableCellsLarge);
    expect(resolverIconeCategoria("Cardápio")).toBe(FaTableCellsLarge);
  });

  it("categorias de bebida resolvem para o ícone de garrafa", () => {
    expect(resolverIconeCategoria("Bebidas")).toBe(FaBottleWater);
    expect(resolverIconeCategoria("Refrigerantes")).toBe(FaBottleWater);
    expect(resolverIconeCategoria("Sucos")).toBe(FaBottleWater);
  });

  it("Hambúrgueres/Lanches resolvem para o ícone de hambúrguer", () => {
    expect(resolverIconeCategoria("Hambúrgueres")).toBe(FaBurger);
    expect(resolverIconeCategoria("Hambúrguer")).toBe(FaBurger);
    expect(resolverIconeCategoria("Lanches")).toBe(FaBurger);
  });

  it("Cachorros-quentes/Hot dog resolvem para o ícone de hot dog, com ou sem hífen", () => {
    expect(resolverIconeCategoria("Cachorros-quentes")).toBe(FaHotdog);
    expect(resolverIconeCategoria("Cachorro Quente")).toBe(FaHotdog);
    expect(resolverIconeCategoria("Hot Dog")).toBe(FaHotdog);
    expect(resolverIconeCategoria("Hotdogs")).toBe(FaHotdog);
  });

  it("Pizzas resolve para o ícone de fatia de pizza", () => {
    expect(resolverIconeCategoria("Pizzas")).toBe(FaPizzaSlice);
  });

  it("Batatas/Porções/Fritas resolvem para o mesmo ícone", () => {
    expect(resolverIconeCategoria("Batatas Fritas")).toBe(FaBowlFood);
    expect(resolverIconeCategoria("Porções")).toBe(FaBowlFood);
    expect(resolverIconeCategoria("Fritas")).toBe(FaBowlFood);
  });

  it("Sobremesas/Sorvetes resolvem para o ícone de sorvete", () => {
    expect(resolverIconeCategoria("Sobremesas")).toBe(FaIceCream);
    expect(resolverIconeCategoria("Sorvetes")).toBe(FaIceCream);
  });

  it("Combos/Refeições resolvem para o ícone de refeição", () => {
    expect(resolverIconeCategoria("Combos")).toBe(FaKitchenSet);
    expect(resolverIconeCategoria("Refeições")).toBe(FaKitchenSet);
  });

  it("Cafés resolve para o ícone de caneca", () => {
    expect(resolverIconeCategoria("Cafés")).toBe(FaMugSaucer);
  });

  it("Saladas/Saudáveis resolvem para o ícone de cenoura", () => {
    expect(resolverIconeCategoria("Saladas")).toBe(FaCarrot);
    expect(resolverIconeCategoria("Saudáveis")).toBe(FaCarrot);
  });

  it("acento e caixa diferentes não alteram a resolução", () => {
    expect(resolverIconeCategoria("BEBIDAS")).toBe(FaBottleWater);
    expect(resolverIconeCategoria("bebidas")).toBe(FaBottleWater);
    expect(resolverIconeCategoria("  Bebidas  ")).toBe(FaBottleWater);
  });

  it("categoria desconhecida retorna o ícone genérico — nunca o antigo '+'", () => {
    expect(resolverIconeCategoria("Categoria Totalmente Inventada")).toBe(FaUtensils);
    expect(resolverIconeCategoria("")).toBe(FaUtensils);
  });

  it("categorias diferentes nunca resolvem para o mesmo ícone quando reconhecidas", () => {
    const icones = new Set([
      resolverIconeCategoria("Bebidas"),
      resolverIconeCategoria("Hambúrgueres"),
      resolverIconeCategoria("Cachorros-quentes"),
      resolverIconeCategoria("Pizzas"),
    ]);
    expect(icones.size).toBe(4);
  });
});

describe("CategoryIcon", () => {
  it("renderiza o ícone como decorativo (aria-hidden, não focável)", () => {
    const { container } = render(<CategoryIcon categoryName="Bebidas" />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  it("aplica a classe de tamanho correspondente (padrão 'md')", () => {
    const { container } = render(<CategoryIcon categoryName="Bebidas" />);

    expect(container.querySelector("svg")).toHaveClass("category-icon--md");
  });

  it("aceita tamanho explícito e className extra", () => {
    const { container } = render(<CategoryIcon categoryName="Bebidas" size="lg" className="totem-sidebar__item-icone" />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("category-icon--lg");
    expect(svg).toHaveClass("totem-sidebar__item-icone");
  });
});
