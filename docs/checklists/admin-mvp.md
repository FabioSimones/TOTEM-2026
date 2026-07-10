# Checklist — Frontend Administrativo do MVP

Criado na TASK-047 (revisão do frontend administrativo). Complementa [`checklists/checklist-mvp.md`](../../checklists/checklist-mvp.md) e [`docs/checklists/fluxo-operacional-mvp.md`](fluxo-operacional-mvp.md) com passos concretos para validar manualmente o painel `/admin` numa máquina limpa.

Ver a seção "Ordem recomendada de uso do Admin" em `frontend/README.md` para o porquê desta ordem — cada cadastro depende do anterior.

## 1. Preparação

- [ ] Backend rodando: `cd backend && mvn spring-boot:run`
- [ ] Frontend rodando: `cd frontend && npm run dev`
- [ ] Abrir `http://localhost:5173/admin` **sem** sessão salva → redireciona para `/admin/login`

## 2. Login administrativo

- [ ] `/admin/login` com campos vazios → não chama o backend, mostra "Informe e-mail e senha."
- [ ] Login inválido → mensagem amigável (401), sem revelar se foi e-mail ou senha
- [ ] Login com `admin@totem.local` / `Admin@2026!` → redireciona para `/admin`, mostra nome/e-mail/perfil
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
- [x] `/api/admin/usuarios` continua bloqueado para `ADMIN_RESTAURANTE` (403), sem exceção — não recebeu escopo por restaurante, permanece exclusivo de `SUPER_ADMIN`
- [x] Upload de imagem (`POST /api/admin/uploads/produtos/imagem`) continua funcionando para `ADMIN_RESTAURANTE` normalmente (`201`, sem checagem de restaurante); limpeza de órfãos (`limpar-orfas`) confirmada `403` para `ADMIN_RESTAURANTE`
- [x] Todos os `403` acima preservam a sessão — chamada seguinte com o mesmo token a um recurso do próprio restaurante continua `200`

Todos os cenários passaram sem exceção — nenhum bug encontrado no backend.

## 9c. Escopo por restaurante — experiência visual no frontend (TASK-059)

**Revisado por leitura de código na TASK-060** (não houve automação de navegador disponível para clicar de fato na UI — recomenda-se uma passada manual rápida para confirmação visual final). O código de `AdminCategoriasPage`/`AdminProdutosPage`/`AdminDispositivosPage`/`AdminHomePage` e dos 3 forms foi conferido linha a linha e implementa exatamente o descrito abaixo; combinado com a validação de API (9b, que exercita a mesma lógica de backend que a UI consome), a confiança é alta.

- [x] (por revisão de código) Login como `ADMIN_RESTAURANTE` do restaurante A → em `/admin`, cards "Restaurantes" e "Usuários" **não aparecem** (`AREAS_ADMIN` filtrado por `apenasSuperAdmin`); aviso "Você está operando apenas no restaurante vinculado à sua conta." visível
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

## 9g. Listagem administrativa de pedidos (`/admin/pedidos`, TASK-068)

**Coberto por teste automatizado** (`integration/PedidoAdminIntegrationTest`, 10 testes MockMvc via HTTP real) — ver `docs/testes-backend-mvp.md` e `docs/09-contratos-api.md` seção "Admin — Pedidos". Validação manual (clique real na UI) ainda **não** foi realizada nesta task.

- [x] (automatizado) `SUPER_ADMIN` lista pedidos de todos os restaurantes
- [x] (automatizado) `SUPER_ADMIN` filtra por `statusPedido`
- [x] (automatizado) `statusPedido` inválido → `400`
- [x] (automatizado) `ADMIN_RESTAURANTE` lista apenas pedidos do próprio restaurante
- [x] (automatizado) `ADMIN_RESTAURANTE` filtrando `restauranteId` de outro restaurante → `403`
- [x] (automatizado) Detalhe do pedido retorna itens, pagamentos e histórico completo
- [x] (automatizado) `ADMIN_RESTAURANTE` não acessa detalhe de pedido de outro restaurante (`403`), mas acessa o do próprio restaurante normalmente
- [x] (automatizado) Pedido inexistente → `404`; sem token → `401`
- [ ] Validação manual: login `SUPER_ADMIN` → `/admin/pedidos` → lista aparece, filtro por restaurante e por status funcionam, "Ver detalhes" mostra itens/pagamentos/histórico
- [ ] Validação manual: login `ADMIN_RESTAURANTE` → `/admin/pedidos` → lista já vem restrita ao próprio restaurante, sem seletor de restaurante; tentar acessar pedido de outro restaurante via URL/API → mensagem amigável de permissão negada, sessão preservada
- [ ] Card "Pedidos" aparece em `/admin` tanto para `SUPER_ADMIN` quanto para `ADMIN_RESTAURANTE`

**Fora do escopo desta task**: edição de pedido, alteração de status pelo Admin, cancelamento pelo Admin, exportação, paginação.

## 10. Consistência visual

- [ ] Alternar tema (💡) em cada subtela do Admin, com formulário preenchido e em modo edição
- [ ] Nenhum link aparece com a cor azul padrão do navegador (bug corrigido na TASK-047 — `<Link>` sem classe própria)
- [ ] Todas as subtelas têm: título + descrição, link "← Painel administrativo", botão "Atualizar lista", loading, erro amigável, estado vazio

## Fora do escopo (ainda não implementado)

Upload de imagem de produto, refresh token, seletor visual de restaurante em Dispositivos, proteção de rota por perfil no frontend — ver "Limitações atuais do Admin" em `frontend/README.md`.
