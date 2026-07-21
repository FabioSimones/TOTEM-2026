import { useEffect, useState } from "react";
import { FaUtensils } from "react-icons/fa6";

type ProductImageSize = "card" | "modal" | "thumbnail";

interface ProductImageProps {
  src?: string | null;
  productName: string;
  size?: ProductImageSize;
  loading?: "lazy" | "eager";
  className?: string;
}

/**
 * TASK-120.4: fonte única de verdade para exibir imagem de produto no Totem — antes, `ProdutoCard`
 * e `ProductSelectionModal` usavam 🍔 (emoji) como fallback e `CartReviewItem` usava um ícone SVG
 * próprio (`FaUtensils`); nenhum dos três tratava URL quebrada (`onError`), então uma imagem
 * presente mas inválida mostrava o ícone de imagem quebrada do navegador, não um fallback.
 *
 * Fallback único (`FaUtensils`, `react-icons/fa6` — já instalado, já é o fallback genérico do
 * resolvedor de categorias) — nunca emoji. Reset de `falhouAoCarregar` por `useEffect` a cada troca
 * de `src` (mesma estratégia já validada em `components/admin/produtos/ProdutoCard.tsx`, fora de
 * escopo desta task, mas não copiada literalmente — reimplementada aqui para o Totem). Sem risco de
 * loop: assim que `falhouAoCarregar` vira `true`, o `<img>` deixa de existir (troca para o
 * fallback), então não há novo `onError` a disparar.
 */
export function ProductImage({ src, productName, size = "card", loading = "lazy", className }: ProductImageProps) {
  const [falhouAoCarregar, setFalhouAoCarregar] = useState(false);

  useEffect(() => {
    setFalhouAoCarregar(false);
  }, [src]);

  const mostrarFallback = !src || falhouAoCarregar;
  const classes = `product-image product-image--${size}${className ? ` ${className}` : ""}`;

  return (
    <div className={classes}>
      {mostrarFallback ? (
        <div className="product-image__fallback" aria-hidden="true">
          <FaUtensils className="product-image__fallback-icone" />
        </div>
      ) : (
        <img
          className="product-image__img"
          src={src}
          alt={`Imagem de ${productName}`}
          loading={loading}
          onError={() => setFalhouAoCarregar(true)}
        />
      )}
    </div>
  );
}
