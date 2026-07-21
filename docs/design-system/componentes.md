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

Toda página em `src/pages/` que **não** pertence a `/login` nem a `/admin/*` deve ser envolvida por `AppLayout` — é o que garante o cabeçalho consistente (título + `ThemeToggle`) nessas telas. Três exceções deliberadas, cada uma com sua própria casca (ver abaixo): `/login` usa `AuthSplitLayout` (TASK-117), `/admin/*` usa `AdminLayout` (TASK-118), e `/caixa`/`/cozinha` usam `OperationalLayout` (TASK-119) **só depois** que dispositivo e operador já estão prontos — nos três casos, o cabeçalho horizontal simples do `ModuleHeader` não comporta o layout necessário (painel institucional lado a lado / sidebar persistente / identidade de dispositivo+operador sempre visível). `/caixa`/`/cozinha` continuam usando `AppLayout centralizado` para os estados anteriores a isso (sem dispositivo, dispositivo incompatível, sem operador) — só o estado "pronto para operar" ganhou casca própria.

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

### `AdminLayout` / `AdminSidebar` / `AdminTopbar` (`components/layout/`, TASK-118)

Casca do painel administrativo — montada **uma única vez** pela rota pai `/admin` em `AppRoutes.tsx` (rotas aninhadas com `<Outlet/>`), não por cada página. As 7 páginas `/admin/*` não têm mais cabeçalho próprio nem `AppLayout`: só retornam seu conteúdo (toolbar, filtros, lista, modal).

```tsx
<Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
  <Route index element={<AdminDashboardPage />} />
  <Route path="produtos" element={<AdminProdutosPage />} />
  {/* ... */}
</Route>
```

- **`AdminLayout`**: dono do estado (sidebar recolhida/expandida, persistido; drawer mobile, transitório), do `logout()` (via `useAuth()`, navega para `/login`) e do efeito de `Escape`/bloqueio de scroll/retorno de foco do drawer mobile. Estrutura: `<div class="admin-layout">` com `AdminSidebar` + `<div class="admin-layout__main">` (`AdminTopbar` + `<main><Outlet/></main>`).
- **`AdminSidebar`**: navegação principal do Admin — marca "TotemFood" (com botão de recolher ao lado, TASK-118), lista de `NavLink` (um por item de `ADMIN_NAV_ITEMS`, ver `components/layout/adminNav.ts`) filtrada por perfil (`itensVisiveisParaPerfil`), e o backdrop mobile. **A visibilidade de um link aqui é só UX** — a rota continua protegida por `ProtectedRoute`/`RoleGuard` independente do que aparece na sidebar (ver auditoria da task: link oculto nunca substitui autorização; testado explicitamente em `AppRoutes.test.tsx` e `e2e/admin-layout.spec.ts`).
- **`AdminTopbar`**: único responsável pelo `h1`/descrição de cada tela `/admin/*` — resolve o item atual por `useLocation()` + `encontrarItemPorRota` (mesma fonte `ADMIN_NAV_ITEMS`), evitando duplicar título em cada página. Também mostra: botão hambúrguer (só visível `<960px`, `aria-expanded`/`aria-controls` apontando para a sidebar), `ThemeToggle` (mesmo componente, reposicionado — nunca duplicado), identificação do usuário (avatar com a inicial do nome, nome, perfil amigável via `ROTULO_PERFIL` — nunca o nome técnico do perfil como `SUPER_ADMIN`) e o botão "Sair" (chama `AuthProvider.logout()` + navega para `/login`; em telas `<960px` o rótulo de texto fica oculto por CSS, com `aria-label="Sair"` explícito no `<button>` para preservar o nome acessível).
- **`adminNav.ts`** (`components/layout/adminNav.ts`): fonte única (`ADMIN_NAV_ITEMS`) usada por `AdminSidebar` (itens + visibilidade) e `AdminTopbar` (título/descrição por rota) — evita duplicar essa informação em dois lugares. Cada item define `roles: PerfilUsuario[]`, replicando exatamente o `allowedRoles` do `RoleGuard` da mesma rota (ex.: `/admin/restaurantes` só `SUPER_ADMIN`) — nunca uma regra nova, só espelha a que já existe.
- **Sidebar expandida/recolhida** (`--admin-sidebar-width: 16rem` / `--admin-sidebar-collapsed-width: 4.75rem`, `tokens.css`): recolhida, os ícones ficam centralizados e o texto do link vira visualmente oculto (técnica "clip", nunca `display:none`) — o nome acessível do link continua vindo do texto real (mais `title`/`aria-label` redundantes), não desaparece da árvore de acessibilidade. Preferência persistida em `localStorage` (`totem.admin.sidebarCollapsed`, hook `useAdminSidebarCollapsed` em `hooks/`) — chave própria, nunca lida por `tokenStorage.ts`, valor inválido cai no padrão seguro (expandida), falha de `localStorage` não quebra a aplicação.
- **Drawer mobile** (`<960px`): sidebar fica `position:fixed`, fora da tela (`translateX(-100%)`) por padrão — **nunca inicia aberta nem persiste aberta** (diferente da preferência de recolher/expandir, que é só desktop). Abre com o botão hambúrguer da topbar; fecha por `Escape`, clique no backdrop, ou seleção de um item de navegação; devolve o foco ao botão hambúrguer ao fechar; bloqueia o scroll do conteúdo de fundo enquanto aberta. O botão de recolher/expandir fica oculto neste modo (achado da validação visual manual — ele não tem efeito visível no drawer, que sempre abre em largura total, e clicar nele alteraria sem querer a preferência persistida de desktop).
- **Cor do painel**: sidebar e o hero do dashboard (`AdminDashboardHero`, abaixo) reaproveitam os tokens de marca da TASK-117 (`--color-auth-brand-*`) em vez de criar uma paleta nova — mesma identidade visual do login nos dois temas. O painel de conteúdo (`.admin-layout__content`, ao lado da sidebar) usa `--color-surface` (não `--color-bg`) para manter contraste visível entre os dois painéis no tema dark (achado da validação visual manual — com `--color-bg` os dois ficavam quase indistinguíveis).

