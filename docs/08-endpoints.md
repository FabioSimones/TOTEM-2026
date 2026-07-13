# Endpoints REST Iniciais

**Convenção de erro (TASK-061)**: qualquer endpoint protegido abaixo retorna `401` para requisição sem token, com token malformado/inválido/expirado (não autenticado), e `403` para token válido cujo perfil/dispositivo/escopo não tem permissão para aquela ação (autenticado, mas negado). Ver `docs/09-contratos-api.md` seção "401 vs. 403" para o formato completo do corpo de erro.

## Administração de restaurantes

Permissão exigida: SUPER_ADMIN

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/restaurantes` | Cadastrar restaurante |
| GET | `/api/admin/restaurantes` | Listar restaurantes |
| GET | `/api/admin/restaurantes/{id}` | Buscar restaurante por ID |
| PUT | `/api/admin/restaurantes/{id}` | Atualizar dados do restaurante |
| PATCH | `/api/admin/restaurantes/{id}/ativar` | Ativar restaurante |
| PATCH | `/api/admin/restaurantes/{id}/desativar` | Desativar restaurante |

## Autenticação e Segurança

Todos os 4 endpoints abaixo são públicos (`permitAll`) — `/login`, `/refresh` e `/logout` validam pelo corpo da requisição (credenciais ou refresh token), nunca por um Bearer token.

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/auth/login` | Autenticar usuário humano — retorna `accessToken` (JWT) + `refreshToken` (implementado desde o início; `refreshToken` na resposta a partir da TASK-063). **Protegido por rate limiting desde a TASK-065** — pode retornar `429` após várias falhas consecutivas para a mesma combinação email+IP |
| POST | `/api/auth/refresh` | **Implementado na TASK-063/TASK-088.** Renova sessão de usuário ou dispositivo: troca um `refreshToken` válido por novo par `accessToken`/`refreshToken` (rotação — o informado é revogado mesmo em caso de sucesso) |
| POST | `/api/auth/logout` | **Implementado na TASK-063.** Revoga o `refreshToken` informado. Idempotente — token já revogado ou inexistente não é erro, sempre `204` |
| POST | `/api/auth/dispositivos/ativar` | Ativar dispositivo por código |

**Escopo do refresh token (TASK-088)**: o token é associado a exatamente um `Usuario` ou `Dispositivo`; ambos usam rotação de uso único. A ativação de dispositivo retorna o refresh token e o cliente o renova automaticamente após `401`.

**Rate limiting do login (TASK-065)**: `POST /api/auth/login` bloqueia temporariamente (`429`) após `app.security.login-rate-limit.max-failures` falhas consecutivas (padrão 5) para a mesma chave email normalizado + IP remoto, por `app.security.login-rate-limit.block-minutes` minutos (padrão 15). Implementação em memória (`LoginAttemptService`) — reiniciar a aplicação limpa os contadores; não substitui um WAF/proxy/rate limiting de borda em produção. Ver `docs/09-contratos-api.md` seção "Rate limiting do login administrativo" para o contrato completo do `429`.

## Totem

| Método | Rota | Objetivo | Permissão |
|---|---|---|---|
| GET | `/api/totem/cardapio` | Listar cardápio disponível | DEVICE_TOTEM |
| POST | `/api/totem/pedidos` | Criar pedido | DEVICE_TOTEM |
| GET | `/api/totem/pedidos/{id}` | Consultar pedido | DEVICE_TOTEM |
| POST | `/api/totem/pedidos/{id}/pagamento` | Iniciar pagamento | DEVICE_TOTEM |

## Caixa

| Método | Rota | Objetivo |
|---|---|---|
| GET | `/api/caixa/pedidos/pendentes` | Listar pedidos que exigem ação do Caixa (`AGUARDANDO_PAGAMENTO_DINHEIRO`, `PAGO`, `PRONTO`) |
| POST | `/api/caixa/pedidos/{id}/confirmar-pagamento` | Confirmar dinheiro ou pagamento manual |
| POST | `/api/caixa/pedidos/{id}/enviar-cozinha` | Enviar pedido pago para a cozinha |
| POST | `/api/caixa/pedidos/{id}/retirar` | Marcar pedido pronto como retirado |
| POST | `/api/caixa/pedidos/{id}/cancelar` | Cancelar pedido pendente |

## Cozinha

| Método | Rota | Objetivo |
|---|---|---|
| GET | `/api/cozinha/pedidos` | Listar pedidos pagos/liberados |
| PATCH | `/api/cozinha/pedidos/{id}/status` | Atualizar status de preparo |

## Administração de categorias

