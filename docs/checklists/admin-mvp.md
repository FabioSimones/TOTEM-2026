# Checklist — Frontend Administrativo do MVP

Criado na TASK-047 (revisão do frontend administrativo). Complementa [`checklists/checklist-mvp.md`](../../checklists/checklist-mvp.md) e [`docs/checklists/fluxo-operacional-mvp.md`](fluxo-operacional-mvp.md) com passos concretos para validar manualmente o painel `/admin` numa máquina limpa.

Ver a seção "Ordem recomendada de uso do Admin" em `frontend/README.md` para o porquê desta ordem — cada cadastro depende do anterior.

**TASK-081 (Fase 13 — Consolidação de testes e qualidade)**: auditoria completa da coerência entre este checklist, `docs/08-endpoints.md`/`09-contratos-api.md` e o código real — nenhuma divergência de endpoint encontrada. Cobertura de teste ausente encontrada e corrigida em `RestauranteService` (nunca tinha teste dedicado). Ver `docs/status-mvp.md` para o relatório consolidado do estado do MVP e a lista completa de pendências (críticas/importantes/melhorias).

**TASK-082**: fechou a pendência importante de `/api/admin/uploads/**` sem teste HTTP de autorização, registrada na TASK-081. `integration/UploadAdminIntegrationTest` (9 testes) cobre via MockMvc real: upload sem token (`401`), `SUPER_ADMIN`/`ADMIN_RESTAURANTE` com PNG válido (`201`, arquivo gravado em disco), `OPERADOR_CAIXA`/`OPERADOR_COZINHA` (`403`), magic bytes inválidos (`400`), acesso público ao arquivo salvo em `/uploads/**` sem token (`200`), e a autorização de `limpar-orfas` (`SUPER_ADMIN` apenas). Nenhum bug de produção encontrado — a cadeia de autorização/multipart/acesso público já funcionava exatamente como documentado.

## 1. Preparação

- [ ] Backend rodando: `cd backend && mvn spring-boot:run`
- [ ] Frontend rodando: `cd frontend && npm run dev`
- [ ] Abrir `http://localhost:5173/admin` **sem** sessão salva → redireciona para `/admin/login`

## 2. Login administrativo

- [ ] `/admin/login` com campos vazios → não chama o backend, mostra "Informe e-mail e senha."
- [ ] Login inválido → mensagem amigável (401), sem revelar se foi e-mail ou senha
- [ ] Login com o `SUPER_ADMIN` configurado via bootstrap (TASK-096 — `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`, não mais `admin@totem.local`/`Admin@2026!` fixo) → redireciona para `/admin`, mostra nome/e-mail/perfil
- [ ] Recarregar `/admin` (F5) → sessão persiste
- [ ] Botão "Sair" → limpa sessão e volta para `/admin/login`
- [ ] Errar a senha repetidamente (padrão: 5 vezes seguidas para o mesmo e-mail) → a partir da 6ª tentativa, `429` "Muitas tentativas de login. Tente novamente mais tarde." (rate limiting, TASK-065) — ver seção 9f

## 3. Restaurante (`/admin/restaurantes`)

- [ ] Acessar via card "Restaurantes" em `/admin`, ou link "← Painel administrativo" para voltar
- [ ] Lista vazia mostra "Nenhum restaurante cadastrado."
- [ ] Criar restaurante com campos vazios → validação client-side, sem chamar o backend
- [ ] Criar restaurante válido (nome + CNPJ de 14 dígitos) → `POST /api/admin/restaurantes`, aparece na lista com `id` (anotar para os próximos passos)
- [ ] Editar restaurante → `PUT`, lista atualizada
- [ ] Desativar → `PATCH .../desativar`; Ativar → `PATCH .../ativar`
- [ ] Login com usuário `ADMIN_RESTAURANTE` (se houver) → 403 "Você não tem permissão para acessar restaurantes.", sessão preservada

## 4. Categoria (`/admin/categorias`)

- [ ] Sem restaurante cadastrado → aviso "Cadastre um restaurante antes de criar categorias."
- [ ] Criar categoria vinculada ao restaurante do passo 3 → `POST /api/admin/categorias`, sem campo `ativa` no request
- [ ] Filtrar por restaurante no topo → `GET .../categorias?restauranteId=`
- [ ] Editar categoria → `PUT`, restaurante fixo (não editável)
- [ ] Inativar categoria → `DELETE`, badge vira "Inativa", sem botão de reativar

## 5. Produto (`/admin/produtos`)

- [ ] Sem categoria para o restaurante selecionado → aviso "Cadastre uma categoria para este restaurante antes de criar produtos."
- [ ] Criar produto (nome, categoria, preço > 0) → `POST /api/admin/produtos`
- [ ] Preço vazio ou ≤ 0 → bloqueado no cliente, sem chamar o backend
- [ ] Editar produto → `PUT`, sem `disponivel`/`destaque` no corpo (confirmar no Network)
- [ ] Alternar disponibilidade → `PATCH .../disponibilidade`
- [ ] Alternar destaque → `PATCH .../destaque`

## 6. Validar produto no Totem

- [ ] Ativar dispositivo TOTEM do restaurante cadastrado (ver seção 7 abaixo se ainda não existir um)
- [ ] Abrir `/totem` → produto disponível aparece na categoria correta, com selo "Destaque"/"Recomendado" quando marcado
- [ ] Marcar produto como indisponível no Admin → recarregar `/totem` → produto some
- [ ] Marcar como disponível novamente → produto reaparece

## 7. Dispositivo (`/admin/dispositivos`)

- [ ] Sem restaurante cadastrado → aviso "Cadastre um restaurante antes de criar dispositivos."
- [ ] Criar dispositivo selecionando o restaurante visualmente (passo 3), nome, código de identificação e tipo
- [ ] Copiar o `codigoAtivacao` gerado (botão "Copiar")
- [ ] Abrir `/ativar-dispositivo` em outra aba, colar o código → dispositivo ativa e redireciona conforme o tipo
- [ ] Voltar a `/admin/dispositivos` e atualizar a lista → "Ativado pelo dispositivo: Sim"
- [ ] Editar dispositivo → `PUT`, restaurante fixo (não editável), `codigoAtivacao` não é enviado nem muda
- [ ] Revogar dispositivo → `PATCH .../revogar`, status "Revogado"
- [ ] Tentar reativar em `/ativar-dispositivo` com o mesmo código → falha (dispositivo revogado)
- [ ] Reativar pelo Admin → `PATCH .../ativar`, status volta a "Ativo"
- [x] (TASK-077, validado via API real na TASK-078) Dispositivo recém-cadastrado, ainda não ativado → `statusOperacional=NUNCA_USADO`, `ultimoAcesso=null` (badge "Nunca usado" / "Último acesso: Nunca acessou" no frontend, confirmado por revisão de código)
- [x] (TASK-077, validado via API real na TASK-078) Após ativar → `statusOperacional=USADO_RECENTEMENTE`, `ultimoAcesso` preenchido com data/hora (dispositivo de teste criado e ativado na validação: `ultimoAcesso` passou de `null` para o timestamp da ativação)
- [x] (TASK-077, validado via dados reais já existentes no banco na TASK-078) Dispositivo usado há mais de `online-recente-minutos` (5min) aparece como `ATIVO`, não `USADO_RECENTEMENTE`, mesmo com `ativo=true` — confirmado em 6 dispositivos de tasks anteriores (ativados há dias)
- [x] (TASK-077, validado via API real na TASK-078) Revogar dispositivo → `statusOperacional=REVOGADO`; reativar → volta a `USADO_RECENTEMENTE`/`ATIVO` conforme o `ultimoAcesso`
- [ ] (TASK-077) Filtros "Filtrar por tipo" e "Filtrar por status" (client-side, sobre a lista já carregada) — validados por revisão de código na TASK-078 (comparação exata com os valores de enum retornados pela API, sem duplicar lógica), clique real na UI não realizado — sem automação de navegador disponível neste ambiente

## 8. Usuário (`/admin/usuarios`, exige `SUPER_ADMIN`)

- [ ] Sem restaurante cadastrado e perfil diferente de SUPER_ADMIN → aviso "Cadastre um restaurante antes de criar usuários que não sejam SUPER_ADMIN."
- [ ] Criar usuário `OPERADOR_CAIXA` vinculado ao restaurante do passo 3 → `POST /api/admin/usuarios`, sem campo `ativo` no request, senha nunca aparece na resposta
- [ ] Editar usuário → `PUT`, sem campo de senha no formulário de edição
- [ ] Desativar usuário → `PATCH .../desativar`; Ativar → `PATCH .../ativar`
- [ ] Tentar desativar o próprio usuário autenticado → `400` "Você não pode desativar o seu próprio usuário."
- [ ] Fazer login com o usuário desativado → falha com "Email ou senha inválidos"
- [ ] Login com usuário `ADMIN_RESTAURANTE` (se houver) → 403 "Você não tem permissão para acessar usuários.", sessão preservada
- [ ] Clicar em "Alterar senha" no card de um usuário → bloco inline abre com "Nova senha"/"Confirmar nova senha"
- [ ] Confirmar com senha < 8 caracteres ou confirmação diferente → validação client-side, sem chamar o backend
- [ ] Confirmar com senhas iguais e válidas → `PATCH .../senha`, bloco fecha, mensagem de sucesso
- [ ] Sair e fazer login com o usuário alterado e a nova senha → login funciona; senha antiga falha
- [ ] Confirmar que a senha não aparece em nenhuma resposta nem em `localStorage` (DevTools → Network/Application)

## 9. Erros esperados (401/403/404/400)