### `AdminDashboardHero` / `DashboardMetricCard` (TASK-118)

```tsx
<AdminDashboardHero nome={usuario.nome} descricao="..." />
<DashboardMetricCard icon={PedidoIcon} label="Total de pedidos hoje" value={5} />
```

- **`AdminDashboardHero`** (`components/admin/`): área de boas-vindas do dashboard fundido (`AdminDashboardPage`, ver "Métricas do dashboard" abaixo) — eyebrow "Painel administrativo", saudação com o nome do usuário autenticado, descrição contextual por perfil (texto vem da própria página, que já sabe se é `SUPER_ADMIN`/`ADMIN_RESTAURANTE`) e uma ilustração SVG decorativa própria (não reaproveita `FoodIcons` do login, para não duplicar a mesma composição visual) com flutuação sutil, `aria-hidden`, `focusable="false"`, respeitando `prefers-reduced-motion` do mesmo jeito que `FoodIcons`.
- **`DashboardMetricCard`** (`components/admin/`): card de indicador reutilizável — reaproveita as classes já existentes `dashboard-admin__card*` (TASK-074, antes só da extinta página "de métricas") em vez de criar uma variante nova. Props: `icon`, `label`, `value`, `loading?`, `error?` — quando `loading`, mostra "Carregando…"; quando `error`, mostra a mensagem de erro **só daquele card**, sem derrubar os demais nem a página (a falha de um indicador nunca vira um `0` disfarçado de dado real).

### `OperationalLayout` / `OperationalTopbar` (`components/layout/`, TASK-119, operador opcional desde a TASK-119.2)

Casca compartilhada por `/caixa` e `/cozinha` — montada assim que o **dispositivo** está pronto (compatível e autenticado), com ou sem operador identificado. Os estados anteriores a isso (sem dispositivo, dispositivo incompatível) continuam usando `AppLayout centralizado` + `DispositivoAcessoCard`, sem nenhuma mudança.

```tsx
<OperationalLayout
  modulo="Caixa"
  dispositivo={dispositivo}
  operador={operador}                                        {/* OperadorAutenticadoResponse | null */}
  onTrocarOperador={operador ? handleTrocarOperador : undefined}
  onTrocarDispositivo={handleTrocarDispositivo}
>
  {!operador ? (
    <OperadorPainel titulo="..." descricao="..." onIdentificado={...} />
  ) : (
    <>{/* cabeçalho contextual (h1 + descrição + contador) + lista de pedidos */}</>
  )}
</OperationalLayout>
```

- **`OperationalLayout`**: composição simples — `OperationalTopbar` + `<main className="operational-layout__content">{children}</main>`. Sem estado próprio (diferente do `AdminLayout`, que gerencia sidebar/drawer) — não há sidebar nem drawer aqui, só a topbar fixa no topo. `operador?: OperadorAutenticadoResponse | null` e `onTrocarOperador?: () => void` (TASK-119.2) — a topbar não desmonta durante a transição "sem operador" → "operador identificado", só o `children` decidido pela página muda.
- **`OperationalTopbar`**: reaproveita o vocabulário visual do `AdminTopbar` (TASK-118) — avatar textual com a inicial do operador, ações com `aria-label` explícito + texto ocultável em mobile — **sem reaproveitar o componente em si** (contexto diferente: dispositivo+operador, não usuário administrativo) e **sem `AdminSidebar`**, conforme exigido pela task. Sempre visíveis, nunca atrás de menu: módulo (Caixa/Cozinha, com ícone), nome e tipo do dispositivo (`rotuloTipoDispositivo`), `ThemeToggle`, "Trocar dispositivo". **Só com operador presente**: avatar + nome + perfil amigável via `ROTULO_PERFIL` (nunca o enum técnico como `OPERADOR_CAIXA`) e "Trocar operador" — cada ação com ícone próprio (`TrocarOperadorIcon`/`TrocarDispositivoIcon`, ver "Ícones" abaixo), nunca o mesmo, para continuarem distinguíveis mesmo quando só o ícone fica visível em mobile (achado real de QA da TASK-119). **Sem operador** (TASK-119.2): nenhum texto substituto tipo "Operador não identificado" é renderizado na topbar — seria redundante com o `<h1>` do formulário de login logo abaixo, que já comunica isso.
- **Trocar operador**: a página (`CaixaHomePage`/`CozinhaHomePage`) implementa `handleTrocarOperador` — limpa a sessão de operador (`clearOperadorSession`), zera a lista de pedidos e mensagens de erro/sucesso na tela, imediatamente. **Nunca** toca a sessão de dispositivo. Só passada à topbar quando há operador (`operador ? handleTrocarOperador : undefined`).
- **Trocar dispositivo**: continua sendo `useDispositivoOperacional().handleTrocarDispositivo` — `window.confirm`, limpa dispositivo **e** operador, navega para `/ativar-dispositivo`. Sempre disponível na topbar, com ou sem operador — não foi alterado, só reaproveitado.
- **Cabeçalho contextual** (dentro de `children`, só quando há operador): cada página renderiza seu próprio `<h1>`/descrição/contador dentro de `.operational-page-header` — "Pedidos pendentes" (Caixa) / "Fila de preparo" (Cozinha). O contador (`"3 pedidos pendentes"`/`"3 pedidos na fila"`) é derivado só do tamanho da lista já carregada (`pendencias.length`/`pedidos.length`) — nunca uma métrica agregada nova, nunca chamado de "faturamento" ou indicador administrativo.

### `TotemLayout` / `TotemSidebar` / `TotemTopbar` (`components/totem/`, TASK-120)

Casca própria da tela de autoatendimento (`/totem`) — sidebar de categorias + topbar, montada só no estado "cardápio com categorias" (as demais telas do fluxo — carregando, erro, resumo do pedido, pagamento, resultado — continuam em `AppLayout`, sem sidebar, já que navegação por categoria não se aplica nelas). Não reaproveita `AdminLayout`/`OperationalLayout` diretamente (o Totem é voltado ao cliente, não ao operador/administrador), mas segue a mesma arquitetura de colapso/drawer já validada em `AdminLayout`.

