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

- [ ] Editar `totem.accessToken` no DevTools para um valor inválido e tentar qualquer ação → sessão expirada, botão "Ir para login", sessão limpa (**este cenário só passa de verdade a partir da TASK-061** — antes, o backend retornava `403` para token inválido, então a tela mostrava "sem permissão" em vez de "sessão expirada")
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
- [ ] Acessar `/admin/usuarios` digitando a URL diretamente → mensagem "Você não tem permissão para acessar usuários." (403), sessão preservada, sem redirecionar para login — **pendente de confirmação visual manual** (lógica idêntica às outras 3 páginas, já revisada, mas não clicada)
- [x] (por revisão de código) Login como `SUPER_ADMIN` → todos os 5 cards aparecem em `/admin`; as 3 páginas mantêm seletor de restaurante completo (branch `restauranteFixo` não ativa)
- [x] ~~Token inválido/expirado retornava `403`, não `401`~~ **corrigido de verdade na TASK-061** (`RestAuthenticationEntryPoint`) — validado por `security/SecurityHttpStatusTest` (MockMvc). O branch de "sessão expirada" das páginas administrativas (`error.status === 401`) agora é acionado corretamente para token ausente/inválido/expirado; `403` continua reservado a autenticado-sem-permissão. Backend recompilado após a TASK-061 ainda precisa de confirmação manual (`curl` sem token → 401) antes de considerar 100% fechado — ver seção 9 abaixo.

## 10. Consistência visual

- [ ] Alternar tema (💡) em cada subtela do Admin, com formulário preenchido e em modo edição
- [ ] Nenhum link aparece com a cor azul padrão do navegador (bug corrigido na TASK-047 — `<Link>` sem classe própria)
- [ ] Todas as subtelas têm: título + descrição, link "← Painel administrativo", botão "Atualizar lista", loading, erro amigável, estado vazio

## Fora do escopo (ainda não implementado)

Upload de imagem de produto, refresh token, seletor visual de restaurante em Dispositivos, proteção de rota por perfil no frontend — ver "Limitações atuais do Admin" em `frontend/README.md`.