- [x] Editar `totem.accessToken` no DevTools para um valor inválido e tentar qualquer ação → sessão expirada, botão "Ir para login", sessão limpa — **confirmado via curl na TASK-062** (backend real responde `401` para token inválido); comportamento do código do frontend (`clearSession()` + `error.status === 401`) revisado e idêntico nas 5 páginas administrativas
- [ ] Acessar qualquer subtela do Admin com token de dispositivo (Totem/Caixa/Cozinha) → 403 amigável, sessão preservada
- [ ] CNPJ duplicado, nome de categoria duplicado no mesmo restaurante, `codigoIdentificacao` de dispositivo duplicado → 400 amigável no formulário
- [ ] Restaurante/categoria/dispositivo/usuário com ID inexistente → 404 amigável
- [ ] Email de usuário duplicado → 400 amigável no formulário

## 9b. Escopo por restaurante para ADMIN_RESTAURANTE (TASK-058, backend)

**Validado via API na TASK-060** (2026-07-10), com backend real rodando: restaurante 1 (existente) e restaurante 2 (criado para o teste), usuário `admin.r1@totem.local` (`ADMIN_RESTAURANTE`, vinculado ao restaurante 1).

- [x] Login como `ADMIN_RESTAURANTE` do restaurante A, `GET /api/admin/categorias` sem `restauranteId` → retorna só categorias do restaurante A (nunca todas)
- [x] `GET /api/admin/categorias?restauranteId=<B>` → `403`
- [x] `POST /api/admin/categorias` com `restauranteId=<B>` → `403`
- [x] `PUT`/`DELETE` em categoria do restaurante B → `403`; no restaurante A → sucesso normal
- [x] Repetir os 4 passos acima para `/api/admin/produtos` (incluindo `PATCH .../disponibilidade` e `.../destaque`) — incluindo o caso extra `restauranteId=A` + `categoriaId` de B → `400` "categoria não pertence ao restaurante informado" (não `403`, comportamento correto e distinto)
- [x] Repetir para `/api/admin/dispositivos` (`GET` sem filtro já restringe ao restaurante A; `POST`/`PUT`/`PATCH .../revogar` no restaurante B → `403`)
- [x] `SUPER_ADMIN` continua acessando/alterando livremente categorias/produtos/dispositivos de A e B
- [x] ~~`/api/admin/usuarios` continua bloqueado para `ADMIN_RESTAURANTE` (403), sem exceção~~ **alterado na TASK-090**: `ADMIN_RESTAURANTE` passou a gerenciar `OPERADOR_CAIXA`/`OPERADOR_COZINHA` do próprio restaurante — ver seção 14 abaixo para o detalhamento completo do novo escopo
- [x] Upload de imagem (`POST /api/admin/uploads/produtos/imagem`) continua funcionando para `ADMIN_RESTAURANTE` normalmente (`201`, sem checagem de restaurante); limpeza de órfãos (`limpar-orfas`) confirmada `403` para `ADMIN_RESTAURANTE`
- [x] Todos os `403` acima preservam a sessão — chamada seguinte com o mesmo token a um recurso do próprio restaurante continua `200`

Todos os cenários passaram sem exceção — nenhum bug encontrado no backend.

## 9c. Escopo por restaurante — experiência visual no frontend (TASK-059)

**Revisado por leitura de código na TASK-060** (não houve automação de navegador disponível para clicar de fato na UI — recomenda-se uma passada manual rápida para confirmação visual final). O código de `AdminCategoriasPage`/`AdminProdutosPage`/`AdminDispositivosPage`/`AdminHomePage` e dos 3 forms foi conferido linha a linha e implementa exatamente o descrito abaixo; combinado com a validação de API (9b, que exercita a mesma lógica de backend que a UI consome), a confiança é alta.

- [x] (por revisão de código) Login como `ADMIN_RESTAURANTE` do restaurante A → em `/admin`, card "Restaurantes" **não aparece** (`apenasSuperAdmin`); ~~card "Usuários" também não aparecia~~ **a partir da TASK-090, "Usuários" aparece para `ADMIN_RESTAURANTE`** (só some para `OPERADOR_CAIXA`/`OPERADOR_COZINHA`, via `ocultarParaOperador` — ver seção 14); aviso "Você está operando apenas no restaurante vinculado à sua conta." visível
- [x] (por revisão de código) `/admin/categorias`: `carregarRestaurantes` retorna cedo sem chamar a API quando `adminRestaurante`; sem seletor "Filtrar por restaurante"; formulário mostra "Restaurante" fixo como "Restaurante vinculado à sua conta"; `carregarCategorias(restauranteIdEscopo)` já filtra a lista
- [x] (por revisão de código) Cadastrar categoria: `onCriar` usa `restauranteFixo?.id ?? restauranteId`, sempre o do usuário — nenhum estado local permite outro valor
- [x] (por revisão de código) Repetido para `/admin/produtos` (formulário fixo, `categoriasDoRestaurante` filtradas por `restauranteFixo.id`) e `/admin/dispositivos` (formulário fixo)
- [x] Acessar `/admin/usuarios` digitando a URL diretamente → mensagem "Você não tem permissão para acessar usuários." (403), sessão preservada, sem redirecionar para login — **backend confirmado via curl na TASK-062** (`ADMIN_RESTAURANTE` → `403` em `/api/admin/usuarios`); código do frontend revisado e idêntico às outras páginas. Clique real na UI ainda não realizado (sem automação de navegador disponível).
- [x] (por revisão de código) Login como `SUPER_ADMIN` → todos os 5 cards aparecem em `/admin`; as 3 páginas mantêm seletor de restaurante completo (branch `restauranteFixo` não ativa)
- [x] ~~Token inválido/expirado retornava `403`, não `401`~~ **corrigido de verdade na TASK-061, confirmado com backend real na TASK-062** (`RestAuthenticationEntryPoint`) — validado por `security/SecurityHttpStatusTest` (MockMvc) e por `curl` direto (ver seção 9d). O branch de "sessão expirada" das páginas administrativas (`error.status === 401`) agora é acionado corretamente para token ausente/inválido/expirado; `403` continua reservado a autenticado-sem-permissão.

## 9d. Validação do fluxo 401/403 com backend e frontend reais (TASK-062)

**Validado via `curl` contra o backend real** (2026-07-10), após recompilar com as correções da TASK-061/062:

- [x] `GET /api/admin/usuarios` sem token → `401`, `{"error":"Não autenticado","message":"Autenticação necessária ou token inválido",...}`
- [x] `GET /api/admin/usuarios` com `Authorization: Bearer invalido` → `401`, mesmo corpo
- [x] `GET /api/admin/usuarios` com token válido de `ADMIN_RESTAURANTE` → `403`, `{"error":"Acesso negado","message":"Você não tem permissão para executar esta ação",...}`
- [x] `GET /api/health` → `200`
- [x] `GET /uploads/produtos/arquivo-inexistente.png` → `404` (nunca `401`/`403`/`500`)
- [x] **Bug encontrado e corrigido nesta task**: a resposta `401` saía com `charset=ISO-8859-1` (acentos corrompidos: "Não autenticado" virava bytes inválidos), enquanto o `403` (via `GlobalExceptionHandler`/Spring MVC) já saía em UTF-8 corretamente. Corrigido com `response.setCharacterEncoding("UTF-8")` em `RestAuthenticationEntryPoint`; teste automatizado ganhou asserção de `Content-Type`/encoding/corpo para não regredir.

**Validação do frontend**: sem ferramenta de automação de navegador disponível neste ambiente, não cliquei de fato na UI. Em vez disso, confirmei que o código das 5 páginas administrativas (`AdminRestaurantesPage`, `AdminCategoriasPage`, `AdminProdutosPage`, `AdminDispositivosPage`, `AdminUsuariosPage`) já trata `error.status === 401` (limpa sessão, "Sessão expirada...") e `error.status === 403` (preserva sessão, "Você não tem permissão...") de forma idêntica e correta — o `apiFetch` de `services/api.ts` propaga o `status` HTTP real da resposta, então, com o backend agora corrigido, o comportamento visual deve seguir exatamente esse padrão. Uma conferência manual rápida no navegador (login → editar `totem.accessToken` no DevTools → clicar "Atualizar lista") ainda é recomendada para fechar 100%.

## 9e. Refresh token e logout administrativo (TASK-064)

**Validado via `curl` contra o backend real** (2026-07-10), reaproveitando o usuário seed `admin@totem.local` e o `ADMIN_RESTAURANTE` `admin.r1@totem.local` criado em tasks anteriores.

- [x] Login → response com `accessToken`, `refreshToken`, `tokenType=Bearer`, `expiresIn`, `refreshExpiresIn`, `usuario` preenchido, sem campo de senha
- [x] `POST /api/auth/refresh` com o `refreshToken` do login → `200`, novo `accessToken`/`refreshToken` (diferente do anterior), `usuario` preenchido
- [x] Reuso do `refreshToken` já rotacionado → `401` ("Refresh token inválido ou expirado")
- [x] `POST /api/auth/logout` com `refreshToken` atual → `204 No Content`; tentativa de refresh com esse token depois → `401`
- [x] Login novo do mesmo usuário revoga o `refreshToken` da sessão anterior: refresh com o token antigo → `401`; refresh com o token da sessão nova → `200`
- [x] `ADMIN_RESTAURANTE` acessando `/api/admin/usuarios` → `403` (não `401`); confirmado que o `refreshToken` dessa sessão continua válido logo depois (refresh → `200`) — um `403` não mexe na sessão
- [x] Upload de imagem (`multipart/form-data`) via `curl` direto no endpoint → `201`, continua funcionando normalmente (o endpoint em si não foi alterado nesta task)

**Achado real e corrigido nesta task — condição de corrida em `RefreshTokenService.validarERevogar`**: disparando duas chamadas `POST /api/auth/refresh` em paralelo com o **mesmo** `refreshToken` (simulando duas abas com o mesmo `accessToken` expirado), a implementação original (SELECT depois UPDATE em passos separados) permitiu que **ambas tivessem sucesso** em 5 de 5 repetições — violando a regra de "um refresh ativo por usuário" e desperdiçando a semântica de uso único. Corrigido com um `UPDATE` atômico condicional (`RefreshTokenRepository.revogarSeAtivo`), que usa o lock de linha do Postgres para serializar as duas transações. Reconfirmado empiricamente após a correção: **10 de 10 repetições** com exatamente um sucesso (`200`) e uma rejeição limpa (`401`), sem erro 500 nem estado corrompido. Novo teste automatizado: `RefreshTokenServiceTest.validarERevogar_duasChamadasConcorrentesComMesmoToken_apenasUmaDeveSerAceita`.