```tsx
<TotemLayout
  categorias={categorias}                      {/* CategoriaCardapioResponse[], vindas do backend */}
  categoriaSelecionada={categoriaSelecionada}   {/* number | "todas" (TOTEM_TODAS_CATEGORIAS) */}
  onSelectCategoria={setCategoriaSelecionada}
  titulo={tituloTopbar}
  descricao={descricaoTopbar}
  busca={busca}
  onChangeBusca={setBusca}
  totalItensCarrinho={cart.totalItens}
  onAbrirCarrinho={() => setCarrinhoAberto(true)}   {/* TASK-120.1: abre o CartModal — ver abaixo */}
>
  <TotemHero />
  {/* grid de produtos (filtrado por categoria/busca) — o carrinho não é mais renderizado aqui */}
</TotemLayout>
```

- **`TotemSidebar`**: navegação de categorias — desktop colapsa/expande (`--totem-sidebar-width` 15rem ⇄ `--totem-sidebar-collapsed-width` 5rem, tokens próprios em `tokens.css`, não reaproveita os do admin) via botão hambúrguer (`aria-expanded`/`aria-label` dinâmico "Recolher"/"Expandir menu de categorias"); mobile vira drawer (fechado por padrão, abre pela topbar, fecha por Escape/backdrop/seleção de categoria, bloqueia scroll do fundo, devolve foco ao hambúrguer — mesmo comportamento de `AdminSidebar`/`AdminLayout`). Sempre inclui uma opção **"Todas"** (`TOTEM_TODAS_CATEGORIAS`) além das categorias reais do backend — nunca categorias fictícias. Item ativo usa `aria-current="true"` + fundo/borda esquerda (não só cor). Estado de colapso (só desktop) persiste em `localStorage` sob chave própria (`useTotemSidebarCollapsed`, chave `totem.totem.sidebarCollapsed`), sem interferir em tema/sessão/dispositivo.
- **Coluna vs. conteúdo sticky (TASK-120.5)**: `TotemSidebar` agora renderiza um `<aside className="totem-sidebar-column">` envolvendo o `<nav className="totem-sidebar">` — dois elementos com papéis deliberadamente separados, corrigindo um bug em que o fundo/borda da sidebar "terminava" antes do fim de cardápios longos (com muitos produtos, o conteúdo principal passava de uma tela e o fundo lateral não acompanhava). A **coluna** (`aside`) é o item real do flex row `.totem-shell` (sem `height` própria, então estica via `align-items: stretch` do pai até a altura do irmão `.totem-shell__main`) e carrega o fundo/borda/divisão visual. O **conteúdo interno** (`nav`, inalterado desde a TASK-120.2: cabeçalho + `.totem-sidebar__lista` rolável + rodapé) continua com `position: sticky; top: 0; height: 100dvh` para ficar grudado na viewport durante a rolagem, mas no desktop é transparente — quem pinta a coluna inteira, do início ao fim do cardápio, é o `aside` por trás. Sidebar recolhida aplica a mesma lógica (`.totem-sidebar-column--collapsed`). No mobile, a coluna recolhe a zero (`width: 0`, sem fundo/borda) dentro do `@media (max-width: 959px)` — o `nav` retoma fundo/borda próprios ali, pois ele mesmo vira o drawer (`position: fixed`), fora do fluxo da coluna; sem isso, sobraria uma faixa lateral vazia reservada atrás do drawer fechado. **Causa raiz encontrada durante a investigação**: além do problema estrutural acima, `.totem-shell` tinha `overflow-x: hidden` (guarda contra scroll horizontal) sem declarar `overflow-y` — pela spec do CSS, um ancestral com um eixo de overflow diferente de `visible` força o outro eixo a computar como `auto`, transformando `.totem-shell` em seu próprio contêiner de scroll/clip. Como a rolagem real acontece no documento (não em `.totem-shell`), isso quebrava silenciosamente o `position: sticky` do `nav` assim que o cardápio passava de uma tela de altura — um bug pré-existente, nunca antes exercitado porque nenhum teste anterior tinha conteúdo alto o bastante para revelá-lo. A guarda contra scroll horizontal foi movida para `html` (a raiz real do documento), o que preserva o efeito sem quebrar o sticky de descendentes.
- **`TotemTopbar`**: título contextual (nome da categoria selecionada, ou "Resultados da busca" durante uma busca, ou "Cardápio" em "Todas"), campo de busca (`TotemSearch`, ver abaixo), `ThemeToggle` reaproveitado sem duplicar lógica, e o botão do carrinho com contador real (`cart.totalItens`) — `aria-label` inclui a quantidade ("Abrir carrinho, 3 itens"/"Abrir carrinho, 1 item"/"Abrir carrinho" quando vazio; badge visual só aparece com itens, mas o botão nunca perde o nome acessível). `aria-haspopup="dialog"` no botão. Clicar no carrinho chama `onAbrirCarrinho`, recebido de fora (`TotemLayout` não controla mais esse comportamento internamente) — **TASK-120.1** substituiu o scroll-to-DOM original (rolar até um `CartSummary` sempre visível) por abrir o `CartModal`, ver seção própria abaixo.
- **Busca**: local, sobre os produtos já carregados pelo cardápio — sem endpoint novo. Filtra por nome e descrição, normalizando maiúsculas/acentos (`utils/texto.ts`, `normalizarTextoBusca`). Quando há texto de busca, ele **ignora a categoria selecionada** e busca em todos os produtos; ao limpar a busca, a categoria selecionada volta a valer. Estado "sem resultado" ("Nenhum produto encontrado para esta busca.") é distinto do estado "categoria vazia" ("Nenhum produto disponível nesta categoria.").
- **Filtro por categoria**: seleção única (`categoriaSelecionada: number | "todas"`) — clicar numa categoria mostra só os produtos dela; "Todas" (padrão inicial, igual ao comportamento anterior à TASK-120) mostra todas as categorias empilhadas, como na tela antiga. A categoria padrão é sempre "Todas" na carga inicial — não há seleção automática de uma categoria específica após o cardápio chegar, para evitar um "flash" visual da visão completa antes de colapsar (achado real durante a implementação: fazer isso via `useEffect` causava uma corrida entre a repintura e a interação do usuário).
- **`TotemHero`**: hero institucional simples ("Monte seu pedido" / "Escolha os produtos e acompanhe seu carrinho."), sem preço, produto ou promoção fictícios — a referência visual desta task trazia um banner "Combo Especial por R$29,90" que não existe no catálogo real; ilustração decorativa (`aria-hidden`) com flutuação sutil, respeitando `prefers-reduced-motion`.
- **Ícones de chrome** (`components/totem/TotemIcons.tsx`): SVGs próprios do Totem (hambúrguer/menu, busca, limpar, carrinho) — mesmo padrão visual de `AdminIcons.tsx` (`viewBox 0 0 24 24`, `currentColor`, `aria-hidden`/`focusable="false"`), mas mantidos fora de `components/layout` para não acoplar a tela do cliente ao módulo administrativo. O ícone genérico de categoria (`TotemCategoriaIcon`, um "+") foi **removido na TASK-120.2** — ver `CategoryIcon`/`categoryIconResolver` abaixo.
- **Fora de escopo desta task**: badge de produto "Indisponível" não foi criado — a DTO `ProdutoCardapioResponse` não tem campo `disponivel` (o backend já filtra produtos indisponíveis antes de responder); adicionar esse estado exigiria uma mudança de contrato do backend, fora do escopo (só frontend).

