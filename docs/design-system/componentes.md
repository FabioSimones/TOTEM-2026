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

Prop `centralizado?: boolean` (TASK-110/111/112): centraliza o conteúdo horizontal e verticalmente (`display:flex; align-items:center; justify-content:center` em `.app-layout__content`) — usado pelas telas de login administrativo e pelos estados de "sem dispositivo"/"sem operador" de Caixa/Cozinha.

### `ModuleHeader` (`components/layout/ModuleHeader.tsx`)

Renderizado internamente pelo `AppLayout` — título, descrição opcional e o `ThemeToggle` alinhado à direita. Não é chamado diretamente pelas páginas. Este é o "cabeçalho de página" padrão do projeto — não existe (nem é necessário) um `AdminPageHeader` separado, já que toda tela já passa por aqui.

### `AuthSplitLayout` / `LoginBrandPanel` / `FoodIcons` (`components/auth/`, TASK-117)

Casca de duas colunas usada **só** em `/login` — não passa por `AppLayout`/`ModuleHeader` (o cabeçalho padrão, em barra horizontal, não comporta o painel institucional lado a lado). Estrutura:

```tsx
<AuthSplitLayout>
  {/* conteúdo do formulário — h1, inputs, botão, links secundários */}
</AuthSplitLayout>
```

- `AuthSplitLayout`: grid de 2 colunas (`.auth-split`) a partir de 960px; em telas estreitas, empilha em coluna única com `flex-direction: column-reverse`, então o formulário (segundo filho no DOM) aparece visualmente primeiro, sem esconder a marca por completo. Reposiciona o `ThemeToggle` (mesmo componente, mesma classe `.theme-toggle`) para o canto do painel do formulário, em vez da barra padrão do `ModuleHeader`.
- `LoginBrandPanel`: marca "TotemFood", `FoodIcons`, título/descrição institucionais e uma lista curta de recursos reais do sistema (nunca promete algo que não existe — ver `docs/status-mvp.md`). É o único lugar do app com um painel sempre escuro nos dois temas (`--color-auth-brand-*`, ver `cores.md`) — identidade de marca fixa, não segue o tema geral.
- `FoodIcons`: três SVGs inline (hambúrguer, batata, bebida) — os primeiros SVGs do projeto (ver seção "Ícones" abaixo). Decorativos: `aria-hidden="true"` e `focusable="false"` em cada `<svg>`, nunca recebem foco por Tab. Flutuação sutil só com `transform`/`opacity` (`.food-icons__item*` em `global.css`), herdando a regra global de `prefers-reduced-motion` sem lógica JS própria — as keyframes sempre voltam ao estado neutro (`translateY(0) rotate(0)`) para não deixar o ícone "torto" quando a animação é reduzida a 0.01ms.

## UI

### `Button` (`components/ui/Button.tsx`)

```tsx
<Button type="submit" loading={salvando}>Salvar</Button>
<Button type="button" variant="secondary" onClick={onCancelar}>Cancelar</Button>
<Button type="button" variant="danger" fullWidth onClick={onLimpar}>Limpar carrinho</Button>
```

- Props: todos os atributos nativos de `<button>` + `loading?: boolean`, `variant?: "primary" | "secondary" | "danger"` (TASK-114), `fullWidth?: boolean` (TASK-114).
- `variant="primary"` (padrão): preenchido, `--color-primary-button` (TASK-113 — não é `--color-primary`, ver `cores.md`). Use para a ação principal de uma tela/formulário (salvar, confirmar, criar pedido).
- `variant="secondary"`: fantasma (fundo transparente, borda `--color-border`), hover para `--color-primary`. Use para ações neutras/reversíveis (cancelar edição, trocar operador/dispositivo, alternar disponibilidade).
- `variant="danger"`: fantasma, hover para `--color-error`. Use para ações destrutivas ou que encerram algo (cancelar pedido, limpar carrinho). **Não** é usado para "Desativar"/"Revogar" administrativos — esses permanecem `secondary`, seguindo o padrão visual já estabelecido nos cards (a cor não muda conforme a ação, só o rótulo).
- `fullWidth`: `width: 100%` — substitui os antigos `.cart-summary__finalizar`/`className` ad-hoc.
- Quando `loading`, o texto vira "Aguarde...", o botão fica desabilitado automaticamente (não precisa passar `disabled` manualmente por causa do loading) e ganha `aria-busy="true"` (TASK-114).
- Classes CSS: `ui-button` (base) + `ui-button--secondary`/`ui-button--danger`/`ui-button--full` conforme as props. Aceita `className` extra (ex.: `pedido-pendente-card__acao`, um ajuste pontual de `flex`) — mas **nunca** recrie a receita de cor/borda de uma variante fantasma numa classe nova; use `variant`.
- **Botões apenas com ícone** (fechar modal, alternar tema, +/− de quantidade) **não** usam `Button` — são `<button>` cru com classe própria, porque têm formato circular fixo (não crescem com o texto) e nunca mostram texto de loading. Ver "Botões só-ícone" abaixo.