**Validação do frontend (`api.ts`, `authService.ts`, `tokenStorage.ts`, `AdminHomePage.tsx`)**: sem automação de navegador disponível neste ambiente, feita por revisão de código linha a linha (não clique real na UI):

- [x] `saveUserSession` grava `accessToken`+`refreshToken`+`usuario` no `localStorage`; nenhum campo de senha é tocado em nenhum ponto do fluxo
- [x] `apiFetchInternal` só tenta renovar em `response.status === 401 && withAuth && !jaTentouRenovar` — nunca em `403` (item 12 da task: 403 não deve tentar refresh) e nunca nas chamadas de `login`/`refresh`/`logout`/`ativar-dispositivo` (todas usam `withAuth: false`, então ficam fora do fluxo de retry por construção, sem precisar checar path)
- [x] Em caso de renovação bem-sucedida, a chamada original é repetida automaticamente (`apiFetchInternal(path, options, true)`) — `jaTentouRenovar=true` garante no máximo uma tentativa, sem loop infinito
- [x] Em caso de falha na renovação, `clearSession()` é chamado antes do erro original (401) ser lançado — a tela recebe o mesmo erro de sempre e trata normalmente (idempotente com a limpeza que o próprio `api.ts` já fez)
- [x] `refreshEmAndamento` (guarda de concorrência) evita que 401s concorrentes **na mesma aba** disparem duas renovações — chamadas concorrentes aguardam a mesma promise. **Isso não protege entre abas diferentes** (cada aba tem sua própria instância do módulo JS, logo seu próprio `refreshEmAndamento`) — é exatamente por isso que a correção do backend (`revogarSeAtivo`) é a proteção real contra a corrida entre abas, não o guard do frontend
- [x] `handleSair` (`AdminHomePage`) chama `authService.logout()` antes de `clearSession()`; falha do backend (rede indisponível, token já expirado) é capturada e ignorada — a sessão local é sempre limpa
- [x] FormData (upload de imagem) continua intacto: `body instanceof FormData` é reavaliado em cada chamada (inclusive na retentativa pós-refresh), e o mesmo objeto `FormData` é reenviado sem problema (não é um stream consumível)

**Pendência**: clique real na UI (duas abas de verdade, DevTools/Local Storage) não foi realizado por falta de automação de navegador neste ambiente. A cobertura por `curl` (que exercita exatamente a mesma API que o frontend consome) mais a revisão de código dão confiança alta, mas uma conferência visual manual continua recomendada para fechar 100%.

## 9f. Rate limiting do login administrativo (TASK-065, validado manualmente na TASK-066)

**Coberto por testes automatizados** (`LoginAttemptServiceTest`, 9 testes unitários com `Clock` controlado; `AuthLoginRateLimitTest`, 5 testes MockMvc de ponta a ponta) e **validado via `curl` contra o backend real** (2026-07-10) — ver `docs/09-contratos-api.md` seção "Rate limiting do login administrativo" para o contrato completo.

- [x] Login correto (`admin@totem.local`) antes de qualquer falha → `200`, `accessToken`+`refreshToken`+`usuario`, sem senha na resposta
- [x] 5 tentativas com senha errada para o mesmo e-mail → `401` em todas, corpo `{"error":"Não autenticado","message":"Email ou senha inválidos",...}` — idêntico ao 401 de e-mail inexistente (não vaza se o e-mail existe)
- [x] 6ª tentativa → `429`, corpo `{"error":"Muitas tentativas","message":"Muitas tentativas de login. Tente novamente mais tarde."}`, header `Retry-After` presente (`881`s, ~ tempo restante do bloqueio de 15min)
- [x] Senha **correta** durante o bloqueio → ainda `429` com `Retry-After`, sem `accessToken`/`refreshToken` — backend nem chega a validar a senha
- [x] Chave é por e-mail — `admin.r1@totem.local` (mesmo IP, sem tentativas próprias) → `401` normal, não afetado pelo bloqueio de `admin@totem.local`
- [x] Refresh/logout não afetados pelo bloqueio do usuário: `POST /api/auth/refresh` com o `refreshToken` obtido antes do bloqueio → `200`, novo par de tokens; `POST /api/auth/logout` com o token rotacionado → `204`; refresh subsequente com o token revogado → `401` (comportamento de sempre, sem regressão)
- [x] (automatizado, unitário com `Clock` manual) Bloqueio expira exatamente após `block-minutes`, não antes; login correto zera o contador (`LoginAttemptServiceTest`)
- [ ] Reset do contador após sucesso **não foi reexercitado manualmente** nesta task: exigiria esperar os `block-minutes` reais (15min) ou alterar a configuração só para o teste, o que a task pediu para evitar. Coberto por `LoginAttemptServiceTest.bloqueioDeveExpirarAposBlockMinutos`/`sucessoDeveLimparContadorDeFalhas`.
- [x] (por revisão de código) Frontend (`AdminLoginPage.tsx` + `services/api.ts`): `429` não entra no fluxo de retry-via-refresh (só `401` aciona), cai direto no `catch` e exibe `error.message` via `ErrorMessage` — mesma mensagem do backend, sem quebrar a tela. Clique real na UI não foi realizado (sem automação de navegador disponível neste ambiente); revisão de código combinada com os resultados de `curl` acima dá confiança alta de que o comportamento visual é o esperado.

## 9g. Listagem administrativa de pedidos (`/admin/pedidos`, TASK-068, validado manualmente na TASK-069)

**Coberto por teste automatizado** (`integration/PedidoAdminIntegrationTest`, 10 testes MockMvc via HTTP real) e **validado via `curl` contra o backend real** (2026-07-10) — ver `docs/testes-backend-mvp.md` e `docs/09-contratos-api.md` seção "Admin — Pedidos". Dados de teste: 2 restaurantes, 4 pedidos (`RETIRADO`, `AGUARDANDO_PAGAMENTO_DINHEIRO`, `PAGO` em restaurante A, `PAGO` em restaurante B), 1 `ADMIN_RESTAURANTE` real vinculado ao restaurante A, 1 `OPERADOR_CAIXA` real.

- [x] `SUPER_ADMIN` lista pedidos de todos os restaurantes (4/4, ordenados do mais recente ao mais antigo)
- [x] `SUPER_ADMIN` filtra por `restauranteId` (isola corretamente cada restaurante) e por `statusPedido` (`RETIRADO` retornou só o pedido esperado)
- [x] Filtro combinado sem nenhum resultado (`restauranteId` de B + `statusPedido=RETIRADO`) → `200` com `[]` (estado vazio)
- [x] `statusPedido` inválido → `400`, mensagem já lista os valores aceitos
- [x] `ADMIN_RESTAURANTE` lista apenas pedidos do próprio restaurante (3/3, nenhum do restaurante B)
- [x] `ADMIN_RESTAURANTE` filtrando `restauranteId` do próprio → `200`; do outro restaurante → `403`
- [x] Detalhe do pedido retirado retorna itens, pagamentos e histórico completo (6 transições: `CRIADO`→`PAGO`→`ENVIADO_PARA_COZINHA`→`EM_PREPARO`→`PRONTO`→`RETIRADO`, cada uma com o dispositivo que alterou)
- [x] `ADMIN_RESTAURANTE` não acessa detalhe de pedido de outro restaurante (`403`), mas acessa o do próprio normalmente — e o mesmo token continua `200` logo depois do `403` (sessão preservada, sem revogação colateral)
- [x] Pedido inexistente → `404`; sem token → `401`; perfil operacional (`OPERADOR_CAIXA`) → `403`
- [x] Card "Pedidos" aparece em `/admin` tanto para `SUPER_ADMIN` quanto para `ADMIN_RESTAURANTE` (confirmado por leitura de código: sem `apenasSuperAdmin` no card, ao contrário de "Restaurantes"/"Usuários")
- [x] (por revisão de código, cruzada com os resultados de `curl` acima) `AdminPedidosPage`: `ADMIN_RESTAURANTE` nunca chama `GET /api/admin/restaurantes` (`carregarRestaurantes` retorna cedo) nem mostra seletor de restaurante; `mostrarRestaurante={!adminRestaurante}` esconde a coluna "Restaurante" nos cards para esse perfil; `401` limpa a sessão (`clearSession()` + botão "Ir para login"), `403` preserva a sessão e mostra mensagem amigável — igual ao padrão das demais telas administrativas
- [ ] Clique real na UI (login no navegador, alternar filtros, abrir/fechar detalhe, alternar tema) não foi realizado — sem automação de navegador disponível neste ambiente; a validação via `curl` exercita exatamente a mesma API que o frontend consome, e o código foi revisado linha a linha, mas uma conferência visual manual rápida continua recomendada para fechar 100%

Nenhum bug encontrado — nenhuma alteração de código foi necessária nesta task.

**Fora do escopo desta task**: edição de pedido, alteração de status pelo Admin, cancelamento pelo Admin, exportação. **Paginação implementada na TASK-072** — ver seção 9i abaixo.

## 9h. Expiração automática de pedidos não pagos (TASK-070, validado com backend real na TASK-071)

**Coberto por testes automatizados** (`PedidoExpiracaoServiceTest`, unitário com `Clock` controlado, 14 testes; `PedidoAdminIntegrationTest`, casos `expirarVencidos_*` via HTTP real, H2) e **validado com backend real + PostgreSQL real na TASK-071** (2026-07-11). Ver `docs/09-contratos-api.md` seção "Admin — Expiração de pedidos" e `docs/testes-backend-mvp.md` (seção "Pendências de produto") para o detalhamento completo.

