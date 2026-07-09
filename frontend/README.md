# Totem Fast Food — Frontend

Frontend React + TypeScript + Vite do Sistema de Totem de Autoatendimento para Fast Food. Criado na TASK-028 (setup inicial). A TASK-029 implementou a ativação de dispositivo. A TASK-030 implementou o Design System (temas dark/light, tokens CSS, tipografia). A TASK-031 implementou a tela de cardápio do Totem. A TASK-032 implementou o carrinho local do Totem. A TASK-033 implementou a criação real de pedido (`POST /api/totem/pedidos`) a partir do carrinho. A TASK-034 implementou o pagamento do pedido (`POST /api/totem/pedidos/{id}/pagamento`). A TASK-035 implementou o acompanhamento do pedido (`GET /api/totem/pedidos/{id}`), com atualização manual e polling leve. A TASK-036 implementou a lista de pendências do Caixa (`GET /api/caixa/pedidos/pendentes`), ainda sem executar ações. A TASK-037 implementou as ações de confirmar pagamento em dinheiro e enviar pedido para a cozinha.

## Stack

- **React 19 + TypeScript**
- **Vite** como bundler/dev server
- **react-router-dom** para roteamento
- **fetch nativo** (sem axios) para chamadas HTTP, centralizado em `src/services/api.ts`
- CSS puro com tokens/temas (`src/styles/{tokens,themes,global}.css`), sem framework de UI

## Como instalar e rodar

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`.

Outros comandos:

```bash
npm run build    # build de produção (tsc -b && vite build)
npm run preview  # serve o build de produção localmente
npm run lint      # oxlint
```

## Configuração de ambiente

Copie `.env.example` para `.env` (o `.env` já existe neste setup inicial com valores de desenvolvimento local — nunca commitar segredos reais nele):

```bash
VITE_API_BASE_URL=http://localhost:8080
```

O backend precisa estar rodando (`cd backend && mvn spring-boot:run`) na URL configurada. Veja `docs/testes-backend-mvp.md` e `docs/http/totem-fast-food-mvp.http` na raiz do repositório para o roteiro completo de validação da API.

## Estrutura de pastas

```text
src/
├── app/            # componente raiz (App.tsx) — monta o roteador
├── routes/         # definição das rotas (AppRoutes.tsx)
├── pages/          # telas, uma pasta por módulo (totem/, caixa/, cozinha/, admin/)
├── components/
│   ├── layout/     # AppLayout, ModuleHeader — layout compartilhado
│   ├── ui/         # Button, Input, ErrorMessage, ThemeToggle — componentes mínimos reutilizáveis
│   └── totem/      # CategoriaCardapioSection, ProdutoCard — específicos da tela de cardápio
├── contexts/       # ThemeContext.tsx — estado do tema
├── hooks/          # useTheme.ts
├── services/       # api.ts (HTTP), tokenStorage.ts (sessão), authService.ts, totemService.ts, ...
├── types/          # tipos TypeScript espelhando os DTOs do backend
├── utils/          # formatters.ts (ex.: formatCurrencyBRL)
└── styles/         # tokens.css, themes.css, global.css
```

`hooks/` e `contexts/` foram criadas na TASK-030 para o tema (`ThemeContext`/`useTheme`) — antes disso não existiam por não terem uso real ainda. `utils/` continua propositalmente ausente pelo mesmo motivo; será criada quando houver a primeira função utilitária real.

## Rotas atuais

| Rota | Página | Módulo |
|---|---|---|
| `/` | `HomePage` | Ponto de entrada |
| `/ativar-dispositivo` | `AtivarDispositivoPage` | **Real** — ativação de dispositivo (Totem/Caixa/Cozinha) |
| `/totem` | `TotemHomePage` | **Real** — cardápio, carrinho, pedido, pagamento e acompanhamento do dispositivo TOTEM |
| `/caixa` | `CaixaHomePage` | **Real** — lista de pendências e ações de confirmar dinheiro/enviar à cozinha do dispositivo CAIXA (retirada/cancelamento ainda pendentes) |
| `/cozinha` | `CozinhaHomePage` | Cozinha (placeholder) |
| `/admin/login` | `AdminLoginPage` | Login administrativo (placeholder) |
| `/admin` | `AdminHomePage` | Painel administrativo (placeholder) |

`/ativar-dispositivo` (TASK-029), `/totem` (TASK-031 a 035) e `/caixa` (TASK-036 e TASK-037) têm lógica real. As demais renderizam apenas título e descrição via `AppLayout`.

## Como testar a ativação de dispositivo

1. Suba o backend: `cd backend && mvn spring-boot:run`.
2. Faça login como `SUPER_ADMIN` (`POST /api/auth/login`) e cadastre um dispositivo (`POST /api/admin/dispositivos`) — veja exemplos prontos em `docs/http/totem-fast-food-mvp.http` (blocos 2, 6–8). A resposta traz `codigoAtivacao`.
3. Suba o frontend (`npm run dev`) e abra `http://localhost:5173/ativar-dispositivo`.
4. Cole o `codigoAtivacao` e envie. Sucesso esperado: mensagem de confirmação e redirecionamento automático para `/totem`, `/caixa`, `/cozinha` ou `/admin`, conforme o `tipoDispositivo` cadastrado.
5. Confirme no DevTools → Application → Local Storage: chaves `totem.accessToken` e `totem.dispositivo` preenchidas.
6. Código vazio não chega a chamar o backend (validação no cliente); código inválido/já usado retorna erro do backend, exibido na tela.

