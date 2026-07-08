# Guia de uso — como construir uma tela nova

Passo a passo prático para implementar uma tela seguindo o design system, usando como exemplo real `AtivarDispositivoPage.tsx` (única tela com lógica de negócio até a TASK-030).

## 1. Estrutura mínima de uma página

```tsx
import { AppLayout } from "../components/layout/AppLayout";

export function MinhaTelaPage() {
  return (
    <AppLayout title="Título da tela" description="Uma frase explicando o que a tela faz.">
      {/* conteúdo */}
    </AppLayout>
  );
}
```

`AppLayout` já traz o `ModuleHeader` (com `ThemeToggle`) — não recrie um cabeçalho manualmente.

## 2. Formulários

Use `Input` + `Button` + `ErrorMessage` do design system, não `<input>`/`<button>` nativos direto na página:

```tsx
<form onSubmit={handleSubmit} className="minha-tela-form">
  <Input id="campo" label="Rótulo do campo" value={valor} onChange={...} />
  <ErrorMessage message={erro} />
  <Button type="submit" loading={loading}>Confirmar</Button>
</form>
```

Se o formulário precisar de um "card" visual (fundo, borda, sombra), veja `.ativar-dispositivo-form` em `global.css` como referência — mas dê à sua tela uma classe própria (`.minha-tela-form`), não reaproveite a classe de outra tela.

## 3. Chamadas HTTP

Nunca chame `fetch` ou `api.ts` diretamente da página. Crie/reaproveite um `*Service.ts` em `src/services/`:

```ts
// src/services/meuModuloService.ts
import { api } from "./api";
import type { MeuTipoResponse } from "../types/meuModulo";

export function buscarAlgo(): Promise<MeuTipoResponse> {
  return api.get<MeuTipoResponse>("/api/meu-endpoint");
}
```

A página importa a função do service, não `api` diretamente (mantém a página livre de detalhes de HTTP/URL/headers).

## 4. Cores, espaçamento e tipografia

- **Nunca** um hex novo em CSS/inline (`style={{ color: "#fff" }}`). Sempre `var(--color-*)`.
- Espaçamento: `var(--spacing-sm|md|lg|xl)`, nunca `px`/`rem` soltos repetidos.
- Border-radius: `var(--radius-sm|md|lg|full)`.
- Título → `var(--font-heading)` (herda automaticamente em `h1`–`h6`, não precisa declarar). Corpo/label/botão → `var(--font-body)` (herda do `body`, só declare explicitamente se o elemento não herdar naturalmente, ex.: dentro de um `input`).
- Se o valor que você precisa não existe em `tokens.css`/`themes.css`, **adicione o token lá** em vez de usar um valor solto na página — mantém a fonte única da verdade.

## 5. Loading, erro e sucesso

Toda tela que faz uma chamada assíncrona deve tratar os três estados (regra da skill `frontend-pwa.md`):

```tsx
const [loading, setLoading] = useState(false);
const [erro, setErro] = useState<string | null>(null);

async function acao() {
  setErro(null);
  setLoading(true);
  try {
    await meuServico.fazerAlgo();
    // sucesso: atualizar estado, navegar, etc.
  } catch (error) {
    setErro(error instanceof ApiError ? error.message : "Mensagem genérica amigável.");
  } finally {
    setLoading(false);
  }
}
```

`Button` já reflete `loading` visualmente (texto "Aguarde...", desabilitado). `ErrorMessage` já trata `null` (renderiza nada).

## 6. Tema

Na grande maioria dos casos você **não precisa pensar em tema** — se usou `var(--color-*)`/`var(--font-*)` em vez de hex fixo, a tela já responde a dark/light automaticamente. Só use `useTheme()` diretamente se precisar de uma decisão em JavaScript (ex.: escolher entre dois assets de imagem diferentes por tema — não há caso assim ainda no projeto).

## Checklist antes de considerar a tela pronta

- [ ] Envolvida por `AppLayout` com `title`/`description`.
- [ ] Nenhuma cor hex nova fora de `themes.css`/`tokens.css`.
- [ ] Nenhuma chamada HTTP direta — passa por um `*Service.ts`.
- [ ] Loading, erro e sucesso tratados (quando há operação assíncrona).
- [ ] Testada nos dois temas (alternando pelo 💡) sem contraste quebrado.
- [ ] `npm run build` sem erro de TypeScript.

## O que evitar

- Instalar uma UI library (Material UI, Chakra, Ant Design) — o design system deste projeto é intencionalmente CSS puro + tokens.
- Instalar biblioteca de ícones — use emoji ou SVG inline simples até haver justificativa forte para uma dependência.
- CSS-in-JS (styled-components, emotion) — as regras vivem em `global.css`.
- Duplicar uma classe CSS existente com nome ligeiramente diferente só para uma tela — prefira generalizar a classe existente ou criar um token novo.