- [x] Criar pedido no Totem e **não pagar** → status permanece `CRIADO` (pedido A5, restaurante 1)
- [x] Job automático (`PEDIDO_EXPIRACAO_JOB_ENABLED=true`, padrão) expirou pedidos `CRIADO` e `AGUARDANDO_PAGAMENTO_DINHEIRO` envelhecidos sozinho, sem chamada manual — confirmado pelo histórico com timestamp coincidindo com o boot da aplicação (`fixedDelay` executa a primeira vez imediatamente na subida)
- [x] `POST /api/admin/pedidos/expirar-vencidos` como `SUPER_ADMIN` → `200`, `{"pedidosExpirados": N}` (`N=0` quando o job já havia expirado tudo antes — resultado consistente com idempotência)
- [x] Sem token → `401`; `ADMIN_RESTAURANTE` → `403`; `SUPER_ADMIN` → `200`
- [x] Pedido `PAGO` (Pix, id 9) e pedido `ENVIADO_PARA_COZINHA` (id 7) envelhecidos **nunca** viraram `EXPIRADO`, nem pelo job nem pelo endpoint manual — histórico sem entrada de expiração para nenhum dos dois
- [x] `GET /api/admin/pedidos?statusPedido=EXPIRADO` retornou os 4 pedidos expirados (incluindo um pré-existente de outra task, id 2); painel Admin Pedidos consome o mesmo contrato já validado por código na TASK-070 (não clicado diretamente na UI — sem automação de navegador disponível)
- [x] Reexecutar o endpoint manual em seguida → `pedidosExpirados=0`, sem histórico duplicado (idempotência confirmada com dados reais)
- [x] **Achado operacional, não é bug**: um processo de backend de longa duração (rodando desde antes das edições da TASK-070 serem salvas) respondeu `500` nesse endpoint especificamente, por estado inconsistente de hot-swap do IDE. Reproduzido em instância nova/limpa (mesmo código, mesmo banco) → `200` normalmente. Recomendação: **sempre reiniciar o backend depois de adicionar `@Component`/`@Service`/`@Scheduled` novos**, antes de validar manualmente.

## 9i. Paginação simples em Admin Pedidos (TASK-072, validado com backend real na TASK-073)

**Coberto por testes automatizados** (`integration/PedidoAdminIntegrationTest`, 15 testes MockMvc via HTTP real, incluindo os casos de paginação) e **validado via `curl` contra o backend real + PostgreSQL real na TASK-073** (2026-07-11), com o banco já populado por tasks anteriores (9 pedidos no total, restaurante 1 com 5, distribuídos em `PAGO`/`EXPIRADO`/`ENVIADO_PARA_COZINHA`/outros). Ver `docs/09-contratos-api.md` seção "Admin — Pedidos" para o contrato completo do objeto paginado.

- [x] Login `SUPER_ADMIN`, `GET /api/admin/pedidos?page=0&size=2` → `200`, `content` com 2 itens, `page=0`, `size=2`, `totalElements=9`, `totalPages=5`, `first=true`, `last=false`
- [x] `GET /api/admin/pedidos?page=1&size=2` → `page=1`, `content` diferente da página 0 (ids 7/6 vs. 9/8), `first=false`, `last=false`
- [x] `GET /api/admin/pedidos?page=4&size=2` (última página, 9 itens/2 por página = 5 páginas) → 1 item só, `first=false`, `last=true`
- [x] `GET /api/admin/pedidos?statusPedido=EXPIRADO&page=0&size=2` → paginação respeita o filtro (`totalElements=4`, `totalPages=2`, só pedidos `EXPIRADO` no `content`)
- [x] `GET /api/admin/pedidos?restauranteId=1&page=0&size=2` → paginação respeita o filtro de restaurante (`totalElements=5`, `totalPages=3`, só pedidos do restaurante 1)
- [x] `GET /api/admin/pedidos?page=0&size=999` → `size` no response vem `100` (limitado silenciosamente, sem `400`), `totalPages=1` (9 itens cabem numa página de 100)
- [x] `GET /api/admin/pedidos?page=10&size=2` (página além do total) → `200`, `content=[]`, `last=true` — não quebra, mas ver pendência abaixo sobre a UI nesse cenário
- [x] Login `ADMIN_RESTAURANTE` (restaurante 1) sem `restauranteId` → mesmo resultado do filtro `restauranteId=1` do SUPER_ADMIN (`totalElements=5`, `totalPages=3`), confirmando que o escopo por restaurante continua aplicado antes da paginação
- [x] `ADMIN_RESTAURANTE` com `restauranteId=1` (próprio) → `200`; com `restauranteId=3` (outro restaurante existente no banco) → `403`
- [x] Detalhe (`GET /api/admin/pedidos/{id}`) segue idêntico a antes da TASK-072 — testado com o pedido 9 (`PAGO`), retornou `itens`/`pagamentos`/`historico` completos e corretos, sem paginação
- [x] Sem token → `401`; token inválido (`Bearer invalido`) → `401` — comportamento já validado em tasks anteriores, sem regressão
- [x] Ordenação padrão (`criadoEm desc`) confirmada nos 3 requests de paginação acima: ids retornados em ordem estritamente decrescente de `criadoEm`
- [x] (por revisão de código, cruzada com os resultados de `curl` acima) `AdminPedidosPage.tsx`: `carregarPedidos` sempre chama `setPedidoDetalhe(null)` antes de buscar a nova página — fecha o detalhe automaticamente ao trocar de página ou filtro; `handleFiltrarRestaurante`/`handleFiltrarStatus` sempre chamam `carregarPedidos(..., 0)` — reseta para a página 1 ao mudar qualquer filtro; botões "Anterior"/"Próxima" usam `disabled={primeiraPagina || loading}`/`disabled={ultimaPagina || loading}`, alimentados por `response.first`/`response.last` — mesma fonte de verdade do backend confirmada acima; resumo usa `pagina + 1`/`Math.max(totalPaginas, 1)`/`totalElementos`, consistente com os campos confirmados via `curl`
- [x] Estado vazio: com `content=[]` (confirmado acima no cenário `page=10`), a tela mostra "Nenhum pedido encontrado." e o bloco de paginação não aparece — comportamento correto, mas ver pendência abaixo

**Clique real na UI não foi realizado** — sem automação de navegador disponível neste ambiente (mesma limitação de todas as validações anteriores do projeto). A validação via `curl` exercita exatamente a mesma API que o frontend consome, e o código foi revisado linha a linha contra os resultados reais acima.

**Nenhum bug encontrado** — nenhuma alteração de código foi necessária nesta task.

**Pendência de UX identificada (não corrigida, fora do escopo desta task)**: se o usuário estiver numa página válida e os dados do escopo/filtro diminuírem entre o carregamento e um clique em "Atualizar lista" (ex.: outro admin cancela/expira pedidos concorrentemente), a página pode ficar além do total (`content=[]`, confirmado acima com `page=10`) — a tela mostra "Nenhum pedido encontrado." mas o bloco de paginação (que permitiria voltar) some junto, já que só renderiza com `pedidos.length > 0`. Não é alcançável pelos botões Anterior/Próxima em uso normal (ambos ficam desabilitados corretamente com base em `first`/`last`), só em cenários de dados mudando concorrentemente fora da aba atual — registrado como pendência conhecida, não como bug, já que corrigi-lo exigiria lógica nova (ex.: sempre mostrar os controles de paginação, ou reancorar automaticamente para a última página válida), fora do escopo de "somente validação" desta task.

**Resolvida na TASK-076**: `carregarPedidos` (`AdminPedidosPage.tsx`) agora detecta a resposta `content=[]` com `totalElements > 0` e `page > 0` e busca automaticamente a última página válida (`Math.max(0, totalPages - 1)`), sem intervenção do usuário. Ver seção 9i-bis abaixo.

Clique real na UI não foi realizado nesta task — sem automação de navegador disponível neste ambiente. Validado via `mvn test` (195/195, incluindo os novos cenários de paginação) e `npm run build` sem erros de tipo.

**Fora do escopo desta task**: busca textual, ordenação avançada na UI, seletor de tamanho de página, infinite scroll.

## 9i-bis. Correção de página vazia fora do intervalo em Admin Pedidos (TASK-076)

Resolve a pendência de UX registrada na seção 9i (TASK-072/073): quando `GET /api/admin/pedidos` retorna `content=[]` com `totalElements > 0` (página pedida além do total, ex.: dados diminuíram entre carregamentos ou um "Atualizar lista" concorrente), a tela ficava travada numa lista vazia sem forma de voltar pela UI (o bloco de paginação só renderiza com `pedidos.length > 0`).

**Mudança**: `carregarPedidos` (`AdminPedidosPage.tsx`) ganhou um parâmetro interno `corrigindoPagina` (default `false`). Após receber a resposta, se `response.content.length === 0 && response.totalElements > 0 && paginaAlvo > 0 && !corrigindoPagina`, a função calcula `paginaValida = Math.max(0, response.totalPages - 1)` e chama a si mesma recursivamente com `corrigindoPagina=true`, retornando antes de tocar nos estados com a resposta vazia — sem passar pelo `useEffect` (não existe um reagindo a `pagina`, cada navegação já chama `carregarPedidos` explicitamente, então não há risco de disparo duplicado). O flag `corrigindoPagina=true` garante no máximo uma correção por chamada, sem loop: mesmo num cenário teórico anômalo em que a segunda busca também viesse vazia, a recursão não seria refeita.

**Nenhuma mudança de backend, contrato de API, filtro ou regra de pedido** — o backend já retornava `content=[]`/`totalElements`/`totalPages` corretos (comportamento padrão do Spring Data `Pageable` para página além do total), não é um bug de backend.

**Validado via `curl` contra o backend real** (2026-07-12), reproduzindo exatamente o cenário da pendência:

