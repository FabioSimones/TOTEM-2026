# Sistema de temas

Como o dark/light funciona tecnicamente no frontend.

## Mecanismo

O tema é aplicado via atributo `data-theme` no elemento `<html>` (`document.documentElement`), consumido pelo CSS em `themes.css`:

```css
:root,
[data-theme="dark"] { /* ...variáveis dark... */ }
[data-theme="light"] { /* ...variáveis light... */ }
```

`:root` já define o tema dark por padrão — isso garante que, mesmo antes de qualquer JavaScript rodar, a página não fica sem estilo algum (fallback seguro).

## Componentes envolvidos

| Arquivo | Responsabilidade |
|---|---|
| `src/contexts/ThemeContext.tsx` | Estado `theme` (`"dark" \| "light"`), função `toggleTheme`, efeito colateral que aplica `data-theme` no `<html>`, persiste no `localStorage` e atualiza a meta tag `theme-color` |
| `src/hooks/useTheme.ts` | Hook `useTheme()` que expõe `{ theme, toggleTheme }` a qualquer componente dentro do `ThemeProvider` |
| `src/components/ui/ThemeToggle.tsx` | Botão 💡 que chama `toggleTheme()` |
| `src/app/App.tsx` | Envolve toda a árvore com `<ThemeProvider>` |
| `index.html` (script inline) | Aplica `data-theme` **antes** do React montar, lendo o mesmo `localStorage` |

## Persistência

Chave de `localStorage`: **`totem.theme`**, valor `"dark"` ou `"light"`.

Essa chave é deliberadamente separada de `totem.accessToken`/`totem.dispositivo` (geridas por `tokenStorage.ts`) — tema é preferência de interface, não dado de sessão/autenticação. Trocar de tema não afeta login/ativação de dispositivo, e limpar a sessão (logout futuro) não deve apagar a preferência de tema do usuário.

## Por que um script inline no `index.html`?

Sem ele, a sequência seria:

1. HTML carrega, `<html>` não tem `data-theme` → CSS aplica o fallback do `:root` (dark).
2. React monta, `ThemeProvider` lê o `localStorage`, descobre que é `"light"`, aplica `data-theme="light"`.
3. Tela "pisca" de dark para light por uma fração de segundo.

O script inline roda de forma síncrona antes da primeira renderização visual, lendo o mesmo `localStorage` e aplicando o atributo correto imediatamente — eliminando o flash. **Se a chave `totem.theme` mudar de nome em `ThemeContext.tsx`, o script em `index.html` precisa ser atualizado junto** (são duas cópias da mesma constante, por necessidade técnica — o script roda antes de qualquer módulo JS ser carregado).

## Tema padrão

`dark` — decisão do produto (ver TASK-030). Se `localStorage` não tem `totem.theme` ou tem um valor inesperado, o fallback é sempre `dark`.

## Meta `theme-color`

A tag `<meta name="theme-color">` (cor da barra do navegador/PWA) é atualizada dinamicamente pelo `ThemeContext` para acompanhar a cor primária do tema ativo (`#E63329` no dark, `#E8440A` no light) — mantém a UI do sistema operacional consistente com o app.

## Como consumir em um componente novo

```tsx
import { useTheme } from "../hooks/useTheme";

function MeuComponente() {
  const { theme, toggleTheme } = useTheme();
  // theme === "dark" | "light"
}
```

Raramente um componente precisa *ramificar* comportamento por `theme` — na grande maioria dos casos, basta usar as variáveis CSS (`var(--color-primary)` etc.) e o componente já se adapta automaticamente ao tema ativo sem nenhuma lógica JS. Só use `useTheme()` diretamente quando precisar decidir algo em JavaScript (como o `ThemeToggle` decide o `aria-label`).

## O que evitar

- Não ler `localStorage.getItem("totem.theme")` fora de `ThemeContext.tsx`/`index.html` — se precisar do tema atual em outro lugar, use `useTheme()`.
- Não adicionar um terceiro tema sem atualizar `Theme` (tipo TypeScript), `themes.css`, o script inline e este documento.
- Não aplicar `data-theme` em qualquer elemento além de `document.documentElement` — os seletores CSS assumem que é sempre o `<html>`.
