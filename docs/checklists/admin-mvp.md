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

- [ ] Editar `totem.accessToken` no DevTools para um valor inválido e tentar qualquer ação → sessão expirada, botão "Ir para login", sessão limpa
- [ ] Acessar qualquer subtela do Admin com token de dispositivo (Totem/Caixa/Cozinha) → 403 amigável, sessão preservada
- [ ] CNPJ duplicado, nome de categoria duplicado no mesmo restaurante, `codigoIdentificacao` de dispositivo duplicado → 400 amigável no formulário
- [ ] Restaurante/categoria/dispositivo/usuário com ID inexistente → 404 amigável
- [ ] Email de usuário duplicado → 400 amigável no formulário

## 9b. Escopo por restaurante para ADMIN_RESTAURANTE (TASK-058, backend)

Requer um usuário `ADMIN_RESTAURANTE` cadastrado (via `/admin/usuarios`, exige `SUPER_ADMIN`) vinculado a um restaurante (ex.: restaurante A), e pelo menos dois restaurantes cadastrados (A e B) com categoria/produto/dispositivo próprios em cada um. Use `docs/http/totem-fast-food-mvp.http` ou o Swagger para os testes de API pura com token de `ADMIN_RESTAURANTE` (a TASK-059, abaixo, cobre a experiência via UI).

- [ ] Login como `ADMIN_RESTAURANTE` do restaurante A, `GET /api/admin/categorias` sem `restauranteId` → retorna só categorias do restaurante A (nunca todas)
- [ ] `GET /api/admin/categorias?restauranteId=<B>` → `403`
- [ ] `POST /api/admin/categorias` com `restauranteId=<B>` → `403`
- [ ] `PUT`/`DELETE` em categoria do restaurante B → `403`; no restaurante A → sucesso normal
- [ ] Repetir os 4 passos acima para `/api/admin/produtos` (incluindo `PATCH .../disponibilidade` e `.../destaque`)
- [ ] Repetir para `/api/admin/dispositivos` (`GET` sem filtro já restringe ao restaurante A; `POST`/`PUT`/`PATCH .../revogar`/`PATCH .../ativar` no restaurante B → `403`)
- [ ] `SUPER_ADMIN` continua acessando/alterando livremente categorias/produtos/dispositivos de A e B
- [ ] `/api/admin/usuarios` continua bloqueado para `ADMIN_RESTAURANTE` (403), sem exceção — não recebeu escopo por restaurante, permanece exclusivo de `SUPER_ADMIN`
- [ ] Upload de imagem (`POST /api/admin/uploads/produtos/imagem`) continua funcionando para `ADMIN_RESTAURANTE` normalmente (sem checagem de restaurante)

## 9c. Escopo por restaurante — experiência visual no frontend (TASK-059)

Continuação do bloco 9b, agora testando pela UI (`http://localhost:5173/admin`) em vez de chamadas diretas.

- [ ] Login como `ADMIN_RESTAURANTE` do restaurante A → em `/admin`, cards "Restaurantes" e "Usuários" **não aparecem**; aviso "Você está operando apenas no restaurante vinculado à sua conta." visível
- [ ] `/admin/categorias`: sem seletor "Filtrar por restaurante"; formulário mostra "Restaurante" fixo como "Restaurante vinculado à sua conta" (não o nome real); lista já vem só com categorias do restaurante A
- [ ] Cadastrar categoria: `POST` no Network mostra `restauranteId` do restaurante A, sem nenhuma forma de escolher B
- [ ] Repetir para `/admin/produtos` (formulário fixo, categorias do seletor já filtradas para A) e `/admin/dispositivos` (formulário fixo)
- [ ] Acessar `/admin/usuarios` digitando a URL diretamente → mensagem "Você não tem permissão para acessar usuários." (403), sessão preservada, sem redirecionar para login
- [ ] Login como `SUPER_ADMIN` → todos os 5 cards aparecem em `/admin`; `/admin/categorias`, `/admin/produtos` e `/admin/dispositivos` continuam com seletor de restaurante completo, sem aviso de restrição
- [ ] Editar `totem.accessToken` para um valor inválido (qualquer perfil) → 401 continua limpando a sessão normalmente (TASK-059 não mudou esse comportamento)

## 10. Consistência visual

- [ ] Alternar tema (💡) em cada subtela do Admin, com formulário preenchido e em modo edição
- [ ] Nenhum link aparece com a cor azul padrão do navegador (bug corrigido na TASK-047 — `<Link>` sem classe própria)
- [ ] Todas as subtelas têm: título + descrição, link "← Painel administrativo", botão "Atualizar lista", loading, erro amigável, estado vazio

## Fora do escopo (ainda não implementado)

Upload de imagem de produto, refresh token, seletor visual de restaurante em Dispositivos, proteção de rota por perfil no frontend — ver "Limitações atuais do Admin" em `frontend/README.md`.