## Como testar o cardápio do Totem (`/totem`)

Requer backend rodando e um dispositivo **TOTEM** já ativado (ver seção anterior).

1. Sem token salvo, abrir `http://localhost:5173/totem` diretamente redireciona para `/ativar-dispositivo` — a tela nunca chega a chamar o backend sem sessão.
2. Após ativar um dispositivo TOTEM, `/totem` chama `GET /api/totem/cardapio` automaticamente ao montar (`totemService.buscarCardapio`), mostrando "Carregando cardápio..." enquanto aguarda.
3. Sucesso: categorias e produtos disponíveis aparecem em grid (1 coluna no mobile, 2–3 no desktop), com nome, descrição, preço formatado em R$, imagem (ou um emoji placeholder se `imagemUrl` for nulo) e selos "Destaque"/"Recomendado" quando aplicável. O botão "Adicionar" adiciona o produto ao carrinho local (ver seção abaixo).
4. Marcar um produto como `disponivel=false` ou uma categoria como `ativa=false` no admin (`PATCH /api/admin/produtos/{id}/disponibilidade`, `PUT /api/admin/categorias/{id}`) e recarregar a tela: o item some — a filtragem já é feita pelo backend, o frontend só renderiza o que a API retorna.
5. Sem nenhuma categoria/produto disponível: mensagem "Nenhum produto disponível no momento."
6. Token inválido/expirado (edite `totem.accessToken` no DevTools para um valor qualquer): a tela mostra "Sessão expirada..." e limpa a sessão local, com botão para voltar à ativação.
7. Token de outro tipo de dispositivo (ex.: ative um CAIXA e depois visite `/totem` manualmente sem reativar): mostra "Este dispositivo não tem permissão..." sem apagar a sessão (o token continua válido para `/caixa`).
8. Alterne o tema (💡) e confirme que cards, selos e botões se adaptam a dark/light sem cor fora do lugar.

## Como testar o carrinho do Totem

Carrinho local, em memória (`useCart`, `src/hooks/useCart.ts`) — não persiste em `localStorage`. A partir da TASK-033 o botão "Finalizar pedido" abre um formulário e cria o pedido de verdade no backend (ver seção seguinte).