Permissão exigida: `SUPER_ADMIN` ou `ADMIN_RESTAURANTE`. **Escopo por restaurante (TASK-058)**: `ADMIN_RESTAURANTE` só acessa/altera categorias do próprio restaurante (o vinculado ao seu usuário) — tentar criar, listar filtrando outro restaurante, atualizar ou inativar categoria de outro restaurante retorna `403`. `SUPER_ADMIN` continua com acesso global.

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/categorias` | Criar categoria |
| GET | `/api/admin/categorias` | Listar categorias |
| PUT | `/api/admin/categorias/{id}` | Atualizar categoria |
| DELETE | `/api/admin/categorias/{id}` | Remover ou inativar categoria |

## Administração de produtos

Permissão exigida: `SUPER_ADMIN` ou `ADMIN_RESTAURANTE`. **Escopo por restaurante (TASK-058)**: mesma regra de Categorias — `ADMIN_RESTAURANTE` só acessa/altera produtos do próprio restaurante, `403` para qualquer tentativa de acessar outro.

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/produtos` | Criar produto |
| GET | `/api/admin/produtos` | Listar produtos |
| PUT | `/api/admin/produtos/{id}` | Atualizar produto |
| DELETE | `/api/admin/produtos/{id}` | Remover ou inativar produto |
| PATCH | `/api/admin/produtos/{id}/disponibilidade` | Alterar disponibilidade |
| PATCH | `/api/admin/produtos/{id}/destaque` | Alterar destaque |

## Administração de dispositivos

Permissão exigida: `SUPER_ADMIN` ou `ADMIN_RESTAURANTE`. **Escopo por restaurante (TASK-058)**: mesma regra de Categorias/Produtos — `ADMIN_RESTAURANTE` só acessa/altera dispositivos do próprio restaurante (inclusive a listagem, que passa a ser filtrada automaticamente mesmo sem esse dispositivo aceitar `restauranteId` como parâmetro).

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/dispositivos` | Cadastrar dispositivo |
| GET | `/api/admin/dispositivos` | Listar dispositivos |
| PUT | `/api/admin/dispositivos/{id}` | Atualizar nome, código de identificação e tipo (implementado na TASK-051; não altera restaurante, ativo/ativado nem código de ativação) |
| PATCH | `/api/admin/dispositivos/{id}/revogar` | Revogar dispositivo |
| PATCH | `/api/admin/dispositivos/{id}/ativar` | Reativar dispositivo |
| PATCH | `/api/admin/dispositivos/{id}/regenerar-codigo` | Gerar novo código de ativação e revogar refresh tokens anteriores (mantém o estado `ativo`) |

**Gestão operacional (TASK-077)**: a resposta de `GET`/`POST`/`PUT`/`PATCH` (`DispositivoResponse`) ganhou `statusOperacional` (`USADO_RECENTEMENTE`, `ATIVO`, `NUNCA_USADO`, `REVOGADO`), derivado no backend a partir de `ativo`/`ultimoAcesso` — nunca persistido. `ultimoAcesso` (já existente desde o início do projeto) passa a ser atualizado de verdade a cada requisição autenticada de dispositivo (throttle de 1 minuto). Não é presença em tempo real — sem WebSocket/heartbeat. Ver `docs/09-contratos-api.md` seção "Admin — Dispositivos" para o contrato completo e as limitações.

## Administração de usuários

Permissão exigida: `SUPER_ADMIN` ou `ADMIN_RESTAURANTE` (implementado na TASK-048; alteração de senha na TASK-049; escopo por restaurante para `ADMIN_RESTAURANTE` na TASK-090). `OPERADOR_CAIXA`/`OPERADOR_COZINHA` nunca acessam este módulo — `403` em qualquer endpoint.

**Escopo por restaurante (TASK-090)**: `SUPER_ADMIN` mantém acesso irrestrito (qualquer perfil, qualquer restaurante). `ADMIN_RESTAURANTE` só lista/cria/edita/ativa/desativa/altera senha de usuários **`OPERADOR_CAIXA`/`OPERADOR_COZINHA` do próprio restaurante** — nunca `SUPER_ADMIN`, nunca outro `ADMIN_RESTAURANTE` (nem a si mesmo), nunca usuário de outro restaurante. Qualquer tentativa fora desse escopo (criar/editar com perfil proibido, restaurante diferente, ou mexer em usuário fora do escopo) retorna `403`. **Importante**: isso só habilita o CRUD desses perfis pelo Admin — não torna `OPERADOR_CAIXA`/`OPERADOR_COZINHA` operadores reais do fluxo Caixa/Cozinha, que continua exclusivamente autenticado por dispositivo (`ROLE_DEVICE_CAIXA`/`ROLE_DEVICE_COZINHA`, ver seções "Caixa"/"Cozinha" acima) — ver `docs/09-contratos-api.md` para detalhes e limitações.

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/usuarios` | Cadastrar usuário |
| GET | `/api/admin/usuarios` | Listar usuários (filtro opcional `restauranteId`) |
| PUT | `/api/admin/usuarios/{id}` | Atualizar usuário (não altera senha nem `ativo`) |
| PATCH | `/api/admin/usuarios/{id}/ativar` | Ativar usuário |
| PATCH | `/api/admin/usuarios/{id}/desativar` | Desativar usuário (bloqueado para o próprio usuário autenticado) |
| PATCH | `/api/admin/usuarios/{id}/senha` | Alterar senha do usuário (nunca retorna a senha/hash) |