### `ProductSelectionModal` / `CartModal` / `CartReviewItem` (`components/totem/`, TASK-120.1, revisado na TASK-120.3)

Substituem o painel lateral permanente da TASK-120 por dois modais com responsabilidades separadas, ambos empacotando o `Modal` genérico (`components/ui/Modal.tsx`) já usado no Admin — sem criar uma segunda implementação de modal.

```tsx
<ProductSelectionModal
  key={modalProduto?.aberturaId ?? "nenhum"}         // um contador de abertura — não só o id do produto (ver nota)
  produto={modalProduto?.produto ?? null}            // ProdutoParaCarrinho | null — aberto ⇔ produto !== null
  modo={modalProduto?.modo}                          // "adicionar" | "editar"
  quantidadeInicial={modalProduto?.quantidadeInicial}
  observacaoInicial={modalProduto?.observacaoInicial}
  onFechar={handleFecharModalProduto}
  onConfirmar={(produto, quantidade, observacao) =>
    modalProduto?.modo === "editar"
      ? cart.atualizarItem(produto.id, quantidade, observacao)
      : cart.addItem(produto, quantidade, observacao || undefined)
  }
/>

<CartModal
  aberto={carrinhoAberto}
  onFechar={() => setCarrinhoAberto(false)}
  itens={cart.itens}
  totalEstimado={cart.totalEstimado}
  onEditarItem={handleEditarItem}
  onRemove={cart.removeItem}
  onClear={cart.clearCart}
  onCreateOrder={handleCreateOrder}
  criandoPedido={criandoPedido}
  erroPedido={erroPedido}
  semAutorizacao={pedidoSemAutorizacao}
  onIrParaAtivacao={() => navigate("/ativar-dispositivo")}
/>
```

