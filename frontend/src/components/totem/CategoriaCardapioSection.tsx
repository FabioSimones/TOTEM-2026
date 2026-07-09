import type { CategoriaCardapioResponse, ProdutoCardapioResponse } from "../../types/totem";
import { ProdutoCard } from "./ProdutoCard";

interface CategoriaCardapioSectionProps {
  categoria: CategoriaCardapioResponse;
  onAddProduct?: (produto: ProdutoCardapioResponse) => void;
}

export function CategoriaCardapioSection({ categoria, onAddProduct }: CategoriaCardapioSectionProps) {
  return (
    <section className="categoria-section">
      <div className="categoria-section__cabecalho">
        <h2>{categoria.nome}</h2>
        {categoria.descricao && <p className="categoria-section__descricao">{categoria.descricao}</p>}
      </div>

      <div className="categoria-section__grid">
        {categoria.produtos.map((produto) => (
          <ProdutoCard key={produto.id} produto={produto} onAdd={onAddProduct} />
        ))}
      </div>
    </section>
  );
}