### `Input` (`components/ui/Input.tsx`)

```tsx
<Input
  id="codigoAtivacao"
  ref={codigoRef}
  label="Código de ativação"
  value={valor}
  onChange={(e) => setValor(e.target.value)}
  placeholder="Ex.: 8f2c1a9b3d4e5f60"
  error={erros.codigo}
  helpText="Texto de apoio opcional"
/>
```

- Props: todos os atributos nativos de `<input>` + `label: string` (obrigatório, sempre renderiza um `<label htmlFor>` associado — acessibilidade) + `error?: string | null` e `helpText?: string` (TASK-115).
- `forwardRef` (TASK-115): expõe o `<input>` interno via `ref`, necessário para mover o foco programaticamente para o primeiro campo inválido após um submit falho (ver `focarPrimeiroErro`, abaixo).
- Quando `error` está presente: aplica `aria-invalid="true"`, `aria-describedby` (combinando o id do help text com o do erro, nessa ordem), a classe `ui-field--invalid` no wrapper (borda `--color-error` em input/select/textarea) e renderiza um `FieldError` logo abaixo do campo.
- Classe CSS: `ui-input` (wrapper) — label + input estilizados via tema. Foco visível vem da regra global `:focus-visible` (TASK-113), não de CSS próprio do `Input`.

### `FieldError` (`components/ui/FieldError.tsx`, TASK-115)

```tsx
<FieldError id="cnpjRestaurante-error" message={erros.cnpj} />
```

- Retorna `null` quando `message` é `null`/vazio — pode ser sempre renderizado no JSX (mesma convenção do `ErrorMessage`).
- `aria-live="polite"` (não `role="alert"`): erros de campo não devem interromper o leitor de tela como um alerta — isso é reservado à mensagem global/de API (`ErrorMessage`, `role="alert"`). Com vários campos inválidos ao mesmo tempo, várias mensagens `role="alert"` disparariam simultaneamente e atropelariam a leitura.
- Classe CSS: `ui-field__error` (cor `--color-error`, mesmo padrão de `ui-field__help`).
- Usado diretamente pelo `Input` (internamente) e também por campos "customizados" que não são um `<input>` nativo — grupos de botões (restaurante/categoria/tipo/perfil), onde o grupo vira um `role="group"` com `aria-label` e `aria-describedby` apontando para o `FieldError` renderizado logo após o grupo.

### `ErrorMessage` (`components/ui/ErrorMessage.tsx`)

```tsx
<ErrorMessage message={erro} />
```

- Retorna `null` se `message` for `null`/vazio — pode ser sempre renderizado no JSX sem `{erro && ...}` condicional na página.
- `role="alert"` para leitores de tela.
- Cor: `--color-error` (fixa, não muda por tema — ver `cores.md`).
- Não existe um `<SuccessMessage />` dedicado ainda — sucesso simples usa a classe utilitária `.ui-success-message` diretamente (ver `AtivarDispositivoPage.tsx`). Se um segundo caso de uso aparecer, vale extrair um componente análogo ao `ErrorMessage`.
- **Uso restrito a partir da TASK-115**: exclusivamente para falha inesperada, erro de comunicação/API, erro de API sem campo reconhecido, ou regra de negócio que não pertence a um único campo. Erros de validação local por campo usam `FieldError`, não `ErrorMessage` — ver "Validação inline nos formulários administrativos" abaixo.

### Validação inline nos formulários administrativos (TASK-115)

