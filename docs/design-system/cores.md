# Cores

Todas as variáveis abaixo vivem em `frontend/src/styles/themes.css`, escopadas por `[data-theme="dark"]` e `[data-theme="light"]`. **Nunca usar valores hex diretamente em componentes ou páginas** — sempre a variável CSS correspondente (`var(--color-*)`).

## Modo escuro — Dark & Bold

| Variável | Hex | Uso |
|---|---|---|
| `--color-bg` | `#0C0C0C` | Fundo base da página |
| `--color-bg-gradient-start` | `#1C0404` | Início do gradiente de fundo (canto superior) |
| `--color-bg-gradient-middle` | `#0C0C0C` | Meio do gradiente |
| `--color-bg-gradient-end` | `#120505` | Fim do gradiente (canto inferior) |
| `--color-surface` | `#181818` | Fundo de cards, headers, formulários |
| `--color-surface-elevated` | `#1C1C1E` | Elementos "acima" da surface — ex.: botão do `ThemeToggle` |
| `--color-border` | `#2A2A2C` | Bordas de inputs, cards, divisores |
| `--color-text` | `#FFFFFF` | Texto principal |
| `--color-text-muted` | `#888888` | Texto secundário (descrições, legendas) |
| `--color-text-soft` | `#555555` | Texto terciário (placeholders, texto desabilitado) |
| `--color-primary` | `#E63329` | Cor de marca — botões primários, destaques, foco |
| `--color-primary-hover` | `#C0261E` | Estado hover/active da cor primária |
| `--color-primary-contrast` | `#FFFFFF` | Cor de texto sobre `--color-primary` |
| `--shadow-card` | `0 4px 20px rgba(0,0,0,0.5)` | Sombra de cards/superfícies elevadas |
| `--shadow-primary` | `0 4px 16px rgba(230,51,41,0.35)` | Sombra com glow vermelho em elementos primários (botões) |

## Modo claro — Clean & Warm

| Variável | Hex | Uso |
|---|---|---|
| `--color-bg` | `#FFF8F2` | Fundo base da página |
| `--color-bg-gradient-start` | `#FFF0E8` | Início do gradiente de fundo |
| `--color-bg-gradient-middle` | `#FFF8F2` | Meio do gradiente |
| `--color-bg-gradient-end` | `#FFF3EC` | Fim do gradiente |
| `--color-surface` | `#FFFFFF` | Fundo de cards, headers, formulários |
| `--color-surface-elevated` | `#FFF3EC` | Elementos "acima" da surface (equivalente ao "elevated" do dark, chamado de "surface suave" na especificação visual original) |
| `--color-border` | `#EAD8CC` | Bordas de inputs, cards, divisores |
| `--color-text` | `#1A1209` | Texto principal |
| `--color-text-muted` | `#8B7A6B` | Texto secundário |
| `--color-text-soft` | `#B8A898` | Texto terciário |
| `--color-primary` | `#E8440A` | Cor de marca — laranja quente |
| `--color-primary-hover` | `#C83808` | Estado hover/active |
| `--color-primary-contrast` | `#FFFFFF` | Cor de texto sobre `--color-primary` |
| `--shadow-card` | `0 4px 20px rgba(26,18,9,0.08)` | Sombra suave (o fundo claro não pede sombra tão pesada quanto o dark) |
| `--shadow-primary` | `0 4px 16px rgba(232,68,10,0.25)` | Sombra com glow laranja em elementos primários |

## Cores semânticas (fixas, não variam por tema)

Definidas em `frontend/src/styles/tokens.css`, pois representam estado (sucesso/erro), não identidade de marca:

| Variável | Hex | Uso |
|---|---|---|
| `--color-error` | `#E5484D` | Mensagens de erro (`ErrorMessage`, validação) |
| `--color-success` | `#30A46C` | Mensagens de sucesso |

Foram escolhidas por manter contraste aceitável tanto sobre `#0C0C0C` (dark) quanto sobre `#FFF8F2` (light) — evita ter que duplicar a lógica de "erro" em cada tema.

## Gradiente de fundo

O `body` aplica um gradiente diagonal usando as três variáveis `--color-bg-gradient-*`:

```css
background-image: linear-gradient(
  135deg,
  var(--color-bg-gradient-start),
  var(--color-bg-gradient-middle) 50%,
  var(--color-bg-gradient-end)
);
```

No dark, isso cria um leve tom avermelhado nos cantos sobre o preto quase puro. No light, um leve aquecimento em tons de pêssego sobre o branco quente. Esse gradiente é sutil por design — não deve competir com o conteúdo.

## O que evitar

- Não usar `#fff`, `#000`, `red`, `orange` etc. soltos em CSS ou inline styles — sempre a variável.
- Não criar uma nova cor de marca por tela. Se uma tela realmente precisa de uma cor nova (ex.: destaque de status "PRONTO" na Cozinha), avalie primeiro se um dos tokens semânticos (`--color-success`) já resolve; se não, discuta a adição aqui antes de usar hex direto.
- Não assumir que `--color-primary` é sempre vermelho — no light é laranja. Código que depende da cor exata (não deveria, mas se depender) precisa checar o tema.
