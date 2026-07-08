# Componentes base

Inventário dos componentes reutilizáveis existentes em `frontend/src/components/`. Todos consomem tokens/tema via CSS — nenhum tem cor hardcoded.

## Layout

### `AppLayout` (`components/layout/AppLayout.tsx`)

Casca compartilhada por toda página: `ModuleHeader` + área de conteúdo.

```tsx
<AppLayout title="Totem" description="Autoatendimento do cliente">
  {/* conteúdo da tela */}
</AppLayout>
```

Toda página em `src/pages/` deve ser envolvida por `AppLayout` — é o que garante o cabeçalho consistente (título + `ThemeToggle`) em todas as telas.

### `ModuleHeader` (`components/layout/ModuleHeader.tsx`)

Renderizado internamente pelo `AppLayout` — título, descrição opcional e o `ThemeToggle` alinhado à direita. Não é chamado diretamente pelas páginas.

## UI

### `Button` (`components/ui/Button.tsx`)

```tsx
<Button type="submit" loading={isLoading} disabled={condicao}>
  Ativar dispositivo
</Button>
```

- Props: todos os atributos nativos de `<button>` + `loading?: boolean`.
- Quando `loading`, o texto vira "Aguarde..." e o botão fica desabilitado automaticamente (não precisa passar `disabled` manualmente por causa do loading).
- Classe CSS aplicada: `ui-button` (regras em `global.css`). Aceita `className` extra se precisar de ajuste pontual, mas prefira estender o token/CSS antes de criar uma variante ad-hoc.
- Cor: `--color-primary` / hover `--color-primary-hover` / texto `--color-primary-contrast` — some automaticamente entre vermelho (dark) e laranja (light).

### `Input` (`components/ui/Input.tsx`)

```tsx
<Input
  id="codigoAtivacao"
  label="Código de ativação"
  value={valor}
  onChange={(e) => setValor(e.target.value)}
  placeholder="Ex.: 8f2c1a9b3d4e5f60"
/>
```

- Props: todos os atributos nativos de `<input>` + `label: string` (obrigatório, sempre renderiza um `<label htmlFor>` associado — acessibilidade).
- Classe CSS: `ui-input` (wrapper) — label + input estilizados via tema.

### `ErrorMessage` (`components/ui/ErrorMessage.tsx`)

```tsx
<ErrorMessage message={erro} />
```

- Retorna `null` se `message` for `null`/vazio — pode ser sempre renderizado no JSX sem `{erro && ...}` condicional na página.
- `role="alert"` para leitores de tela.
- Cor: `--color-error` (fixa, não muda por tema — ver `cores.md`).
- Não existe um `<SuccessMessage />` dedicado ainda — sucesso simples usa a classe utilitária `.ui-success-message` diretamente (ver `AtivarDispositivoPage.tsx`). Se um segundo caso de uso aparecer, vale extrair um componente análogo ao `ErrorMessage`.

### `ThemeToggle` (`components/ui/ThemeToggle.tsx`)

```tsx
<ThemeToggle />
```

- Sem props — lê o tema via `useTheme()`.
- Ícone: emoji 💡 (sem biblioteca de ícones instalada).
- `aria-label` dinâmico: "Alternar para modo claro" ou "Alternar para modo escuro", conforme o tema atual.
- Já incluso automaticamente em todo `ModuleHeader` — não precisa ser adicionado manualmente em cada página.

## Convenções gerais

- Todo componente de UI usa `className`/nome de classe CSS previsível prefixado `ui-*` (exceto os de layout, prefixados `module-header*`/`app-layout*`).
- Estilo vive em `global.css`, não em CSS-in-JS nem em `style={{}}` inline — mais fácil de auditar contra os tokens.
- Nenhum componente aqui decide cor "na mão" — tudo via `var(--color-*)`/`var(--font-*)`.

## Próximos componentes prováveis (não implementados ainda)

Conforme as telas reais forem construídas, espera-se a necessidade de: `Card` (produto/pedido), `Badge`/`StatusPill` (status do pedido — provavelmente reaproveitando `--color-success`/`--color-error` e novos tokens semânticos), `SelectField`, `Modal` de confirmação. Ao criar esses componentes, siga o mesmo padrão: props tipadas, classe `ui-*`, zero cor hardcoded, e adicione uma entrada aqui.