- **`ProductSelectionModal`**: aberto ao clicar em "Adicionar" no card do produto (modo `"adicionar"`, padrão) ou em "Editar" num item do carrinho (modo `"editar"`, TASK-120.3 — mesmo modal, só muda o rótulo do botão de confirmação para "Salvar alterações" e os valores iniciais de quantidade/observação). Estado efêmero próprio (`quantidade`, mínimo 1; `observacao`), **descartado ao cancelar** — nada é escrito no carrinho até confirmar. Subtotal = preço unitário × quantidade, mesmo `formatCurrencyBRL` do resto do app. Botões de quantidade em 3.25rem (52px, acima do mínimo geral de 44px — é o controle mais repetido da tela mais visitada do pedido). **Reset de estado entre aberturas**: em vez de um `useEffect` interno, o componente é remontado via `key`, controlada por quem chama — TASK-120.3 trocou `key={produto?.id}` por um contador de abertura (`aberturaId`, incrementado a cada "Adicionar"/"Editar"), porque o mesmo produto pode ser reaberto em modos diferentes (ou editado duas vezes seguidas) e só o `id` não mudaria nesses casos; um `useEffect` correria o mesmo risco de corrida já encontrado na TASK-120 com a seleção automática de categoria.
- **`CartModal`**: casca fina — só empacota `Modal` (`tamanho="grande"`) + `CartSummary`, sem copiar JSX. Aberto **exclusivamente** pelo botão de carrinho da `TotemTopbar` (nunca automaticamente após confirmar um produto). Vazio: mensagem + botão "Continuar escolhendo". Com itens (TASK-120.3): a tela virou uma etapa de **revisão e confirmação** — lista de `CartReviewItem` (resumo visual, sem edição inline) + uma seção de confirmação sempre visível (total, aviso, tipo de consumo, nome, "Criar pedido") destacada visualmente (fundo elevado) da lista de itens, resolvendo a queixa de hierarquia pouco clara entre "revisar" e "confirmar". O antigo toggle "Finalizar pedido" foi removido — nome/tipo de consumo/ação principal deixaram de competir por espaço com os controles de edição de cada item, então não precisam mais ficar escondidos atrás de um passo extra. Fechar (X, Escape, "Continuar escolhendo") nunca apaga o carrinho. `fecharAoClicarBackdrop` continua **não** ativado (diferente do modal de produto) — existe um formulário de nome/tipo de consumo que não deveria ser perdido por um clique acidental no backdrop.
- **`CartReviewItem`** (novo, TASK-120.3): resumo somente leitura de um item — imagem (`item.imagemUrl`, `object-fit: cover`, quadrada, `loading="lazy"`; fallback é o ícone `FaUtensils` já usado como fallback genérico do resolvedor de categorias, **nunca emoji**), nome, quantidade em texto ("3 unidades"), observação resumida só quando existe (nunca uma linha vazia "Sem observações"), subtotal, e duas ações: "Editar" (abre o `ProductSelectionModal` em modo edição com os valores atuais) e "Remover" (mesma função de sempre, `cart.removeItem`). Substitui `CartItemRow` (removido — confirmado sem outro uso além de `CartSummary`), que mantinha +/− e o campo de observação sempre expostos para todos os itens ao mesmo tempo.
- **Edição pontual (TASK-120.3)**: `TotemHomePage` mantém um único estado `modalProduto` (produto + modo + valores iniciais + `aberturaId`) em vez de estados separados para "produto selecionado" — clicar "Editar" fecha o `CartModal` e abre o `ProductSelectionModal` no mesmo tick (nunca dois diálogos simultâneos); salvar ou cancelar fecha o modal de produto e **reabre o carrinho automaticamente** (só quando a abertura era de edição — adicionar um produto novo continua sem abrir o carrinho). A atualização em si usa `useCart.atualizarItem(produtoId, quantidade, observacao)` — **define** os valores em vez de incrementar, e nunca remove/recria o item, preservando identidade (`produtoId`) e posição na lista. `useCart` perdeu `increment`/`decrement`/`setObservacao` (sem outro consumidor depois da remoção de `CartItemRow`).
- **Tipo de consumo (TASK-120.3)**: de dois botões de texto simples para um `<fieldset>`/`<legend>` com dois "cartões" clicáveis (ícone + título + descrição curta), cada um envolvendo um `<input type="radio">` nativo — semântica de grupo de rádio real (não `aria-pressed` simulado), estado ativo não depende só de cor (borda mais grossa + fundo preenchido + o próprio rádio marcado). Ícones de `react-icons/fa6`, já instalado (TASK-120.2) — `FaUtensils` para "Comer no local", `FaBox` para "Para viagem".
- **Nunca dois modais abertos ao mesmo tempo**: `modalProduto`/`carrinhoAberto` são estados independentes em `TotemHomePage`; abrir um sempre fecha o outro explicitamente quando relevante (editar fecha o carrinho antes de abrir o modal de produto; salvar/cancelar a edição reabre o carrinho só depois de fechar o modal de produto).
- **Fechar e voltar ao cardápio no mesmo estado**: como nenhum dos dois modais desmonta `TotemLayout` (ambos são renderizados como irmãos dele, via portal do `Modal`), fechar qualquer um preserva automaticamente categoria selecionada, busca digitada, sidebar expandida/recolhida e itens do carrinho.
- **Transição para pagamento**: ao criar o pedido com sucesso, `TotemHomePage` troca (desde a TASK-120) para um branch de retorno totalmente diferente (`if (pedidoCriado) return <AppLayout>...`), o que desmonta `TotemLayout`/`ProductSelectionModal`/`CartModal` de uma vez só — não foi necessário código novo para "fechar o modal antes do próximo passo".
- **Painel lateral removido** (TASK-120.1): `.totem-layout`/`.totem-layout__cardapio` (duas colunas) e o `position: sticky; width: 22rem` do carrinho em desktop foram removidos de `global.css`. O grid de produtos ocupa toda a largura do conteúdo.
- **Fora de escopo desta task**: `ProdutoCard`/`ProductSelectionModal` continuam usando 🍔 (emoji) como fallback de imagem quando o produto não tem `imagemUrl` — a TASK-120.3 só exigiu um fallback sem emoji para o novo `CartReviewItem`; alinhar os três componentes ao mesmo fallback SVG fica como melhoria futura, não implementada agora.

### `CategoryIcon` / `categoryIconResolver` (`components/totem/categoryIconResolver.tsx`, TASK-120.2)

Substitui o ícone genérico de "+" (`TotemCategoriaIcon`, removido) — que era usado igualmente para "Todas" e para toda categoria real, sem comunicar nada sobre o conteúdo — por ícones semanticamente relacionados ao nome da categoria.

**Biblioteca**: `react-icons@^5.7.0` (MIT, `peerDependencies: { react: "*" }` — compatível com React 19 sem ressalva), primeira biblioteca de ícones do projeto (confirmado antes de instalar: `package.json`/`package-lock.json` não tinham nenhuma). Só o subpacote `react-icons/fa6` (Font Awesome 6, estilo "solid") é usado, com **imports nomeados específicos** (`import { FaBurger, FaBottleWater, ... } from "react-icons/fa6"`), nunca a coleção inteira — cada export foi confirmado lendo `node_modules/react-icons/fa6/index.d.ts` antes de usar, não assumido pelo nome. Nota de estilo: os ícones do FA6 são preenchidos ("solid"), diferente do estilo *outline* (`stroke:currentColor`) do restante de `TotemIcons.tsx` — famílias diferentes por propósito (ícones de *chrome*/ação vs. ícones semânticos de categoria), não um erro de consistência.

```tsx
<CategoryIcon categoryName={categoria.nome} size="md" className="totem-sidebar__item-icone" />
```