- [x] `GET /api/admin/pedidos?page=0&size=2` → `200`, `content` com 2 itens, `totalElements=9`, `totalPages=5` (estado normal, baseline)
- [x] `GET /api/admin/pedidos?page=50&size=2` (página muito além do total) → `200`, `content=[]`, `totalElements=9`, `totalPages=5`, `page=50` — confirma a resposta exata que o frontend precisa detectar
- [x] `GET /api/admin/pedidos?page=4&size=2` (`paginaValida = Math.max(0, 5-1) = 4`, calculada pela mesma fórmula do frontend) → `200`, `content` com 1 item, `last=true` — confirma que a página calculada pelo fix sempre tem conteúdo real

**Validação de UI**: sem automação de navegador disponível neste ambiente (mesma limitação registrada em todas as seções anteriores deste checklist). `npm run build` confirmado sem erro TypeScript. Teste manual recomendado para fechar 100%: logar como SUPER_ADMIN, forçar uma página inválida via chamada direta à API com `page` alto (ou reduzir artificialmente os dados de um filtro específico e clicar "Atualizar lista" numa página não-zero), e confirmar visualmente que a tela reancora sozinha na última página válida, sem piscar em "Nenhum pedido encontrado." nem exigir ação do usuário.

**Casos preservados (por leitura de código, sem regressão)**:
- Filtros (`filtroRestauranteId`/`filtroStatus`) continuam intactos — a correção reusa os mesmos parâmetros recebidos, nunca os reseta
- `setPedidoDetalhe(null)` continua rodando em toda chamada (inclusive a recursiva) — detalhe sempre fecha
- Estado vazio real (`totalElements === 0`, filtro genuinamente sem resultados) não aciona a correção (`totalElements > 0` é condição obrigatória) — continua mostrando "Nenhum pedido encontrado." normalmente
- Paginação normal (botões Anterior/Próxima, `first`/`last`, resumo "Página X de Y") inalterada — a correção só entra no caminho anômalo

**Nenhum bug de backend encontrado — nenhuma alteração de backend nesta task.**

## 9j. Dashboard administrativo básico (TASK-074)

**Coberto por teste automatizado** (`integration/DashboardAdminIntegrationTest`, 5 testes MockMvc via HTTP real) e **validado via `curl` contra o backend real + PostgreSQL real na própria TASK-074** (2026-07-11). Ver `docs/09-contratos-api.md` seção "Admin — Dashboard" para o contrato completo e as decisões de "hoje"/`valorPagoHoje`.

- [x] `GET /api/admin/dashboard` (SUPER_ADMIN, sem filtro) → `200`, soma de todos os restaurantes (`pagosAguardandoCozinha=3`, `emOperacao=1` no banco real já populado por tasks anteriores)
- [x] `GET /api/admin/dashboard?restauranteId=1` (SUPER_ADMIN) → `200`, `restauranteNome` preenchido, contadores isolados ao restaurante 1 (`pagosAguardandoCozinha=1`, `emOperacao=1`)
- [x] `ADMIN_RESTAURANTE` (`admin.r1@totem.local`) sem filtro → resultado **idêntico** ao filtro `restauranteId=1` do SUPER_ADMIN, confirmando que o escopo é aplicado antes da agregação
- [x] `ADMIN_RESTAURANTE` com `restauranteId=3` (outro restaurante) → `403`
- [x] Sem token → `401`
- [x] `totalPedidosHoje`/`retiradosHoje`/`canceladosHoje`/`expiradosHoje`/`valorPagoHoje` retornaram `0` no banco real (nenhum pedido foi criado no dia corrente durante esta validação, já que os pedidos de teste existentes foram criados em dias anteriores) — comportamento correto, confirma que o filtro por "hoje" (`Pedido.criadoEm`) está ativo e não conta pedidos antigos; os contadores de fila operacional (`pagosAguardandoCozinha`, `emOperacao`) não são filtrados por data e vieram corretos (> 0)
- [x] (teste automatizado, dados controlados) contadores por status corretos: `pendentesPagamento`/`pagosAguardandoCozinha`/`emOperacao`/`prontosRetirada`/`retiradosHoje`/`canceladosHoje`/`expiradosHoje`/`valorPagoHoje` todos conferidos com valores exatos no `DashboardAdminIntegrationTest`, incluindo o caso de um pedido `CRIADO` retroagido para "ontem" (conta em `pendentesPagamento`, não conta em `totalPedidosHoje`)
- [x] Card "Dashboard" aparece em `/admin` tanto para `SUPER_ADMIN` quanto para `ADMIN_RESTAURANTE` (sem `apenasSuperAdmin` no card, mesmo padrão de "Pedidos")
- [x] (por revisão de código, cruzada com os resultados de `curl` acima) `AdminDashboardPage.tsx`: `ADMIN_RESTAURANTE` nunca chama `GET /api/admin/restaurantes` nem mostra seletor de restaurante; `SUPER_ADMIN` consulta sem filtro (mostra o resumo somado de todos, sem seletor visual — decisão de manter o escopo mínimo desta task); `401` limpa a sessão, `403` preserva a sessão e mostra mensagem amigável — igual ao padrão das demais telas administrativas; cards usam `formatCurrencyBRL` para `valorPagoHoje` e tokens do Design System (`.dashboard-admin__card`), sem CSS novo fora de tokens

**Clique real na UI não foi realizado** — sem automação de navegador disponível neste ambiente, mesma limitação de todas as validações anteriores do projeto.

**Nenhum bug encontrado.**

**Fora do escopo desta task**: gráficos, exportação, relatório financeiro completo, comparação por período, seletor de restaurante para SUPER_ADMIN na UI, filtro de fuso horário (contadores "hoje" usam UTC via `Clock.systemUTC()`, mesma limitação já conhecida de `PedidoExpiracaoService`).

## 9k. Validação visual manual do Dashboard Admin (TASK-075)

**Coberto por teste automatizado já existente** (`integration/DashboardAdminIntegrationTest`, 5 testes) e **revalidado via `curl` contra o backend real + PostgreSQL real** (2026-07-12), reaproveitando dados já populados por tasks anteriores (`admin@totem.local` SUPER_ADMIN, `admin.r1@totem.local` ADMIN_RESTAURANTE vinculado ao restaurante 1). `npm run build` confirmado sem erro TypeScript nesta task; `mvn test` **não foi reexecutado** nesta task (executável `mvn` fora do `PATH` deste ambiente) — resultado anterior (200/200, BUILD SUCCESS) permanece a última validação registrada, sem qualquer alteração de código de backend nesta task que pudesse invalidá-lo.

- [x] `GET /api/health` → `200`
- [x] `GET /api/admin/dashboard` (SUPER_ADMIN, sem filtro) → `200`, `restauranteId`/`restauranteNome` nulos (resumo somado de todos os restaurantes)
- [x] `GET /api/admin/dashboard?restauranteId=1` (SUPER_ADMIN) → `200`, contadores isolados ao restaurante 1
- [x] `admin.r1@totem.local` (ADMIN_RESTAURANTE do restaurante 1) sem filtro → `200`, resultado idêntico ao filtro `restauranteId=1` do SUPER_ADMIN (escopo aplicado antes da agregação)
- [x] `admin.r1@totem.local` com `restauranteId=2` (outro restaurante) → `403`, corpo `ApiError` padrão
- [x] Mesmo token, chamada seguinte sem filtro → `200` novamente — sessão preservada após o `403` (não revogada/corrompida)
- [x] Sem token → `401`, corpo `ApiError` padrão
- [x] **Comparação com `/admin/pedidos`**: `pagosAguardandoCozinha=1` no dashboard do restaurante 1 bateu com 1 pedido `PAGO` retornado por `GET /api/admin/pedidos?statusPedido=PAGO&restauranteId=1`; `expiradosHoje=0` no dashboard, apesar de existirem pedidos `EXPIRADO` no restaurante 1 em `/admin/pedidos` — consistente, já que esses pedidos foram criados em `2026-07-10` (dias anteriores), não no dia corrente (`2026-07-12`), confirmando que o filtro de "hoje" por `Pedido.criadoEm` está funcionando como documentado, não como bug

**Validação de UI**: sem automação de navegador disponível neste ambiente (mesma limitação de todas as validações anteriores do projeto, 9c a 9j) — feita por revisão de código linha a linha combinada com os resultados de `curl` acima, cobrindo o mesmo backend que o frontend consome:

- [x] `AdminDashboardPage.tsx`: redireciona para `/admin/login` se não houver sessão salva (`getAccessToken`/`getStoredUsuario`); chama `obterDashboard({ restauranteId: restauranteIdEscopo ?? undefined })` — `ADMIN_RESTAURANTE` nunca envia `restauranteId` de outro restaurante, e `getRestauranteIdEscopo` já restringe ao próprio antes mesmo da chamada
- [x] `401` → `clearSession()` + mensagem "Sessão expirada. Faça login novamente." + botão "Ir para login" (mesmo padrão de `AdminPedidosPage`/demais telas); `403` → sessão preservada, mensagem "Você não tem permissão para acessar o dashboard.", sem `clearSession()`
- [x] Formatação: `valorPagoHoje` usa `formatCurrencyBRL` (BRL); `dataReferencia` exibida como string ISO (`YYYY-MM-DD`) vinda direto do backend — legível, sem texto técnico adicional
- [x] Loading: `carregarResumo` seta `loading=true` antes da chamada e mostra "Carregando dashboard..." — não quebra a tela em nenhum estado intermediário
- [x] Navegação: `AdminVoltarLink` presente (mesmo componente reaproveitado das demais telas administrativas) — "← Painel administrativo" funcional
- [x] `ADMIN_RESTAURANTE`: aviso "Você está operando apenas no restaurante vinculado à sua conta." exibido (`adminRestaurante` check); nenhuma chamada a `GET /api/admin/restaurantes` no fluxo desta tela (não há seletor de restaurante nem código que a invoque)
- [x] Tema claro/escuro: `.dashboard-admin__*` em `global.css` usa somente tokens (`--color-surface`, `--color-border`, `--color-text`, `--color-text-muted`, `--shadow-card`) — nenhuma cor fixa fora do Design System, mesmo padrão já validado nas demais telas
- [x] Responsividade: `.dashboard-admin__grid` usa `grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr))` — quebra de linha automática por largura de card, sem overflow horizontal esperado em qualquer largura de tela