## Administração de pedidos

Permissão exigida: `SUPER_ADMIN` ou `ADMIN_RESTAURANTE` (TASK-068). Somente leitura — não altera status, pagamento nem qualquer dado do pedido; isso continua exclusivo do fluxo operacional (Totem/Caixa/Cozinha). **Escopo por restaurante**: mesma regra de Categorias/Produtos/Dispositivos — `ADMIN_RESTAURANTE` só lista/consulta pedidos do próprio restaurante, `403` para qualquer tentativa de acessar outro (via `restauranteId` na listagem ou implícito no detalhe).

| Método | Rota | Objetivo |
|---|---|---|
| GET | `/api/admin/pedidos` | Listar pedidos, paginado (TASK-072) — filtros opcionais `restauranteId`/`statusPedido`, `page`/`size` |
| GET | `/api/admin/pedidos/{id}` | Consultar detalhes do pedido — itens, pagamentos e histórico de status (não paginado) |

### Expiração de pedidos não pagos (TASK-070)

Complementa a listagem acima com uma ação de escrita restrita — ver seção específica logo abaixo.

Permissão exigida: **somente `SUPER_ADMIN`** (mais restrito que a listagem — ação em massa que afeta qualquer restaurante).

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/pedidos/expirar-vencidos` | Expirar manualmente pedidos não pagos (`CRIADO`, `AGUARDANDO_PAGAMENTO`, `AGUARDANDO_PAGAMENTO_DINHEIRO`) criados há mais de `app.pedidos.expiracao.minutos` |

Além do endpoint manual, um job agendado (`PedidoExpiracaoJob`, `@Scheduled(fixedDelayString = "${app.pedidos.expiracao.job-fixed-delay-ms}")`) executa a mesma regra automaticamente a cada `app.pedidos.expiracao.job-fixed-delay-ms` (padrão 60s), desde que `app.pedidos.expiracao.job-enabled=true` (padrão). Nunca afeta pedido `PAGO` em diante. Ver `docs/09-contratos-api.md` seção "Admin — Expiração de pedidos" para o contrato completo.

### Dashboard administrativo (TASK-074)

Permissão exigida: `SUPER_ADMIN` ou `ADMIN_RESTAURANTE` (mesmo escopo por restaurante da listagem de pedidos acima). Somente leitura — contadores simples para uma visão rápida da operação, sem gráficos nem relatório financeiro completo.

| Método | Rota | Objetivo |
|---|---|---|
| GET | `/api/admin/dashboard` | Resumo com contadores de pedidos (filtro opcional `restauranteId`) |

Ver `docs/09-contratos-api.md` seção "Admin — Dashboard" para o contrato completo, definições de "hoje" e limitações do MVP.

## Administração de uploads

Permissão exigida: `SUPER_ADMIN` ou `ADMIN_RESTAURANTE` para envio; `SUPER_ADMIN` para limpeza de órfãos (TASK-056). Armazenamento local em disco — adequado para o MVP (ver `docs/09-contratos-api.md` para detalhes e limites). **Sem escopo por restaurante (TASK-058)**: o upload em si não tem vínculo direto com um restaurante (o arquivo só passa a pertencer a um restaurante indiretamente, quando referenciado por `Produto.imagemUrl`) — continua liberado para qualquer `ADMIN_RESTAURANTE` autenticado, e a limpeza de órfãos continua global (`SUPER_ADMIN`).

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/uploads/produtos/imagem` | Enviar imagem de produto (`multipart/form-data`, campo `file`) e obter a URL pública para usar em `imagemUrl` |
| POST | `/api/admin/uploads/produtos/limpar-orfas?dryRun=true\|false` | Identificar (e, com `dryRun=false`, excluir) imagens em `uploads/produtos` sem referência em nenhum `Produto.imagemUrl` — apenas `SUPER_ADMIN`, limpeza manual, sem agendamento automático |

## Webhooks futuros

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/webhooks/pix` | Receber confirmação Pix futura |
| POST | `/api/webhooks/pagamentos` | Receber confirmações de provedores futuros |
