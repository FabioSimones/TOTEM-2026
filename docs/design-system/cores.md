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
| `--color-text-soft` | `#555555` | Texto terciário (placeholder de input — não usar em texto real, ver seção "Contraste" abaixo) |
| `--color-primary` | `#E63329` | Cor de marca — texto de destaque, bordas, foco (não usar como fundo de elemento preenchido, ver `--color-primary-button`) |
| `--color-primary-hover` | `#C0261E` | Estado hover/active da cor primária |
| `--color-primary-contrast` | `#FFFFFF` | Cor de texto sobre `--color-primary-button` |
| `--color-primary-button` (TASK-113) | `#E4261B` | Fundo de elementos preenchidos (`Button`, badges, toggles ativos) — mais escuro que `--color-primary` para atingir 4.5:1 com `--color-primary-contrast` por cima |
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
| `--color-text-muted` | `#7A6A5C` (TASK-113, era `#8B7A6B`) | Texto secundário |
| `--color-text-soft` | `#B8A898` | Texto terciário (placeholder de input — não usar em texto real, ver seção "Contraste" abaixo) |
| `--color-primary` | `#E8440A` | Cor de marca — laranja quente; texto de destaque, bordas, foco (não usar como fundo de elemento preenchido, ver `--color-primary-button`) |
| `--color-primary-hover` | `#C83808` | Estado hover/active |
| `--color-primary-contrast` | `#FFFFFF` | Cor de texto sobre `--color-primary-button` |
| `--color-primary-button` (TASK-113) | `#D43E09` | Fundo de elementos preenchidos — mais escuro que `--color-primary` para atingir 4.5:1 com `--color-primary-contrast` por cima |
| `--shadow-card` | `0 4px 20px rgba(26,18,9,0.08)` | Sombra suave (o fundo claro não pede sombra tão pesada quanto o dark) |
| `--shadow-primary` | `0 4px 16px rgba(232,68,10,0.25)` | Sombra com glow laranja em elementos primários |

## Painel institucional do login (TASK-117)

Únicas variáveis do projeto que **não** seguem o tema geral do app — o painel institucional de `/login` (`LoginBrandPanel`) fica sempre escuro nos dois temas (identidade de marca fixa), só variando a tonalidade entre dark/light. Definidas por tema em `themes.css`, junto das demais:

| Variável | Dark | Light | Uso |
|---|---|---|---|
| `--color-auth-brand-background` | `#050202` | `#2A1712` | Fundo do painel institucional — "ainda mais profundo" que `--color-bg` no dark; tom quente escuro no light (a referência visual usa um painel escuro fixo mesmo no tema claro) |
| `--color-auth-brand-surface` | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.08)` | Formas decorativas (`.auth-split__blob`) — sutil, nunca deve competir com o conteúdo |
| `--color-auth-brand-text` | `#FFFFFF` | `#FFF8F2` | Texto principal sobre o painel (sempre claro, painel sempre escuro) |
| `--color-auth-brand-text-muted` | `rgba(255,255,255,0.68)` | `rgba(255,248,242,0.72)` | Descrição/subtítulo institucional |
| `--color-auth-brand-accent` | `var(--color-primary)` | `var(--color-primary)` | Marcador do logo e dos bullets de recursos — reaproveita a cor de marca do tema ativo, não um valor fixo |

O painel do formulário (`.auth-split__panel`), ao lado, usa `--color-surface` normal (não `--color-bg`) — no dark, isso cria contraste visível entre os dois lados da tela (sem isso, `--color-bg` e `--color-auth-brand-background` ficam próximos demais e o layout dividido "some" visualmente).

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
- Não usar `--color-primary` como `background-color` de elemento preenchido (fundo sólido + texto por cima) — use `--color-primary-button`, que existe justamente porque `--color-primary` não atinge 4.5:1 com `--color-primary-contrast` em nenhum dos dois temas (ver "Contraste" abaixo). `--color-primary` continua correto para texto/borda/foco.
- Não usar `--color-text-soft` em texto real (avisos, labels, botões de texto) — é o único token do Design System que não atinge 4.5:1 contra as superfícies do app; existe só para placeholder de input, onde esse requisito não se aplica.

## Contraste (TASK-113)

Medido por luminância relativa (fórmula WCAG 2.x), mínimo exigido para texto normal: **4.5:1**. Valores antes/depois desta task:

| Uso | Antes | Depois |
|---|---|---|
| Texto do botão primário (`--color-primary-contrast` sobre fundo do botão) — dark | 4.31:1 (`--color-primary`) | **4.57:1** (`--color-primary-button`) |
| Texto do botão primário — light | 3.99:1 (`--color-primary`) | **4.67:1** (`--color-primary-button`) |
| `--color-text-muted` sobre `--color-surface` — light | 4.12:1 | **5.19:1** (também ≥4.5:1 sobre `--color-surface-elevated` e `--color-bg`) |
| `--color-text-muted` sobre `--color-surface` — dark | 5.01:1 (já conforme) | 5.01:1 (sem mudança) |
| `.cart-item-row__remover` / `.cart-summary__aviso` (eram `--color-text-soft`) | 2.38:1 (ambos os temas) | **5.01:1 dark / 5.19:1 light** (migrados para `--color-text-muted`) |

`--color-primary`/`--color-primary-hover` usados como **texto** (preços, links, badges) não foram alterados — permanecem nos mesmos valores de antes (4.12–4.54:1 dark, 3.66–3.99:1 light conforme o fundo), fora do escopo desta task; ver `docs/roadmap-pos-mvp.md` para a recomendação de acompanhamento.

## Foco visível, toque e movimento (TASK-113)

- **Foco**: `:where(button, a, input, select, textarea):focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }` em `global.css` — regra única para todo elemento interativo (antes só inputs tinham foco customizado; botões/links dependiam do outline padrão do navegador). Usa `:focus-visible`, não `:focus` — o anel só aparece em navegação por teclado, não em clique de mouse.
- **Touch targets**: mínimo de 44×44px (via `min-width`/`min-height`, não `width`/`height`, para não perder flexibilidade) em `.theme-toggle`, `.ui-modal__fechar` e `.cart-item-row__qtd-botao` (o controle de quantidade do carrinho do Totem, antes 28×28px). Espaçamento entre os alvos de toque do carrinho (`.cart-item-row__controles`) subiu de 4px para 8px.
- **`prefers-reduced-motion`**: bloco global em `global.css` reduz `animation-duration`/`transition-duration` a `0.01ms` e fixa `scroll-behavior: auto` quando o usuário pediu menos movimento no sistema operacional — não remove o feedback visual, só a transição.