**Nenhum bug encontrado — nenhuma alteração de código foi necessária nesta task.**

**Pendência mantida (não corrigida, decisão deliberada desta task)**: contadores "hoje" continuam em UTC (`Clock.systemUTC()`), não no fuso horário local do Brasil — mesma limitação documentada desde a TASK-074, fora do escopo de "somente validação" da TASK-075.

**Pendência de ambiente**: clique real na UI (navegador) não foi realizado — sem automação de navegador disponível neste ambiente. `mvn test` também não foi reexecutado nesta task pelo mesmo motivo de ambiente (`mvn` fora do `PATH`); recomenda-se rodá-lo manualmente antes do próximo merge relevante para reconfirmar o 200/200 já registrado na TASK-074.

## 9l. Gestão operacional de dispositivos (TASK-077)

**Coberto por testes automatizados novos** (`service/DispositivoAcessoServiceTest`, 4 testes; `mapper/DispositivoMapperTest`, 4 testes; `integration/DispositivoAcessoIntegrationTest`, 4 testes MockMvc via HTTP real) — `mvn test` completo: **212/212, BUILD SUCCESS** (Maven localizado via `~/.m2/wrapper/dists`, mesmo achado documentado na TASK-071/`docs/testes-backend-mvp.md`). Ver `docs/09-contratos-api.md` seção "Admin — Dispositivos (gestão operacional, TASK-077)" para o contrato completo.

- [x] `ultimoAcesso` (campo já existente desde o início do projeto, nunca atualizado após a ativação) agora é atualizado a cada requisição autenticada de dispositivo, com throttle de 1 minuto (`DispositivoAcessoService`)
- [x] `DispositivoResponse` ganhou `statusOperacional` derivado — `REVOGADO` (ativo=false, prioridade sobre os demais), `NUNCA_USADO` (ultimoAcesso nulo), `USADO_RECENTEMENTE` (dentro de `app.dispositivos.online-recente-minutos`, padrão 5min), `ATIVO` (fora da janela recente) — confirmado por `DispositivoMapperTest` nos 4 cenários
- [x] Dispositivo revogado nunca registra novo acesso, mesmo com token ainda dentro da validade — o filtro só chama `registrarAcesso` depois de confirmar `ativo=true`/`ativado=true`; confirmado em `DispositivoAcessoIntegrationTest` (token emitido antes da revogação passa a receber `401`, e `ultimoAcesso` permanece no valor anterior à tentativa)
- [x] Usuário admin (humano) autenticado nunca atualiza `ultimoAcesso` de nenhum dispositivo — `registrarAcesso` só é chamado no branch de autenticação de dispositivo do `JwtAuthenticationFilter`, nunca no de usuário
- [x] Falha ao persistir `ultimoAcesso` (simulada com `save` lançando exceção) não derruba a autenticação da requisição em andamento — `DispositivoAcessoServiceTest.registrarAcesso_naoDeveLancarExcecao_quandoSaveFalha`
- [x] `ADMIN_RESTAURANTE` continua vendo só dispositivos do próprio restaurante, cada um com `ultimoAcesso`/`statusOperacional` corretos (`DispositivoAcessoIntegrationTest.adminRestaurante_deveVerApenasDispositivosDoProprioRestaurante_comUltimoAcessoEStatus`)
- [x] Nenhuma migration nova foi necessária — a coluna `ultimo_acesso` já existia desde a `V2__criar_entidades_base.sql` (TASK-002), só nunca tinha sido atualizada de fato após a ativação

**Bug real encontrado e corrigido nesta task**: `DispositivoService.ativarComCodigo`/`revogar` usavam `LocalDateTime.now()` (fuso horário local da JVM) para `ultimoAcesso`/`ativadoEm`/`revogadoEm`, enquanto o restante do projeto (`PedidoExpiracaoService`, `LoginAttemptService`, `DashboardAdminService`, e o novo `DispositivoAcessoService`) usa o `Clock` injetado (`Clock.systemUTC()`). Em ambiente fora de UTC, isso fazia um dispositivo recém-ativado aparecer com `statusOperacional=ATIVO` em vez de `USADO_RECENTEMENTE` — encontrado pelo próprio `DispositivoAcessoIntegrationTest` desta task (falha reproduzida antes da correção, teste passando depois). Corrigido trocando as 3 chamadas por `LocalDateTime.now(clock)`.

**Validação de UI**: `npm run build` confirmado sem erro TypeScript. Sem automação de navegador disponível neste ambiente (mesma limitação de todas as validações anteriores do projeto) — feita por revisão de código: `DispositivoCard.tsx` agora renderiza um único badge de `statusOperacional` (4 estados, cores via tokens — `--color-success`/`--color-primary`/`--color-text-muted`/`--color-error`, sem cor nova fora do Design System) em vez do badge cadastral "Ativo/Revogado" anterior; "Último acesso" mostra "Nunca acessou" quando `null`; `AdminDispositivosPage.tsx` ganhou filtros client-side por tipo e por status operacional, sobre a lista já carregada (sem novo parâmetro de API, sem paginação — lista continua pequena o suficiente para o MVP).

**Fora do escopo desta task (conforme instruído)**: WebSocket, heartbeat, presença em tempo real, refresh token de dispositivo, filtro por tipo/status no backend (fica só no frontend), dashboard complexo, tela pública nova.

## 9m. Validação visual manual da gestão operacional de dispositivos (TASK-078)

**Coberto por testes automatizados já existentes** (`DispositivoAcessoServiceTest`, `DispositivoMapperTest`, `DispositivoAcessoIntegrationTest`, ver seção 9l) e **revalidado via `curl` contra o backend real + PostgreSQL real** (2026-07-12) — reexecução completa de `mvn test` (**212/212, BUILD SUCCESS**) e `npm run build` (sem erro TypeScript) confirmadas antes da validação manual.

Fluxo real executado: criação de dispositivo TOTEM novo (id 9, restaurante 1) → `POST /api/admin/dispositivos` → `statusOperacional=NUNCA_USADO`, `ultimoAcesso=null`. Ativação via `POST /api/auth/dispositivos/ativar` → `ultimoAcesso` preenchido, `statusOperacional=USADO_RECENTEMENTE`.

- [x] `GET /api/admin/dispositivos` (SUPER_ADMIN) → `200`, todos os 9 dispositivos do banco (de tasks anteriores + o novo) trazem `statusOperacional`; dispositivos nunca ativados mostram `NUNCA_USADO` com `ultimoAcesso=null`; dispositivos ativados há dias (tasks anteriores, fora da janela de 5min) mostram `ATIVO`
- [x] Dispositivo recém-ativado → `ultimoAcesso` preenchido, `statusOperacional=USADO_RECENTEMENTE`
- [x] **Throttle de 1 minuto confirmado**: duas chamadas consecutivas a `GET /api/totem/cardapio` com o mesmo token (poucos segundos de diferença) → ambas `200`, sem erro, e `ultimoAcesso` permaneceu **idêntico** entre as duas (comparado byte a byte na resposta de `GET /api/admin/dispositivos`) — a segunda chamada não gerou `UPDATE`, conforme documentado
- [x] **Revogação confirmada**: `PATCH /api/admin/dispositivos/9/revogar` → `200`, `statusOperacional=REVOGADO`; tentativa de reuso do token antigo em `GET /api/totem/cardapio` → `401` (não `403` — token deixa de autenticar, comportamento correto e consistente com o resto do projeto); `ultimoAcesso` **não avançou** após a tentativa (confirmado comparando o valor antes/depois)
- [x] **Reativação confirmada**: `PATCH /api/admin/dispositivos/9/ativar` → `200`, `statusOperacional` volta a `USADO_RECENTEMENTE` (o `ultimoAcesso` anterior à revogação ainda estava dentro da janela recente)
- [x] `ADMIN_RESTAURANTE` (`admin.r1@totem.local`, restaurante 1) → `GET /api/admin/dispositivos` retorna só os 4 dispositivos do restaurante 1 (incluindo o novo id 9), cada um com `ultimoAcesso`/`statusOperacional` corretos — nenhum dispositivo de outro restaurante aparece
- [x] Sem token → `401`
- [x] `ADMIN_RESTAURANTE` tentando revogar dispositivo de outro restaurante (`PATCH /api/admin/dispositivos/1/revogar`, restaurante 2) → `403`, sessão preservada (mesmo token continua `200` na chamada seguinte de listagem)

**Validação de UI**: sem automação de navegador disponível neste ambiente (mesma limitação de todas as validações anteriores do projeto) — feita por revisão de código cruzada com os resultados de `curl` acima, que exercitam exatamente a mesma API que o frontend consome:

- [x] `DispositivoCard.tsx`: badge usa `dispositivo.statusOperacional` diretamente (sem lógica duplicada no frontend), com `Record` mapeando os 4 valores de enum exatos retornados pela API (`USADO_RECENTEMENTE`/`ATIVO`/`NUNCA_USADO`/`REVOGADO`) para rótulo e classe CSS — nenhum valor órfão possível
- [x] "Último acesso" usa `dispositivo.ultimoAcesso ? formatDateTimeBRL(...) : "Nunca acessou"` — coerente com o `null` observado nos dispositivos `NUNCA_USADO` da API
- [x] `AdminDispositivosPage.tsx`: `dispositivosFiltrados` filtra por igualdade estrita com `filtroTipo`/`filtroStatusOperacional`, mesmos valores de enum da API — filtros combinam com `&&` (AND), "Todos" (`null`) desativa cada filtro independentemente; estado vazio distinto ("Nenhum dispositivo cadastrado" vs "Nenhum dispositivo encontrado para os filtros selecionados")
- [x] Tema claro/escuro: `.dispositivo-card__status--*` usa só tokens (`--color-success`, `--color-primary`, `--color-text-muted`, `--color-error`, `--color-surface-elevated`) — nenhuma cor nova fora do Design System (mesmo padrão validado em todas as telas administrativas anteriores)
- [x] Responsividade: `DispositivoCard` reutiliza a classe `pedido-pendente-card` (grid responsivo já usado por Caixa/Cozinha/Pedidos), sem CSS de layout novo