- **`resolverIconeCategoria(nome: string): IconType`**: tabela de aliases explícita (nenhuma heurística de stemming/distância de edição), normalizando com o `normalizarTextoBusca` **já existente** (`utils/texto.ts`) mais um passo extra só aqui (`normalizarChaveIcone`, colapsa hífen/underscore em espaço) — assim "Cachorro-quente" e "cachorro quente" caem na mesma chave. Cobre: Todas/Todos/Cardápio (`FaTableCellsLarge`), Bebida(s)/Refrigerante(s)/Suco(s) (`FaBottleWater`), Hambúrguer(es)/Lanche(s) (`FaBurger`), Cachorro(s)-quente(s)/Hot dog(s) (`FaHotdog`), Pizza(s) (`FaPizzaSlice`), Batata(s)/Porção(ões)/Fritas (`FaBowlFood`), Sobremesa(s)/Sorvete(s) (`FaIceCream`), Combo(s)/Refeição(ões) (`FaKitchenSet`), Café(s) (`FaMugSaucer`), Salada(s)/Saudáve(is) (`FaCarrot`). Categoria sem alias reconhecido → `FaUtensils` (fallback genérico, nunca "+", nunca oculta a categoria). **Nunca mapeado por `categoria.id`** — só por nome normalizado, já que IDs variam entre bancos/restaurantes.
- **`CategoryIcon`**: camada fina sobre o resolvedor — sempre `aria-hidden="true"`/`focusable="false"` (decorativo; o nome acessível vem do texto/`title`/`aria-label` do botão que o envolve, nunca do ícone). Prop `size?: "sm" | "md" | "lg"` (padrão `"md"`) mapeia para classes que usam os tokens já existentes `--icon-size-sm/md/lg` — `react-icons` dimensiona por `1em` por padrão, então basta controlar `font-size` via CSS, sem valor literal novo.
- **Regra temporária baseada no nome**: não existe (e esta task não cria) campo de ícone no domínio — `CategoriaCardapioResponse` continua só com `id`/`nome`/`descricao`/`ordemExibicao`/`produtos`. Evolução futura registrada em `docs/roadmap-pos-mvp.md`: permitir que o restaurante escolha o ícone explicitamente no cadastro de categoria (backend/admin) — não implementada nesta task.
- **Sidebar com altura integral e nav rolável (achado real corrigido)**: a mecânica de altura (`position: sticky; height: 100dvh` na `<nav>`, `flex: 1` na lista empurrando o rodapé para baixo) já estava majoritariamente correta desde a TASK-120. O defeito real encontrado: `overflow-y: auto` estava no `<nav>` inteiro, não numa região interna — com muitas categorias, cabeçalho e rodapé rolavam junto com a lista em vez de ficarem fixos. Corrigido movendo o scroll para `.totem-sidebar__lista` (com `min-height: 0`, necessário para um filho flex em coluna respeitar `overflow-y: auto` em vez de crescer para caber todo o conteúdo) e deixando `.totem-sidebar` com `overflow: hidden`. `.totem-sidebar__rodape` ganhou `margin-top: auto` (redundante com o `flex: 1` da lista hoje, mas documenta a intenção de forma resiliente a mudanças futuras). Deliberadamente **não** trocado para `align-self: stretch` como uma leitura literal do briefing sugeriria — a sidebar precisa ficar travada na altura da viewport mesmo quando o conteúdo principal é mais alto que a tela, e `stretch` a esticaria até a altura desse conteúdo, quebrando o efeito sticky. Drawer mobile herda a correção automaticamente (mesmas classes, só a media query muda `position`/`width`/`transform`) e ganhou `padding-bottom: max(var(--spacing-md), env(safe-area-inset-bottom))` no rodapé, para dispositivos com "notch"/barra de gestos.

### `ProductImage` (`components/totem/ProductImage.tsx`, TASK-120.4)

Fonte única de verdade para exibir imagem de produto no Totem — antes desta task, `ProdutoCard` e `ProductSelectionModal` usavam 🍔 (emoji) como fallback e `CartReviewItem` (TASK-120.3) tinha seu próprio SVG (`FaUtensils` direto, sem componente reutilizável); **nenhum dos três tratava imagem quebrada** (`onError`) — uma `imagemUrl` presente mas inválida mostrava o ícone de imagem quebrada do navegador, não um fallback visual.

```tsx
<ProductImage
  src={produto.imagemUrl}      // string | null | undefined
  productName={produto.nome}
  size="card"                  // "card" | "modal" | "thumbnail"
  loading="lazy"                // "lazy" (padrão) | "eager"
/>
```

- **Fallback único**: `FaUtensils` (`react-icons/fa6`, já instalado desde a TASK-120.2 — nenhuma biblioteca nova) — nunca emoji. Reaproveita a mesma identidade visual já usada como fallback genérico em `categoryIconResolver.tsx` (categoria desconhecida) e no antigo `CartReviewItem`, então "utensílios" já era o símbolo implícito de "produto/categoria genérico" no Design System — este componente só centraliza isso, não introduz um conceito novo.
- **Erro de carregamento**: estado `falhouAoCarregar` resetado por `useEffect` a cada troca de `src` — mesma estratégia (não o mesmo código) já validada em produção por `components/admin/produtos/ProdutoCard.tsx` (fora do escopo desta task, mas confirma que a abordagem funciona). Sem risco de loop: assim que `falhouAoCarregar` vira `true`, o `<img>` deixa de existir (substituído pelo fallback), então não há novo `onError` possível.
- **Três variantes de tamanho** (`size`), todas usando o mesmo componente — não três componentes: `card` (10rem de altura, largura 100%, usado dentro de `.produto-card`, que já clipa via `overflow: hidden` no card inteiro), `modal` (12rem, `border-radius` próprio — o conteúdo do modal não clipa), `thumbnail` (quadrado 4.5rem, `border-radius` próprio, usado em `CartReviewItem`). `object-fit: cover` na imagem real; fallback centralizado (flex) preenchendo o mesmo espaço.
- **Acessibilidade**: imagem real usa `alt={`Imagem de ${productName}`}` (ex.: `"Imagem de Dogão tradicional"`). O fallback é sempre `aria-hidden` — decorativo, sem `role="img"`/`aria-label` próprio — porque o nome do produto já é visível como texto em todos os três contextos onde `ProductImage` é usado (`ProdutoCard` mostra o `<h3>`, `ProductSelectionModal` usa o nome como título do `Modal`, `CartReviewItem` mostra o nome ao lado); anunciar o fallback separadamente seria redundante.
- **CSS próprio, sem tocar no que já existia**: novas classes `.product-image`/`.product-image--card/modal/thumbnail`/`.product-image__img`/`.product-image__fallback` — deliberadamente **não** reaproveitam nem removem `.produto-card__imagem`/`.produto-card__imagem--placeholder`, porque `components/admin/produtos/ProdutoCard.tsx` (tela `/admin/produtos`, fora do escopo desta task) ainda depende dessas classes (`.pedido-pendente-card > .produto-card__imagem`, com um `border-radius` próprio). Alterar/remover essas classes teria quebrado o Admin sem necessidade.
- **Uso**: `ProdutoCard` (`size="card"`, `loading="lazy"`, padrão), `ProductSelectionModal` (`size="modal"`, `loading="eager"` — o produto já foi selecionado, a imagem deve aparecer imediatamente), `CartReviewItem` (`size="thumbnail"`, `loading="lazy"`, substitui o `FaUtensils` que estava direto no componente).
- **Fora de escopo desta task**: `components/admin/produtos/ProdutoCard.tsx` (Admin) continua com seu próprio emoji 🍔 e sem `ProductImage` — a task pediu explicitamente para não alterar telas administrativas sem necessidade; unificar os dois fica como melhoria futura.