Padrão adotado nos 5 formulários administrativos (Restaurante/Dispositivo/Categoria/Produto/Usuário — `components/admin/*/*.Form.tsx`):

- **Estado de erros por campo**: `type CampoX = "campoA" | "campoB" | ...` (união literal, específica de cada formulário — não uma abstração genérica que esconderia as regras) + `useState<Partial<Record<CampoX, string>>>({})`.
- **`validar()`**: função que checa **todos** os campos do formulário e retorna o objeto de erros completo — nunca para no primeiro erro encontrado (`handleSubmit` não usa mais `return` a cada `if`).
- **`revalidarSeNecessario(campo)`**: só reavalia um campo específico quando ele **já** está marcado como inválido — evita validar a cada tecla digitada antes da primeira tentativa de envio, mas corrige o erro assim que o usuário resolve o problema.
- **`focarPrimeiroErro` (`utils/validacaoFormulario.ts`)**: helper genérico `<TCampo extends string>(ordem, erros, refs)` que percorre `ordem` e move o foco (com `scrollIntoView` respeitando `prefers-reduced-motion`) para o primeiro campo com erro que tenha uma `ref` correspondente. Usa só `RefObject`s explícitos do próprio formulário — nunca `document.querySelector` global, que seria inseguro com vários modais na página.
- **Campos "customizados" (grupos de botão)**: restaurante/categoria/tipo/perfil não são `<input>`s nativos. Usam um `<div ref={grupoRef} tabIndex={-1} role="group" aria-label="..." aria-describedby={erro ? "campo-error" : undefined}>` em volta dos botões, com um `FieldError` logo depois — assim `focarPrimeiroErro` também funciona para eles (o `tabIndex={-1}` torna o `<div>` programaticamente focável).
- **Erros de campo vindos da API (`errosCampoApi`)**: o backend retorna `ApiErrorResponse.errors: [{campo, mensagem}]` em toda validação `@Valid` rejeitada, com `campo` batendo 1:1 com os nomes dos campos dos `Request` TypeScript. `utils/apiFieldErrors.ts#extrairErrosCampoApi(error, camposConhecidos)` extrai só os campos reconhecidos (sem adivinhação textual) — a página (`AdminXPage.tsx`) chama isso no `catch` do `status === 400` e decide: se algum campo foi reconhecido, define `errosCampoApi` (erro aparece inline); senão, mantém o comportamento anterior de mensagem global (`ErrorMessage`).
- **`noValidate`** em todo `<form>` — evita que a validação nativa do navegador (`type="email"`, `min`/`step`) conflite visualmente com os erros customizados.
- **Ciclo de vida dos erros**: `erros` e `errosCampoApi` são limpos ao abrir para criar, abrir para editar, cancelar/fechar o modal e após sucesso — nunca há mensagem residual ao reabrir o formulário.

### `Modal` (`components/ui/Modal.tsx`, TASK-110)

```tsx
<Modal aberto={modalAberto} titulo="Cadastrar restaurante" onFechar={fecharModal} tamanho="grande">
  <RestauranteForm ... />
</Modal>
```