1. Com o cardápio carregado em `/totem`, clique em "Adicionar" em um produto: ele aparece no carrinho (coluna lateral no desktop, abaixo do cardápio no mobile) com quantidade 1 e subtotal calculado.
2. Clique em "Adicionar" no mesmo produto novamente: a linha não duplica, a quantidade incrementa.
3. Use os botões **+**/**−** no carrinho para ajustar a quantidade; subtotal do item e "Total estimado" atualizam a cada mudança.
4. Diminua a quantidade até zero (ou clique em "Remover"): o item some da lista.
5. Digite algo no campo "Observação" de um item (ex.: "Sem cebola") — fica associado ao item e é enviado ao criar o pedido.
6. Clique em "Limpar carrinho": todos os itens somem e aparece a mensagem "Seu carrinho está vazio.".
7. Alterne o tema (💡) com itens no carrinho e confirme que cores/bordas continuam consistentes com o resto da tela.

## Como testar a criação de pedido (`POST /api/totem/pedidos`)

Requer backend rodando, restaurante com categoria ativa e produto disponível, e um dispositivo **TOTEM** já ativado.

1. Suba o backend (`cd backend && mvn spring-boot:run`) e o frontend (`cd frontend && npm run dev`).
2. Em `/totem`, adicione um ou mais produtos ao carrinho e clique em "Finalizar pedido": aparece o formulário com campo "Seu nome" e as opções "Comer no local" / "Para viagem" (LOCAL selecionado por padrão).
3. Clique em "Criar pedido" com o nome vazio: nenhuma chamada é feita ao backend, aparece a mensagem "Informe seu nome para continuar.".
4. Preencha o nome, escolha o tipo de consumo e clique em "Criar pedido": o botão mostra "Aguarde..." durante a chamada a `totemService.criarPedido` (`POST /api/totem/pedidos`).
5. Confira no DevTools → Network o corpo da requisição: contém apenas `tipoConsumo`, `clienteNome` e `itens[].{produtoId, quantidade, observacao}` — nenhum campo de preço, subtotal, valorTotal ou restauranteId é enviado.
6. Sucesso esperado: o carrinho é limpo e a tela passa a mostrar o resumo do pedido — número do pedido, status (`CRIADO`), cliente, tipo de consumo, itens com subtotal e total confirmados pelo backend. A partir da TASK-034 o botão "Ir para pagamento" está habilitado (ver seção seguinte).
7. Clique em "Fazer novo pedido" para voltar ao cardápio e montar um novo carrinho.
8. Para simular erro de produto indisponível, marque o produto do carrinho como indisponível no admin (`PATCH /api/admin/produtos/{id}/disponibilidade`) antes de clicar em "Criar pedido": o backend responde com erro e a tela mostra uma mensagem amigável, sem perder os dados do formulário.
9. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido antes de criar o pedido: aparece mensagem de sessão expirada e o botão "Ir para ativação de dispositivo".
10. Alterne o tema (💡) com o formulário aberto e com o resumo do pedido visível — cores e bordas devem seguir os tokens do Design System nos dois temas.

## Como testar o pagamento do pedido (`POST /api/totem/pedidos/{id}/pagamento`)

O provedor de pagamento do backend é um `FakePaymentProvider` (ver `docs/10-pagamentos.md`) — não há integração real com Pix, cartão ou gateway nenhum, apenas simulação determinística por forma de pagamento.

Formas de pagamento disponíveis: **Pix**, **Cartão de crédito**, **Cartão de débito** e **Dinheiro**.

1. Com backend e frontend rodando e um pedido já criado (ver seção anterior), clique em "Ir para pagamento" no resumo do pedido: aparece a tela `PagamentoPedido` com o valor a pagar (confirmado pelo backend) e as quatro opções de forma de pagamento (Pix pré-selecionado).
2. Escolha **Pix** e clique em "Confirmar pagamento". Confira no DevTools → Network que o corpo da requisição é só `{"formaPagamento":"PIX"}` — sem `valor`, `statusPagamento`, `statusPedido` ou `restauranteId`.
3. Resultado esperado: tela de sucesso (`PagamentoResultado`) com destaque verde, título "Pagamento aprovado!", `statusPagamento = AUTORIZADO`, `statusPedido = PAGO` e a orientação "Pagamento aprovado. Aguarde o envio para a cozinha.".
4. Clique em "Fazer novo pedido", monte um novo carrinho e repita o pagamento escolhendo **Cartão de crédito** e, em outro pedido, **Cartão de débito**: ambos devem resultar em `AUTORIZADO`/`PAGO`, com a mesma tela de sucesso.
5. Em um novo pedido, escolha **Dinheiro**: o resultado mostra destaque neutro, título "Pagamento pendente", `statusPagamento = PENDENTE`, `statusPedido = AGUARDANDO_PAGAMENTO_DINHEIRO` e a orientação "Pagamento em dinheiro aguardando confirmação no caixa. Dirija-se ao caixa para concluir o pagamento.".
6. Se o backend permitir repetir a chamada de pagamento sobre um pedido já `PAGO`, o erro retornado (400) aparece como mensagem amigável na própria tela de pagamento, sem travar a interface.
7. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido antes de confirmar o pagamento: aparece mensagem de sessão expirada e o botão "Ir para ativação de dispositivo".
8. Alterne o tema (💡) na tela de seleção de pagamento e na tela de resultado (aprovado e pendente) — cores e bordas devem seguir os tokens do Design System nos dois temas.
9. Logo após o pagamento, a tela `AcompanhamentoPedido` aparece abaixo do resultado — ver seção seguinte para testar o acompanhamento até a retirada.

## Como testar o acompanhamento do pedido (`GET /api/totem/pedidos/{id}`)

A partir da TASK-035, assim que o pagamento é confirmado (qualquer forma), a tela `AcompanhamentoPedido` aparece logo abaixo de `PagamentoResultado`, mostrando o status atual do pedido, uma orientação textual para o cliente e um botão "Atualizar status". Enquanto o pedido não estiver em um status final (`RETIRADO`, `CANCELADO` ou `EXPIRADO`), a tela também faz um **polling leve** — consulta automática a cada 15 segundos via `totemService.consultarPedido` — além da atualização manual pelo botão.

Como o Totem não envia pedido para a cozinha nem confirma pagamento em dinheiro (isso é dos módulos Caixa/Cozinha, fora do escopo desta task), os próximos passos do fluxo precisam ser simulados diretamente na API, usando os blocos do arquivo [`docs/http/totem-fast-food-mvp.http`](../docs/http/totem-fast-food-mvp.http) (ou qualquer cliente HTTP equivalente) com o token de um dispositivo `CAIXA`/`COZINHA` já ativado.

1. Crie um pedido no Totem e pague com **Dinheiro**. Resultado imediato: `PagamentoResultado` mostra "Pagamento pendente" e `AcompanhamentoPedido` mostra o status "Aguardando pagamento no caixa" com a orientação "Dirija-se ao caixa para confirmar o pagamento em dinheiro.".
2. No `docs/http/totem-fast-food-mvp.http`, use o bloco **22. Confirmar pagamento em dinheiro (Caixa)** (`POST /api/caixa/pedidos/{pedidoId}/confirmar-pagamento` com `tokenCaixa`) para confirmar o pagamento.
3. No Totem, clique em "Atualizar status" (ou aguarde o polling de até 15s): o status muda para "Pagamento confirmado", com a orientação "Pagamento confirmado. Aguarde o envio para a cozinha.".
4. Use o bloco **16. Enviar pedido para cozinha (Caixa)** (`POST /api/caixa/pedidos/{pedidoId}/enviar-cozinha`) para enviar o pedido.
5. Atualize no Totem: status "Enviado para a cozinha".
6. Use os blocos **18** e **19** (`PATCH /api/cozinha/pedidos/{pedidoId}/status` com `tokenCozinha`, body `{"statusPedido":"EM_PREPARO"}` e depois `{"statusPedido":"PRONTO"}`) para simular o preparo.
7. Atualize no Totem entre cada passo: status/orientação mudam para "Em preparo" ("Seu pedido está em preparo.") e depois "Pronto para retirada" ("Seu pedido está pronto para retirada.").
8. Use o bloco **20. Caixa: marcar como retirado** (`POST /api/caixa/pedidos/{pedidoId}/retirar`).
9. Atualize no Totem: status "Retirado", orientação "Pedido retirado. Obrigado!" — o botão "Atualizar status" some (pedido em status final) e o polling para automaticamente.
10. Para testar cancelamento, crie outro pedido e use o bloco **23. Cancelar pedido (Caixa)** (`POST /api/caixa/pedidos/{pedidoId}/cancelar`) antes de atingir um status final; atualize no Totem e confirme status "Cancelado" com a orientação "Pedido cancelado." (também sem botão de atualizar).
11. Para simular sessão expirada durante o acompanhamento, edite `totem.accessToken` no DevTools para um valor inválido e clique em "Atualizar status": aparece mensagem de sessão expirada e o botão "Ir para ativação de dispositivo".
12. Abra o DevTools → Network e confirme que cada atualização (manual ou automática) é um `GET /api/totem/pedidos/{id}` sem corpo.
13. Alterne o tema (💡) com o acompanhamento visível em diferentes status — cores e bordas devem seguir os tokens do Design System nos dois temas.

## Como testar a lista de pendências do Caixa (`GET /api/caixa/pedidos/pendentes`)

A partir da TASK-036, `/caixa` lista os pedidos que exigem ação do operador de caixa — confirmação de pagamento em dinheiro ou envio para a cozinha. A partir da TASK-037 os botões de ação (`Confirmar dinheiro`/`Enviar para cozinha`) executam de verdade contra o backend — ver a seção seguinte.

Requer um dispositivo **CAIXA** ativado (ver seção "Como testar a ativação de dispositivo"; use `tipoDispositivo: "CAIXA"` ao cadastrar o dispositivo).

1. Sem token salvo, abrir `http://localhost:5173/caixa` diretamente redireciona para `/ativar-dispositivo` — a tela nunca chega a chamar o backend sem sessão.
2. Ative um dispositivo CAIXA e confirme o redirecionamento automático para `/caixa`.
3. Sem nenhum pedido pendente no restaurante, a tela mostra "Nenhum pedido pendente no momento.".
4. Gere uma pendência de dinheiro: ative um dispositivo TOTEM (em outra aba/sessão, já que o token é único por `localStorage`), crie um pedido e pague com **Dinheiro**. Volte para `/caixa` (reative o dispositivo CAIXA se o token tiver sido sobrescrito) e clique em "Atualizar lista": o pedido aparece com status "Aguardando pagamento no caixa", a orientação "Cliente escolheu pagar em dinheiro. Confirme o recebimento no caixa." e o botão "Confirmar dinheiro" ativo.
5. Gere uma pendência de envio à cozinha: crie outro pedido pelo Totem e pague com **Pix** ou **cartão**. Atualize a lista do Caixa: o pedido aparece com status "Pagamento confirmado", a orientação "Pagamento confirmado. Envie o pedido para a cozinha." e o botão "Enviar para cozinha" ativo.
6. Confira que cada card mostra número do pedido, cliente, tipo de consumo, datas de criação/atualização, itens (com observação quando houver) e o total formatado em R$.
7. Clique em "Atualizar lista" a qualquer momento: o botão mostra "Aguarde..." durante a chamada e a lista é recarregada com `GET /api/caixa/pedidos/pendentes`.
8. Para simular erro de permissão, acesse `/caixa` com um token de TOTEM ou COZINHA (ative um desses dispositivos e edite a rota manualmente): aparece "Este dispositivo não tem permissão para acessar o Caixa.", sem apagar a sessão salva (o token continua válido para o módulo original).
9. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e clique em "Atualizar lista": aparece mensagem de sessão expirada e o botão "Ir para ativação de dispositivo".
10. Alterne o tema (💡) com a lista de pendências visível — cards, badges de status e botões devem seguir os tokens do Design System nos dois temas.
11. Pedidos em `CRIADO`/`AGUARDANDO_PAGAMENTO` (aguardando o cliente no Totem) ou a partir de `ENVIADO_PARA_COZINHA` (responsabilidade da Cozinha) não aparecem nesta lista — isso é filtrado pelo próprio backend, não pelo frontend.

## Como testar as ações do Caixa (confirmar dinheiro e enviar para cozinha)

A partir da TASK-037, os botões de ação de cada card em `/caixa` executam de verdade. **Retirada e cancelamento continuam fora do escopo** — ficam para uma task futura.

1. Gere um pedido em dinheiro pelo Totem (ver seção anterior) e abra `/caixa`: o card aparece com o botão "Confirmar dinheiro" e um campo opcional "Observação".
2. Clique em "Confirmar dinheiro": aparece um `window.confirm` pedindo confirmação (ex.: "Confirmar pagamento em dinheiro do pedido A1?"). Cancelar a confirmação não dispara nenhuma chamada.
3. Confirme. O botão mostra "Aguarde..." durante a chamada a `POST /api/caixa/pedidos/{id}/confirmar-pagamento` (corpo: apenas `{"observacao": "..."}` ou `{}` se o campo ficou vazio). Ao terminar, a lista é recarregada automaticamente e aparece a mensagem "Pagamento em dinheiro do pedido A1 confirmado." acima da lista.
4. O mesmo pedido continua na lista, agora com status "Pagamento confirmado" e o botão "Enviar para cozinha" (o backend passou `acaoSugerida` de `CONFIRMAR_PAGAMENTO` para `ENVIAR_PARA_COZINHA`).
5. Em outra aba com um dispositivo TOTEM ativado, abra o acompanhamento desse mesmo pedido (`/totem`, tela pós-pagamento) e clique em "Atualizar status": o status passa a `PAGO`, refletindo a confirmação feita no Caixa.
6. De volta ao Caixa, clique em "Enviar para cozinha": aparece um `window.confirm` (ex.: "Enviar o pedido A1 para a cozinha?"). Confirme — o botão mostra "Aguarde..." durante `POST /api/caixa/pedidos/{id}/enviar-cozinha` (sem corpo). Ao terminar, a lista recarrega e o pedido **sai** da lista de pendências, com a mensagem "Pedido A1 enviado para a cozinha.".
7. No Totem, atualize o acompanhamento do mesmo pedido: o status passa a `ENVIADO_PARA_COZINHA`.
8. Gere um novo pedido pelo Totem e pague com **Pix** ou **cartão**: ele já aparece direto no Caixa com `acaoSugerida=ENVIAR_PARA_COZINHA` (sem passar por "Confirmar dinheiro"); confirme que "Enviar para cozinha" funciona normalmente para ele também.
9. Para simular erro 400, tente reenviar o mesmo pedido para a cozinha depois que ele já saiu da lista (ex.: chame `POST /api/caixa/pedidos/{id}/enviar-cozinha` de novo pelo `docs/http` com o mesmo `pedidoId`, já `ENVIADO_PARA_COZINHA`) — se reproduzir a ação pela UI de outra forma, a mensagem de erro do backend aparece dentro do card correspondente, sem travar o restante da lista.
10. Para simular erro de permissão, acesse `/caixa` com um token de TOTEM ou COZINHA: a lista sequer chega a ser exibida (erro de acesso já tratado no carregamento — ver seção anterior).
11. Para simular sessão expirada durante uma ação, edite `totem.accessToken` no DevTools para um valor inválido e clique em "Confirmar dinheiro" ou "Enviar para cozinha": aparece mensagem de sessão expirada e o botão "Ir para ativação de dispositivo", substituindo a lista.
12. Alterne o tema (💡) com um card em estado de carregamento (`Aguarde...`) e com a mensagem de sucesso visível — cores e bordas devem seguir os tokens do Design System nos dois temas.

## Cliente HTTP e sessão

- `src/services/api.ts` — `apiFetch<T>(path, options)`: wrapper sobre `fetch`, monta a URL com `VITE_API_BASE_URL`, serializa o `body` como JSON, anexa `Authorization: Bearer <token>` automaticamente (via `tokenStorage`) quando há um token salvo e `withAuth` não é `false`, e lança `ApiError` (ver `src/types/api.ts`) em respostas não-2xx com o corpo de erro padrão do backend (`ApiErrorResponse`: `status`, `error`, `message`, `errors`). `api.get/post/put/patch/delete` são atalhos por verbo HTTP.
- `src/services/tokenStorage.ts` — único lugar que lê/escreve `localStorage` (chaves `totem.accessToken`, `totem.dispositivo`). **Não é um fluxo de autenticação completo**: sem refresh token, sem expiração tratada, sem contexto de sessão React — aceitável para este estágio do MVP, deve ser revisado se o projeto migrar para um fluxo mais robusto (ex.: cookies httpOnly).
- `src/services/authService.ts` — funções que chamam os endpoints de autenticação (hoje: `ativarDispositivo`). Páginas nunca chamam `api.ts`/`fetch` diretamente, sempre por um `*Service.ts`.

## Design System e temas

A partir da TASK-030 o frontend tem um Design System documentado em [`docs/design-system/`](../docs/design-system/README.md) (na raiz do repositório) — leia antes de criar qualquer tela nova.

- **Dois temas**: `dark` (Dark & Bold — Oswald + DM Sans, vermelho `#E63329`) e `light` (Clean & Warm — Sora + Plus Jakarta Sans, laranja `#E8440A`). Tema padrão: `dark`.
- **Como alternar**: clique no ícone 💡 (`ThemeToggle`), presente no cabeçalho de toda página (`ModuleHeader`/`AppLayout`).
- **Onde ficam os tokens**: `src/styles/tokens.css` (forma/espaçamento/tipografia/movimento, iguais nos dois temas) e `src/styles/themes.css` (cor e fonte, por tema, via atributo `data-theme` em `<html>`). Ambos são importados por `src/styles/global.css`.
- **Persistência**: `localStorage` na chave `totem.theme` (`"dark"` ou `"light"`) — separada da sessão de autenticação (`tokenStorage.ts`), pois é preferência de interface, não dado de login.
- **Estado/lógica**: `src/contexts/ThemeContext.tsx` (`ThemeProvider`, montado em `App.tsx`) + `src/hooks/useTheme.ts`.
- **Como criar uma tela nova seguindo o padrão**: veja o passo a passo em [`docs/design-system/guia-uso-frontend.md`](../docs/design-system/guia-uso-frontend.md) — resumo: sempre `AppLayout`, sempre `var(--color-*)`/`var(--font-*)` (nunca hex fixo), sempre um `*Service.ts` para chamadas HTTP, sempre tratar loading/erro/sucesso.

## Tipos (`src/types/`)

Espelham os DTOs REST do backend (ver `docs/09-contratos-api.md` e `docs/08-endpoints.md`):

- `api.ts` — `ApiError`, `ApiErrorResponse`
- `auth.ts` — login e ativação de dispositivo
- `totem.ts` — cardápio, criação/consulta de pedido, pagamento
- `caixa.ts` — pendências, confirmação de dinheiro, cancelamento
- `cozinha.ts` — listagem e atualização de status

São tipos básicos o suficiente para as próximas tasks usarem — não incluem validação de formulário nem lógica de negócio.

## PWA

`index.html` já referencia `public/manifest.webmanifest` (nome, cores, `display: standalone`) e inclui `theme-color`. **Não há service worker configurado** — isso exigiria `vite-plugin-pwa` ou configuração manual de cache/offline, o que é uma dependência/infra adicional fora do escopo desta task. Fica como próxima task quando o PWA precisar funcionar offline ou ser instalável de verdade.

## Próximas tasks sugeridas

1. Marcar retirada (`POST /api/caixa/pedidos/{id}/retirar`) e cancelar (`POST /api/caixa/pedidos/{id}/cancelar`) no Caixa — confirmar dinheiro e enviar à cozinha já foram implementados na TASK-037; retirada/cancelamento ficam para uma task futura (retirada só faz sentido depois que a Cozinha marcar `PRONTO`).
2. Frontend da Cozinha (`/cozinha`): listar pedidos e atualizar status (`EM_PREPARO`/`PRONTO`).
3. Login administrativo real (`POST /api/auth/login`), reaproveitando `Button`/`Input`/`ErrorMessage` e o padrão de `authService.ts`.
4. Proteção de rotas (redirecionar para `/ativar-dispositivo` ou `/admin/login` quando não há sessão válida) — hoje qualquer rota é acessível sem token.
5. Service worker / instalabilidade PWA completa.