### `OperadorPainel` (`components/operador/OperadorPainel.tsx`, TASK-092, simplificado na TASK-119, integrado ao layout na TASK-119.2)

Só o formulário de identificação (a exibição do operador identificado vive em `OperationalTopbar`, acima). A partir da TASK-119.2, este componente **é** o conteúdo central do `OperationalLayout` nesse estado — não fica mais numa casca `AppLayout centralizado` separada. Props: `titulo: string` (renderizado como `<h1>` — único título da tela nesse estado), `descricao?: string`, `onIdentificado`. `mensagemIdentificacao`/`acaoTrocarDispositivo` foram removidas: "Trocar dispositivo" é responsabilidade exclusiva da topbar agora — antes da TASK-119.2 este componente também renderizava seu próprio botão "Trocar dispositivo" (herdado de quando vivia sozinho, sem topbar ao redor); mantê-lo teria duplicado a ação na mesma tela. Classes CSS próprias (`operational-login`/`operational-login__card`/`operational-login__titulo`/`operational-login__descricao`/`operational-login__form`) substituem as antigas `operador-painel*`, removidas por não terem mais uso (confirmado por busca antes de remover). Campo de e-mail recebe foco automático (`autoFocus`) ao montar.

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

## Ícones (TASK-114/117/118/119/120/120.2)

Até a TASK-116, todo "ícone" era um glifo Unicode (`×`, `+`, `−`) ou um emoji (💡) — sem nenhum SVG no projeto. A TASK-117 introduziu os **três primeiros SVGs**, decorativos (`components/auth/FoodIcons.tsx`, hambúrguer/batata/bebida do painel institucional do login). A TASK-118 introduziu o **primeiro conjunto de SVGs funcionais** (`components/layout/AdminIcons.tsx`): 11 ícones (Dashboard, Restaurante, Dispositivo, Categoria, Produto, Usuário, Pedido, Menu/hambúrguer, Chevron de recolher, Logout, Moeda) usados na sidebar/topbar/dashboard administrativos — mesmo estilo consistente entre si (`viewBox="0 0 24 24"`, traço `currentColor`, sem preenchimento, peso `strokeWidth="1.8"`), geometria própria, nunca copiada de biblioteca externa. A TASK-119 adicionou `components/layout/OperationalIcons.tsx` (mesmo `IconBase`/estilo): Caixa, Cozinha, Trocar operador, Trocar dispositivo, Atualizar, Relógio, Iniciar, Pronto — reexportando (não duplicando) `DispositivoIcon`/`MoedaIcon`/`PedidoIcon`/`UsuarioIcon` de `AdminIcons.tsx` onde o mesmo símbolo já servia. A TASK-120 adicionou `components/totem/TotemIcons.tsx` (mesmo `IconBase`/estilo, mas **não** reexporta de `AdminIcons.tsx` — decisão deliberada para não acoplar a tela do cliente ao módulo administrativo): Menu/hambúrguer, Busca, Limpar (×), Carrinho, Categoria genérica (um "+", decorativo). A **TASK-120.2** removeu esse "+" genérico e instalou a **primeira biblioteca de ícones do projeto** (`react-icons@^5.7.0`, MIT, só o subpacote `fa6`, imports nomeados específicos — nunca a coleção inteira) para dar a cada categoria um ícone semanticamente relacionado ao nome (ver `CategoryIcon`/`categoryIconResolver` acima); os SVGs próprios (`TotemIcons.tsx`, `AdminIcons.tsx`, etc.) continuam existindo para ícones de *chrome*/ação — as duas famílias coexistem por propósitos diferentes (ação vs. conteúdo), não é inconsistência.

**Achado real de QA visual (TASK-119)**: "Trocar operador" e "Trocar dispositivo" inicialmente usavam o mesmo ícone genérico de troca (duas setas opostas) — em mobile, onde só o ícone fica visível (o texto é ocultado por espaço, igual ao padrão já usado no `AdminTopbar`), os dois botões ficavam visualmente indistinguíveis um do outro, apesar do `aria-label` diferente em cada um (que resolve para leitor de tela, mas não para quem está olhando a tela). Corrigido trocando por dois ícones específicos — pessoa-com-setas (`TrocarOperadorIcon`) e dispositivo-com-setas (`TrocarDispositivoIcon`) — cada botão com um símbolo que representa a própria ação, não um genérico de "troca".

Cada ícone funcional (o que acompanha um link/botão real, diferente dos decorativos) segue o mesmo padrão de acessibilidade dos "botões só-ícone" já documentado acima: `aria-hidden="true"`/`focusable="false"` no `<svg>`, nome acessível vindo do elemento que o envolve (`aria-label`/texto visível do link ou botão), nunca do ícone em si.

Tokens de tamanho (`tokens.css`):

| Token | Valor | Uso |
|---|---|---|
| `--icon-size-sm` | 1rem (16px) | reservado — nenhum uso real ainda |
| `--icon-size-md` | 1.25rem (20px) | os 3 botões só-ícone da TASK-114 (ver acima) |
| `--icon-size-lg` | 1.5rem (24px) | reservado — nenhum uso real ainda |

`FoodIcons` e `AdminIcons` não usam esses tokens (tamanho fixo em `width`/`height` no próprio SVG — os ícones da sidebar/topbar são todos 20×20px, um valor único que não precisou de token dedicado) — se um quarto contexto de ícone aparecer com necessidade real de variar tamanho, vale promover isso a um token novo ou reaproveitar `--icon-size-*`.

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