- Props: `aberto`, `titulo`, `children`, `onFechar`, `fecharAoClicarBackdrop?` (padrão `false` — evita perda acidental de dados em formulário), `tamanho?: "pequeno" | "medio" | "grande"` (padrão `"medio"`; `"grande"` é usado só pelo formulário de Produtos, por causa do upload de imagem).
- Acessível: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` no título, fecha por `Escape`, focus trap básico (`Tab`/`Shift+Tab`), devolve o foco ao elemento que abriu ao fechar, bloqueia scroll de fundo.
- Botão de fechar (`×`) é um dos "botões só-ícone" padronizados — ver abaixo.
- Reaproveitado por todas as 5 páginas de CRUD administrativo (Restaurantes/Dispositivos/Categorias/Produtos/Usuários) para criar/editar — nunca crie um segundo componente de modal.

### `ThemeToggle` (`components/ui/ThemeToggle.tsx`)

```tsx
<ThemeToggle />
```

- Sem props — lê o tema via `useTheme()`.
- Ícone: emoji 💡 (sem biblioteca de ícones instalada — ver "Ícones" abaixo).
- `aria-label` dinâmico: "Alternar para modo claro" ou "Alternar para modo escuro", conforme o tema atual; o emoji tem `aria-hidden="true"` (o rótulo acessível vem só do `aria-label`).
- Já incluso automaticamente em todo `ModuleHeader` — não precisa ser adicionado manualmente em cada página.

## Botões só-ícone (TASK-113/114)

Três botões circulares, sem texto visível: `ThemeToggle` (💡), `.ui-modal__fechar` (×, dentro de `Modal`) e `.cart-item-row__qtd-botao` (+/−, no carrinho do Totem). Todos seguem a mesma receita:

- `min-width`/`min-height: 2.75rem` (44px) — nunca `width`/`height` fixo, para não perder flexibilidade.
- `border-radius: var(--radius-full)` (círculo).
- `font-size: var(--icon-size-md)` (1.25rem/20px — token novo da TASK-114, ver `tokens.css`).
- `aria-label` **no `<button>`**, nunca no glifo.
- O glifo/emoji em si (`×`, `+`, `−`, 💡) fica dentro de um `<span aria-hidden="true">` — redundante para leitor de tela, que já anuncia o `aria-label`.
- `title` (tooltip nativo) só complementa o `aria-label` (`ThemeToggle`), nunca o substitui.

Não existe (e não foi criado nesta task) um componente `IconButton` genérico — os três casos têm cores/hover diferentes o suficiente (surface-elevated com borda vs. sem fundo, hover para primary vs. error) para não valer a pena forçar uma abstração única ainda; se um quarto caso aparecer com a mesma combinação exata de cores, vale reconsiderar.

## Ícones (TASK-114/117)

Até a TASK-116, todo "ícone" era um glifo Unicode (`×`, `+`, `−`) ou um emoji (💡) — sem nenhum SVG no projeto. A TASK-117 introduziu os **três primeiros SVGs** (`components/auth/FoodIcons.tsx`, hambúrguer/batata/bebida do painel institucional do login): geometria própria simples, `currentColor`, decorativos (`aria-hidden`/`focusable="false"`, nunca focáveis). Ainda não há biblioteca de ícones instalada nem `components/ui/icons/` — três símbolos continuam não justificando isso; se um quarto uso real de SVG aparecer fora do contexto decorativo do login, vale reconsiderar.

Tokens de tamanho (`tokens.css`):

| Token | Valor | Uso |
|---|---|---|
| `--icon-size-sm` | 1rem (16px) | reservado — nenhum uso real ainda |
| `--icon-size-md` | 1.25rem (20px) | os 3 botões só-ícone (ver acima) |
| `--icon-size-lg` | 1.5rem (24px) | reservado — nenhum uso real ainda |

`FoodIcons` não usa esses tokens (tamanho fixo em `width`/`height` no próprio SVG, por serem ilustrativos, não botões) — se um futuro SVG funcional (ex.: ícone de navegação dentro de um botão) for adicionado, prefira `currentColor` + os tokens acima antes de considerar uma biblioteca externa.

## Badges / indicadores de status (TASK-114)

Não existe um componente `<Badge>` React — o padrão é uma classe base + modificadores de cor, já usado por `.dispositivo-card__status` (Restaurantes/Dispositivos/Categorias/Usuários: `--ativo`, `--revogado`, `--usado-recentemente`, `--nunca-usado`) e `.pedido-pendente-card__status` (Caixa/Cozinha, sempre `--color-primary`, sem variantes — reaproveita a mesma base estrutural desde a TASK-114, só define sua própria cor).

```tsx
<span className="dispositivo-card__status dispositivo-card__status--ativo">Ativo</span>
```

Requisitos que já são seguidos e devem continuar sendo:
- **Texto sempre presente** — nunca depender só de cor (ex.: "Ativo"/"Revogado"/"Usado recentemente", não só uma bolinha colorida).
- Base compartilhada: `padding: var(--spacing-xs) var(--spacing-sm)`, `border-radius: var(--radius-full)`, `font-size: var(--font-size-sm)`, `font-weight: var(--font-weight-semibold)`.
- Cor sempre com contraste verificado (ver `cores.md`).

Um componente `<Badge variant="...">` React só vale a pena se um sexto/sétimo caso de uso aparecer com a mesma lógica de variantes — hoje a duplicação real já foi resolvida via CSS (ver `cores.md`), sem precisar de um componente novo.

## Cards (TASK-114)

Todos os cards administrativos (`RestauranteCard`, `DispositivoCard`, `ProdutoCard`, `CategoriaCard`, `UsuarioCard`) e os cards operacionais do Caixa/Cozinha (`PedidoPendenteCard`, `PedidoCozinhaCard`) já compartilham a **mesma classe raiz**, `.pedido-pendente-card` (nome herdado do Caixa, reaproveitado como card genérico — não foi renomeado nesta task para evitar uma alteração de puro nome em ~7 arquivos sem ganho funcional):

```tsx
<article className="pedido-pendente-card">
  <div className="pedido-pendente-card__cabecalho">{/* título + badge de status */}</div>
  <dl className="pedido-pendente-card__detalhes">{/* metadados */}</dl>
  <div className="dispositivo-form__acoes">{/* ações — ver abaixo */}</div>
