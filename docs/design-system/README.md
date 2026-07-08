# Design System — Totem Fast Food

Criado na TASK-030. Documenta e formaliza o padrão visual do frontend: dois temas (escuro e claro), tipografia, tokens CSS reutilizáveis e os componentes base já implementados.

## Objetivo

Garantir que toda tela nova do frontend (Totem, Caixa, Cozinha, Admin) siga o **mesmo** vocabulário visual, sem cada desenvolvedor (ou IA) reinventar cores, espaçamentos ou tipografia tela a tela. Antes desta task, `global.css` tinha uma paleta genérica de placeholder (cinza/vermelho simples) criada no setup inicial (TASK-028/029) — este documento e os tokens que o acompanham substituem esse placeholder pela identidade visual definitiva do produto.

## Os dois temas

| | Modo escuro | Modo claro |
|---|---|---|
| Nome | Dark & Bold | Clean & Warm |
| Fonte de título | Oswald | Sora |
| Fonte de corpo | DM Sans | Plus Jakarta Sans |
| Cor primária | Vermelho `#E63329` | Laranja `#E8440A` |
| Uso recomendado | Padrão do sistema — telas operacionais (Totem, Caixa, Cozinha) tendem a ficar em ambientes com luz variável; alto contraste favorece leitura rápida | Alternativa para ambientes muito claros ou preferência do operador/administrador |

Tema padrão da aplicação: **dark**. O usuário troca a qualquer momento pelo ícone 💡 (`ThemeToggle`) presente em todo `ModuleHeader`, e a escolha é lembrada entre sessões.

## Documentos

- [`cores.md`](./cores.md) — paleta completa de cada tema, variável por variável, com hex e propósito.
- [`tipografia.md`](./tipografia.md) — fontes, pesos, escala de tamanho, como carregar.
- [`temas.md`](./temas.md) — como o sistema de temas funciona tecnicamente (`ThemeContext`, `data-theme`, `localStorage`).
- [`componentes.md`](./componentes.md) — inventário dos componentes base (`Button`, `Input`, `ErrorMessage`, `ThemeToggle`, `AppLayout`, `ModuleHeader`).
- [`guia-uso-frontend.md`](./guia-uso-frontend.md) — passo a passo prático para construir uma tela nova seguindo o sistema, e o que evitar.

## Onde isso vive no código

```text
frontend/src/styles/
├── tokens.css   # forma/espaçamento/tipografia/movimento — iguais nos dois temas
└── themes.css   # cor e fonte — diferentes por tema (:root, [data-theme="dark"|"light"])

frontend/src/contexts/ThemeContext.tsx   # estado do tema + persistência
frontend/src/hooks/useTheme.ts           # hook de consumo
frontend/src/components/ui/ThemeToggle.tsx
```

## Escopo desta versão

Esta é a **base** do design system — cobre fundação (cores, tipografia, tokens) e os componentes que já existiam (`Button`, `Input`, `ErrorMessage`) mais o novo `ThemeToggle`. Não inclui: componentes de cardápio, carrinho, cards de pedido, tabelas administrativas, ou qualquer elemento específico de uma tela de negócio ainda não implementada — esses nascerão nas tasks correspondentes, reaproveitando os tokens aqui definidos.
