# Tipografia

Cada tema usa um par de fontes distinto — título e corpo mudam junto com o tema, reforçando a identidade visual de cada modo.

| | Título (`--font-heading`) | Corpo (`--font-body`) |
|---|---|---|
| Dark & Bold | **Oswald** — condensada, forte, boa para números/preços grandes e headers de alto impacto | **DM Sans** — geométrica, neutra, legível em telas de touch |
| Clean & Warm | **Sora** — moderna, arredondada, mais "amigável" que Oswald | **Plus Jakarta Sans** — versátil, boa legibilidade em corpo de texto |

## Carregamento

As 4 famílias são carregadas via Google Fonts no `<head>` de `frontend/index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap"
/>
```

Pesos carregados: 400 (regular), 500 (medium), 600 (semibold), 700 (bold) — cobre o que `tokens.css` expõe em `--font-weight-*`. **Nenhum arquivo de fonte é versionado no repositório** — sempre via Google Fonts CDN. Se o produto precisar funcionar 100% offline no futuro (PWA sem rede), isso precisará ser revisto (hospedar as fontes localmente).

## Uso no CSS

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

body {
  font-family: var(--font-body);
}
```

Qualquer elemento de título (nome de produto em destaque, número do pedido, valor total) deve usar `var(--font-heading)`. Texto corrido, labels, botões e inputs usam `var(--font-body)`.

## Escala de tamanho

Definida em `tokens.css` (compartilhada pelos dois temas — só a fonte muda, não o tamanho):

| Variável | Valor | Uso sugerido |
|---|---|---|
| `--font-size-sm` | `0.875rem` | Texto auxiliar, legendas |
| `--font-size-md` | `1rem` | Corpo padrão, inputs, botões |
| `--font-size-lg` | `1.25rem` | Subtítulos |
| `--font-size-xl` | `1.75rem` | Título de página (`ModuleHeader` usa este) |
| `--font-size-2xl` | `2.5rem` | Números de destaque (ex.: valor total de um pedido) |

## Pesos

| Variável | Valor |
|---|---|
| `--font-weight-regular` | 400 |
| `--font-weight-medium` | 500 |
| `--font-weight-semibold` | 600 |
| `--font-weight-bold` | 700 |

## O que evitar

- Não importar uma quinta família de fonte sem atualizar este documento e os dois temas.
- Não usar `font-family` inline ou hardcoded — sempre `var(--font-heading)`/`var(--font-body)`.
- Não usar `font-weight: 300` ou outros pesos fora da escala acima sem necessidade real — a Google Fonts request só carrega 400/500/600/700; um peso fora disso cai no fallback do navegador (fonte errada renderizada).