</article>
```

Isso já cobre padding, radius, borda e sombra (`--radius-lg`, `--color-border`, `--shadow-card`) de forma consistente — não há necessidade de variantes `elevated`/`interactive`/`warning` hoje; nenhuma tela pediu isso ainda.

## Grupo de ações (TASK-114)

`.dispositivo-form__acoes` é o padrão de grupo de ações do projeto (`display: flex; flex-wrap: wrap; gap: var(--spacing-sm)`), usado em todo formulário e card administrativo. Não existe uma classe `.ui-actions` separada — `.dispositivo-form__acoes` já cumpre esse papel; renomear só por consistência de nome não foi feito nesta task (alto número de arquivos tocados, zero ganho visual/funcional).

- Botões dentro de `.dispositivo-form__acoes` recebem `flex: 1; min-width: 10rem` via `.dispositivo-form__acoes .ui-button` — cresce para preencher a linha, quebra em telas estreitas (`flex-wrap`) sem gerar scroll horizontal (verificado por Playwright na TASK-114).
- A ação principal é sempre o primeiro `Button` (`variant="primary"`, implícito); ações secundárias vêm depois, com `variant="secondary"`/`"danger"`.

## Estados vazios e carregamento

- Vazio: `<p className="totem-estado">Nenhum restaurante cadastrado.</p>` — mesma classe em toda página (`totem-estado`), sem ícone/ilustração (fora do escopo). Mensagem descreve o que falta; a ação de criar já está sempre visível no cabeçalho ("Novo restaurante" etc.), então não repete um botão dentro do estado vazio.
- Carregamento: `<p className="totem-estado">Carregando restaurantes...</p>` (texto simples, sem spinner animado) ou `Button` com `loading` (texto "Aguarde...", `aria-busy`, desabilitado). Nenhum spinner CSS existe hoje — se um for adicionado no futuro, deve respeitar `@media (prefers-reduced-motion: reduce)` (TASK-113).

## Convenções gerais

- Todo componente de UI usa `className`/nome de classe CSS previsível prefixado `ui-*` (exceto os de layout, prefixados `module-header*`/`app-layout*`, e os específicos de domínio como `pedido-pendente-card*`/`dispositivo-card*`).
- Estilo vive em `global.css`, não em CSS-in-JS nem em `style={{}}` inline — mais fácil de auditar contra os tokens.
- Nenhum componente aqui decide cor "na mão" — tudo via `var(--color-*)`/`var(--font-*)`.
- Antes de criar uma nova classe CSS para um botão/badge/card, procure se a variante já existe em `Button`/`.dispositivo-card__status`/`.pedido-pendente-card` — a TASK-114 consolidou 4 classes de botão duplicadas e 1 de badge nesse sentido.

## Próximos componentes prováveis (não implementados ainda)

`SelectField` (nenhuma tela usa `<select>` nativo estilizado hoje — os formulários usam grupos de botão tipo/toggle em vez de `<select>`), `IconButton` genérico (só vale a pena com um 4º caso real, ver acima), `<Badge>` React (só vale a pena com mais variantes reais, ver acima). Validação inline por campo nos formulários fica para task futura — ver `docs/roadmap-pos-mvp.md`.