**`PedidoStatusBadge` (`components/ui/PedidoStatusBadge.tsx`, TASK-119)**: extraído de `PedidoPendenteCard`/`PedidoCozinhaCard`, que renderizavam o mesmo `<span className="pedido-pendente-card__status">{getPedidoStatusLabel(...)}</span>` de forma duplicada — mesmo contrato visual, sem mudança de classe CSS. **Hierarquia da Cozinha** (TASK-119): reordenada para número → tempo de espera (`formatarTempoDecorrido`, `utils/dateTime.ts`) → itens → observações → status → ação, priorizando o que um cozinheiro precisa ver primeiro; o tempo fica no cabeçalho do card, ao lado do número (`.pedido-cozinha-card__tempo`), mostrando **só o tempo decorrido**, nunca uma classificação tipo "atrasado"/"recente" — nenhuma regra desse tipo existe no backend hoje, e inventar uma seria criar uma regra operacional arbitrária (fora do escopo pedido). A quantidade de cada item (`3x`) ganhou `<strong>` (`ItemPedidoCozinhaRow`) para leitura mais rápida à distância.

**Exceção no bloco de dados do `UsuarioCard` (TASK-119.1)**: continua usando `.pedido-pendente-card` como raiz (cabeçalho + ações inalterados), mas **não** usa mais `dl.pedido-pendente-card__detalhes` para os metadados — aquela grid (`grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr))`, 2-3 colunas) foi dimensionada para valores curtos ("Criado em", "Tipo de consumo") e não tem `min-width: 0`/`overflow-wrap` nos itens; com um e-mail (`admin.local@totem.local`) ou perfil (`Administrador do restaurante`) bem mais longos, o texto extrapolava a coluna e sobrepunha o campo vizinho (bug real corrigido nesta task). `UsuarioCard` usa `dl.usuario-card__detalhes` própria — grid de **uma única coluna** (`grid-template-columns: minmax(0, 1fr)`), cada campo (`.usuario-card__campo`) com `min-width: 0` e `.usuario-card__valor` com `overflow-wrap: anywhere`, para o e-mail poder quebrar mesmo sem espaços. Não reutilize `.pedido-pendente-card__detalhes` para um card novo se os valores puderem ser mais longos que ~2-3 palavras — prefira esse padrão de coluna única.

## Grupo de ações (TASK-114)

`.dispositivo-form__acoes` é o padrão de grupo de ações do projeto (`display: flex; flex-wrap: wrap; gap: var(--spacing-sm)`), usado em todo formulário e card administrativo. Não existe uma classe `.ui-actions` separada — `.dispositivo-form__acoes` já cumpre esse papel; renomear só por consistência de nome não foi feito nesta task (alto número de arquivos tocados, zero ganho visual/funcional).

- Botões dentro de `.dispositivo-form__acoes` recebem `flex: 1; min-width: 10rem` via `.dispositivo-form__acoes .ui-button` — cresce para preencher a linha, quebra em telas estreitas (`flex-wrap`) sem gerar scroll horizontal (verificado por Playwright na TASK-114).
- A ação principal é sempre o primeiro `Button` (`variant="primary"`, implícito); ações secundárias vêm depois, com `variant="secondary"`/`"danger"`.

## Estados vazios e carregamento

- Vazio: `<p className="totem-estado">Nenhum restaurante cadastrado.</p>` — mesma classe em toda página (`totem-estado`), sem ícone/ilustração (fora do escopo). Mensagem descreve o que falta; a ação de criar já está sempre visível no cabeçalho ("Novo restaurante" etc.), então não repete um botão dentro do estado vazio.
- Carregamento: `<p className="totem-estado">Carregando restaurantes...</p>` (texto simples, sem spinner animado) ou `Button` com `loading` (texto "Aguarde...", `aria-busy`, desabilitado). Nenhum spinner CSS existe hoje — se um for adicionado no futuro, deve respeitar `@media (prefers-reduced-motion: reduce)` (TASK-113).
- Carregamento/erro **por item de uma grade** (não a página inteira): `DashboardMetricCard` (TASK-118) é o primeiro exemplo — cada card tem seu próprio `loading`/`error`, então uma falha em `GET /api/admin/dashboard` (fonte única dos 9 indicadores) não derruba o hero de boas-vindas nem gera um `0` disfarçado de dado real.
- **`OperationalEmptyState` (`components/ui/OperationalEmptyState.tsx`, TASK-119)**: padroniza os três estados que `CaixaHomePage`/`CozinhaHomePage` renderizavam de forma duplicada (`variant="loading" | "erro" | "vazio"`) — mesma classe `totem-estado`/`ErrorMessage` de sempre, sem mudança visual. Diferença real desta task: o estado de carregamento ganhou `aria-live="polite"`/`aria-busy="true"` (ausentes antes), e o de erro só mostra "Tentar novamente" quando `onTentarNovamente` é passado.

## Convenções gerais

- Todo componente de UI usa `className`/nome de classe CSS previsível prefixado `ui-*` (exceto os de layout, prefixados `module-header*`/`app-layout*`, e os específicos de domínio como `pedido-pendente-card*`/`dispositivo-card*`).
- Estilo vive em `global.css`, não em CSS-in-JS nem em `style={{}}` inline — mais fácil de auditar contra os tokens.
- Nenhum componente aqui decide cor "na mão" — tudo via `var(--color-*)`/`var(--font-*)`.
- Antes de criar uma nova classe CSS para um botão/badge/card, procure se a variante já existe em `Button`/`.dispositivo-card__status`/`.pedido-pendente-card` — a TASK-114 consolidou 4 classes de botão duplicadas e 1 de badge nesse sentido.

## Próximos componentes prováveis (não implementados ainda)

`SelectField` (nenhuma tela usa `<select>` nativo estilizado hoje — os formulários usam grupos de botão tipo/toggle em vez de `<select>`), `IconButton` genérico (só vale a pena com um 4º caso real, ver acima), `<Badge>` React (só vale a pena com mais variantes reais, ver acima). Validação inline por campo nos formulários fica para task futura — ver `docs/roadmap-pos-mvp.md`.