**Nenhum bug de código encontrado na feature de gestão operacional em si** — todos os comportamentos (throttle, revogação, escopo, status) se comportaram exatamente como documentado na TASK-077.

**Achado real registrado como pendência técnica nesta task**: durante a validação, um dispositivo criado e ativado com ~30 segundos de diferença mostrou `criadoEm=19:17:16` e `ativadoEm=22:17:47` — 3h de diferença aparente. Causa: `criadoEm`/`atualizadoEm` (Hibernate `@CreationTimestamp`/`@UpdateTimestamp`, presente em toda entidade do projeto) usam o fuso horário padrão da JVM (`America/Sao_Paulo`, sem `-Duser.timezone` configurado), enquanto `ultimoAcesso`/`ativadoEm`/`revogadoEm` (desde a correção da TASK-077) usam `Clock.systemUTC()`. **Não afeta a correção do `statusOperacional`** (comparação sempre dentro do mesmo relógio UTC), mas mistura fusos no mesmo registro ao exibir `criadoEm` ao lado de `ativadoEm`/`ultimoAcesso`. Mesma raiz da limitação de UTC já documentada para `Pedido.criadoEm` no Dashboard (TASK-074) — mas agora confirmado que `criadoEm` não está de fato em UTC, e sim no fuso local da JVM, o que os documentos anteriores não deixavam explícito. **Corrigido na TASK-079** — ver seção 9n abaixo. A investigação da TASK-079 revelou que o impacto real ia muito além do cosmético: o mesmo problema fazia pedidos expirarem em segundos em vez de minutos (`PedidoExpiracaoService`).

**Limitações mantidas (deliberadas, reafirmadas nesta validação)**: sem WebSocket, sem heartbeat, `statusOperacional` não é presença em tempo real — reflete só a última requisição autenticada já processada pelo backend. Clique real na UI não realizado — sem automação de navegador disponível neste ambiente.

## 9n. Padronização de fuso horário do backend (TASK-079)

**Coberto por teste automatizado novo** (`integration/TimezoneIntegrationTest`, 3 testes) — `mvn test` completo: **215/215, BUILD SUCCESS** (212 anteriores + 3 novos). **Validado ao vivo contra backend real + PostgreSQL real** (2026-07-12, backend reiniciado do zero para captar a correção). Ver `docs/09-contratos-api.md` seção "Padronização de fuso horário" para a regra oficial completa.

**Achado crítico confirmado ao vivo, antes da correção**: pedido criado às `19:52:18` (hora local da JVM) apareceu `EXPIRADO` às `19:53:05` — **47 segundos depois**, com `app.pedidos.expiracao.minutos=30` configurado. Causa: `PedidoExpiracaoService` compara `Pedido.criadoEm` (Hibernate, fuso local `America/Sao_Paulo`) contra um limite calculado em UTC via `Clock` — como BRT está 3h atrás de UTC, a janela efetiva de expiração virava `30 - 180 = -150 minutos`, ou seja, elegível quase instantaneamente. Esse é o mesmo bug de fuso encontrado na TASK-078 para `Dispositivo`, mas com impacto funcional real (não só cosmético).

**Correção**: fuso padrão da JVM fixado para UTC em `TotemApplication` (bloco estático, executado antes de qualquer geração de timestamp), complementado por `hibernate.jdbc.time_zone: UTC` e `jackson.time-zone: UTC` em `application.yml` (principal e teste).

- [x] `mvn test` completo → 215/215, BUILD SUCCESS (nenhum teste existente quebrou)
- [x] `npm run build` → sem erro TypeScript (frontend não alterado, só documentação)
- [x] Backend reiniciado do zero com a correção aplicada
- [x] Dispositivo criado e ativado em sequência → `criadoEm`/`ativadoEm` com diferença de frações de segundo (antes: ~3h) — confirmado contra `date -u` real
- [x] **Pedido criado e aguardado por mais de um ciclo do job de expiração (75s+, job roda a cada 60s)** → permaneceu `CRIADO`, não expirou (antes da correção: expirava em 47s)
- [x] `GET /api/admin/dashboard` → `200`, continua respondendo normalmente
- [x] `GET /api/admin/pedidos` → `200`, continua respondendo normalmente
- [x] `GET /api/admin/dispositivos` → `200`, continua respondendo normalmente

**Nenhuma migration de dados criada** — ambiente de desenvolvimento, poucos registros de teste, sem necessidade justificada.

**Fora do escopo desta task (deliberado)**: migração de `LocalDateTime` para `Instant`/`OffsetDateTime`; alteração de contratos REST; alteração do frontend (só documentação); correção do Dashboard "hoje" para `America/Sao_Paulo` (continua UTC).

**Implicação documentada, não corrigida nesta task**: como `LocalDateTime` serializa sem sufixo `Z`/offset, o frontend (`new Date(valor)`) vai interpretar os valores UTC como hora local do navegador — os campos `criadoEm`/`atualizadoEm` (agora UTC, antes local) passam a exibir ~3h adiantado em um navegador configurado para `America/Sao_Paulo`, mesma limitação que já existia desde a TASK-077 para `ultimoAcesso`/`ativadoEm`/`revogadoEm`, agora estendida a todos os campos de data de forma consistente. Ver `frontend/README.md`. **Corrigido na TASK-080** — ver seção 9o abaixo.

## 9o. Correção de exibição de datas UTC no frontend (TASK-080)

Resolve a implicação registrada na TASK-079 (seção 9n acima): o frontend interpretava `LocalDateTime` sem offset como hora local do navegador, exibindo todos os campos de data/hora do Admin ~3h adiantados num navegador configurado para `America/Sao_Paulo`.

**Correção**: novo utilitário central `frontend/src/utils/dateTime.ts` — `parseBackendUtcDateTime` acrescenta `Z` a qualquer string sem offset explícito (detectado via regex `/([zZ]|[+-]\d{2}:\d{2})$/`, respeitando offsets já presentes) antes de construir o `Date`, garantindo que o navegador interprete o valor como UTC e converta corretamente para o fuso local ao formatar. `formatarDataHora`/`formatarData`/`formatarHora` usam essa base; `formatarDataReferencia` (para o campo `dataReferencia` do Dashboard, um `LocalDate` sem hora) formata por manipulação pura de string, sem passar por `Date`, evitando o risco de "pular" de dia perto da meia-noite UTC.

- [x] `formatDateTimeBRL` (função única já reaproveitada em 6 componentes: `DispositivoCard`, `PedidoAdminCard`, `PedidoAdminDetalhe`, `RestauranteCard`, `PedidoPendenteCard` do Caixa, `PedidoCozinhaCard` da Cozinha) renomeada/movida para `formatarDataHora` em `utils/dateTime.ts` — corrigir um único ponto central corrigiu todas as telas de uma vez, sem precisar tocar em cada componente individualmente além da troca de import
- [x] `AdminDashboardPage.tsx`: `dataReferencia` passa por `formatarDataReferencia` em vez de ser exibida como string crua
- [x] `AdminCategoriasPage`, `AdminProdutosPage`, `AdminUsuariosPage`: confirmado que não exibem datas — nada a alterar
- [x] Nenhum uso direto de `new Date(valor)` remanescente fora de `utils/dateTime.ts` (confirmado por busca no projeto)
- [x] Texto "Nunca acessou" (`DispositivoCard`, quando `ultimoAcesso` é `null`) preservado exatamente como estava — não substituído por travessão genérico
- [x] `npm run build` → sem erro TypeScript
- [x] **Validação da conversão**: criado e ativado um dispositivo real contra o backend (reiniciado com a correção da TASK-079); `ultimoAcesso` retornado pela API (`"2026-07-13T00:11:50.5562168"`) confirmado batendo com `date -u` real. Testado em Node.js simulando `Intl.DateTimeFormat` em `America/Sao_Paulo`: o valor passa a formatar como `12/07/2026, 21:11` — batendo com `date` (hora local real), em vez de `13/07/2026, 00:11` (o que apareceria sem a correção — 3h adiantado e em outro dia)
- [x] Casos de borda testados em Node: `parseBackendUtcDateTime(null)` → `null`; string já com `Z` ou offset `-03:00` → respeitada, não duplica o sufixo; `formatarDataReferencia(null)` → `"—"`

**Sem automação de navegador disponível neste ambiente** (mesma limitação de todas as validações anteriores do projeto) — validação feita via `curl` (dados reais da API) + execução da lógica exata do utilitário em Node.js, simulando o `Intl.DateTimeFormat` que o navegador executaria. Clique real na UI recomendado para fechar 100%.

**Nenhuma biblioteca instalada** — só `Intl.DateTimeFormat` nativo. **Nenhuma mudança de backend, contrato de API ou regra de negócio** nesta task.

**Fora do escopo desta task (deliberado)**: migração do backend para `Instant`/`OffsetDateTime`; seletor de fuso horário; correção do Dashboard "hoje" (continua UTC).

## 10. Consistência visual

- [ ] Alternar tema (💡) em cada subtela do Admin, com formulário preenchido e em modo edição
- [ ] Nenhum link aparece com a cor azul padrão do navegador (bug corrigido na TASK-047 — `<Link>` sem classe própria)
- [ ] Todas as subtelas têm: título + descrição, link "← Painel administrativo", botão "Atualizar lista", loading, erro amigável, estado vazio

## 11. Validação real no navegador (TASK-086)

A TASK-085 corrigiu a causa raiz que impedia qualquer clique real até então: CORS nunca configurado no backend (`SecurityConfig` sem `CorsConfigurationSource`), bloqueando toda chamada feita por um navegador (não `curl`). Com a correção (origens `http://localhost:5173`/`5174` liberadas), a TASK-086 finalmente executou clique real, no navegador, das principais telas administrativas — fechando a maior parte das pendências de "clique real na UI" registradas ao longo deste checklist desde a TASK-060.

Validado por você diretamente no navegador (dois lotes de perguntas, sem intervenção de código):

- [x] Login SUPER_ADMIN (`admin@totem.local`/`Admin@2026!`) — sem erro de CORS no console, `POST /api/auth/login` `200`, tokens/usuário salvos no LocalStorage, redirecionado para `/admin`.
- [x] Admin Home — cards corretos para o perfil, logout funcional, tema claro/escuro sem quebra visual.
- [x] Dashboard — cards carregam, valores monetários e data de referência legíveis.
- [x] Pedidos — lista carrega, paginação "Anterior"/"Próxima" funciona, filtro por status funciona, abrir detalhe funciona.
- [x] Dispositivos — cards carregam, status operacional exibido, filtros por tipo/status funcionam, revogar/reativar funcionam.
- [x] Produtos — lista, cadastro/edição, upload de imagem, preview, toggle de disponibilidade — todos funcionais.
- [x] Categorias — lista, criar/editar, inativar — funcionais.
- [x] Restaurantes — lista, criar/editar, ativar/inativar — funcionais.
- [x] Usuários — lista, criar/editar, alterar senha — funcionais.
- [x] Login `ADMIN_RESTAURANTE` — Home mostra só os cards permitidos (sem Restaurantes/Usuários); Dashboard/Pedidos/Dispositivos/Produtos/Categorias escopados ao restaurante vinculado; acesso direto por URL a `/admin/restaurantes`/`/admin/usuarios` não derruba a sessão (mostra erro de permissão, sessão preservada) — fecha definitivamente a pendência registrada na linha 125 deste arquivo (antes só validada por `curl`/revisão de código).
- [x] Renovação automática de sessão (refresh token) — `accessToken` inválido + `refreshToken` válido: sessão renovada automaticamente, sem pedir novo login (fecha a pendência da linha 166/197). `accessToken` e `refreshToken` ambos inválidos: sessão limpa, usuário volta para `/admin/login`.

**Nenhum bug encontrado** em nenhuma das telas/fluxos acima — nenhuma alteração de código de produção foi necessária além da correção de CORS já feita na TASK-085.

**Telas/fluxos não cobertos nesta rodada** (fora do escopo desta task, permanecem como pendência): rate limit (`429`) não testado no navegador para não bloquear o usuário durante a validação; consistência visual detalhada (seção 10 acima) não percorrida tela a tela; Totem/Caixa/Cozinha (fora do escopo — esta task era só Admin).

## 12. TASK-088 — operação de dispositivos

- [x] Ação “Regenerar código” no card de dispositivo, com confirmação e exibição do novo código.
- [x] Regeneração mantém `ativo=true` e revoga refresh tokens anteriores; access tokens já emitidos seguem até expirar.
- [x] `SUPER_ADMIN` pode operar qualquer restaurante; `ADMIN_RESTAURANTE` fica restrito ao próprio restaurante; perfis operacionais não acessam o endpoint.

## 13. TASK-089 — validação de escopo da regeneração de código

Validado via `curl` contra backend real (usuários `ADMIN_RESTAURANTE` novos criados para o teste, um por restaurante, já que as senhas dos usuários existentes não eram conhecidas):

- [x] `SUPER_ADMIN` regenera código de dispositivo de qualquer restaurante → `200`, `codigoAtivacao` novo e diferente do anterior.
- [x] `ADMIN_RESTAURANTE` regenera código de dispositivo do **próprio** restaurante → `200`.
- [x] `ADMIN_RESTAURANTE` tenta regenerar dispositivo de **outro** restaurante → `403` (`"Você não tem permissão para executar esta ação"`), sessão preservada (mesmo padrão das demais ações administrativas).
- [x] Requisição sem `Authorization` → `401`.
- [x] Após regenerar, o `refreshToken` anterior do dispositivo é revogado (`401` em `/api/auth/refresh`); o `accessToken` JWT já emitido continua válido até expirar — limitação JWT stateless, documentada.
- [x] Reativar o dispositivo com o código novo funciona e emite um novo par `accessToken`/`refreshToken`.

**Nenhum bug encontrado** — nenhuma alteração de código nesta task. Clique real no botão "Regenerar código" em `/admin/dispositivos` (DevTools, confirmação, exibição do código) segue como pendência de validação manual — ambiente sem automação de navegador.

## 14. TASK-090 — gestão de usuários pelo ADMIN_RESTAURANTE

Implementado e coberto por teste automatizado: `UsuarioServiceTest` (32 testes, unitário/Mockito) e `integration/UsuarioAdminScopeIntegrationTest` (18 testes, MockMvc/HTTP real).

**Regra de negócio**: `ADMIN_RESTAURANTE` passou a gerenciar `/admin/usuarios`, mas só usuários com perfil `OPERADOR_CAIXA`/`OPERADOR_COZINHA` **do próprio restaurante**. `SUPER_ADMIN` mantém acesso irrestrito (qualquer perfil, qualquer restaurante) — comportamento anterior à TASK-090 preservado 1:1.

- [x] `SUPER_ADMIN`: lista todos, cria `SUPER_ADMIN`/`ADMIN_RESTAURANTE`/operadores em qualquer restaurante, edita/ativa/desativa/altera senha de qualquer usuário — sem mudança de comportamento.
- [x] `ADMIN_RESTAURANTE`: `GET /api/admin/usuarios` sem filtro → só usuários do próprio restaurante (nunca `SUPER_ADMIN`, que não tem restaurante); com `restauranteId` do próprio → `200`; com `restauranteId` de outro → `403`.
- [x] `ADMIN_RESTAURANTE` cria `OPERADOR_CAIXA`/`OPERADOR_COZINHA` no próprio restaurante (com ou sem `restauranteId` no corpo — se omitido, backend assume o próprio) → `201`.
- [x] `ADMIN_RESTAURANTE` tenta criar `SUPER_ADMIN` → `403`. Tenta criar outro `ADMIN_RESTAURANTE` → `403`. Tenta criar usuário em outro restaurante → `403`.
- [x] `ADMIN_RESTAURANTE` edita operador do próprio restaurante → `200`. Tenta editar usuário de outro restaurante, um `SUPER_ADMIN`, ou outro `ADMIN_RESTAURANTE` → `403`.
- [x] `ADMIN_RESTAURANTE` tenta promover um operador para `SUPER_ADMIN`/`ADMIN_RESTAURANTE`, ou mover para outro restaurante → `403` (mesmo com o alvo sendo um operador do próprio restaurante — a checagem é sobre o **valor solicitado**, não só o atual).
- [x] `ADMIN_RESTAURANTE` altera senha de operador do próprio restaurante → `200`. Tenta alterar senha de `SUPER_ADMIN`, outro `ADMIN_RESTAURANTE`, ou usuário de outro restaurante → `403`.
- [x] `ADMIN_RESTAURANTE` tenta desativar a si mesmo → `403` (perfil `ADMIN_RESTAURANTE` não é gerenciável por `ADMIN_RESTAURANTE`, então nem chega na checagem de autodesativação — resultado observável, `403`, é o esperado).
- [x] `OPERADOR_CAIXA`/`OPERADOR_COZINHA` tentando acessar qualquer endpoint de `/api/admin/usuarios` → `403`. Sem token → `401`.
- [x] `mvn test` → 279/279, BUILD SUCCESS (suíte completa, sem regressão nos demais módulos).

**Ajuste em teste pré-existente**: `SecurityHttpStatusTest.tokenValidoSemPermissao_deveRetornar403` usava `/api/admin/usuarios` como exemplo de endpoint "autenticado mas sem permissão" para `ADMIN_RESTAURANTE` — deixou de ser um exemplo válido depois da TASK-090 (esse `ADMIN_RESTAURANTE` de teste não tem operadores para gerenciar, mas o endpoint em si passou a aceitar o perfil). Trocado para `/api/admin/restaurantes`, que continua exclusivo de `SUPER_ADMIN`.

**Frontend**: `AdminHomePage.tsx` mostra o card "Usuários" para `SUPER_ADMIN` e `ADMIN_RESTAURANTE` (só some para `OPERADOR_CAIXA`/`OPERADOR_COZINHA`, via novo helper `isOperador`). `AdminUsuariosPage.tsx` não chama `GET /api/admin/restaurantes` para `ADMIN_RESTAURANTE` (mesmo padrão de Categorias/Produtos/Dispositivos desde a TASK-059), trava o restaurante do formulário (`restauranteFixo`) e restringe os perfis exibidos/atribuíveis a `OPERADOR_CAIXA`/`OPERADOR_COZINHA` (`perfisPermitidos` em `UsuarioForm`), com o aviso "Você está gerenciando usuários do seu restaurante." `npm run build`/`npx oxlint` sem erro — validação de clique real não realizada (sem automação de navegador neste ambiente).

**Importante — fora do escopo desta task**: isso só habilita o CRUD desses perfis pelo Admin. `OPERADOR_CAIXA`/`OPERADOR_COZINHA` continuam **sem nenhum acesso** a `/api/caixa/**`/`/api/cozinha/**` (que seguem exclusivamente autenticados por dispositivo, `ROLE_DEVICE_CAIXA`/`ROLE_DEVICE_COZINHA`) — criar um operador aqui não o torna um usuário operacional real do Caixa/Cozinha. Login de operador dentro do dispositivo e auditoria por usuário humano (`HistoricoStatusPedido.alteradoPorUsuario`) permanecem como decisão arquitetural em aberto — ver `docs/status-mvp.md`.

## Fora do escopo (ainda não implementado)

Proteção de rota por perfil no frontend (o bloqueio real é 100% backend via `@PreAuthorize`; o frontend só oculta cards/mostra erro amigável em 403) — ver "Limitações atuais do Admin" em `frontend/README.md`. Nota: upload de imagem de produto (TASK-053) e refresh token (TASK-063) já foram implementados e validados por clique real (ver seção 11); esta linha ficou desatualizada desde então e foi corrigida na TASK-086.
