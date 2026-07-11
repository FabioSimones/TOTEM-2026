# Contratos de Dados da API

Revisado na TASK-041 para refletir os DTOs Java reais (antes desta revisão, este documento continha campos de um design inicial que nunca foram implementados — ver histórico do repositório). Os exemplos abaixo são representativos; para o contrato completo por campo, ver `docs/08-endpoints.md` e os próprios DTOs em `backend/src/main/java/com/totem/fastfood/dto/`.

## Autenticação — login, refresh e logout administrativo

### Login

`POST /api/auth/login` — sem mudança de contrato de request. A partir da TASK-063, a response passa a incluir `refreshToken`/`refreshExpiresIn`:

Request:

```json
{
  "email": "admin@totem.local",
  "senha": "Admin@2026!"
}
```

Response (`200 OK`):

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "8f2a1c9e...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshExpiresIn": 604800,
  "usuario": {
    "id": 1,
    "nome": "Super Administrador",
    "email": "admin@totem.local",
    "perfil": "SUPER_ADMIN",
    "restauranteId": null,
    "ativo": true
  }
}
```

`expiresIn`/`refreshExpiresIn` em segundos (`app.security.jwt.expiration-minutes`, padrão 60min; `app.security.jwt.refresh-expiration-days`, padrão 7 dias).

### Refresh token (TASK-063)

`POST /api/auth/refresh` — endpoint público (`permitAll`), mas a validação real é do `refreshToken` no corpo, não de um Bearer token. **Rotação**: o `refreshToken` informado é sempre revogado (uso único), mesmo em caso de sucesso — a resposta traz um `refreshToken` novo, que deve substituir o anterior no cliente.

Request:

```json
{
  "refreshToken": "8f2a1c9e..."
}
```

Response (`200 OK`) — mesmo formato de `LoginResponse`:

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "b7e40d21...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshExpiresIn": 604800,
  "usuario": { "...": "..." }
}
```

Erros (`401`, mesmo formato de `ApiError`, mensagem `"Refresh token inválido ou expirado"`): token inexistente, já revogado (usado antes, ou revogado por login/logout mais recente), expirado, ou pertencente a um usuário desativado.

### Logout (TASK-063)

`POST /api/auth/logout` — endpoint público (`permitAll`); revoga o `refreshToken` informado. **Idempotente**: token já revogado ou inexistente não retorna erro — sempre `204 No Content`.

Request:

```json
{
  "refreshToken": "8f2a1c9e..."
}
```

Response: `204 No Content`, sem corpo.

### Regras e limitações do MVP (TASK-063)

- **Um refresh token ativo por usuário.** Login novo revoga qualquer refresh token anterior do mesmo usuário — logar em uma segunda aba/dispositivo invalida a sessão da primeira na próxima tentativa de refresh (não afeta o `accessToken` já emitido, que continua válido até expirar por tempo; só o próximo `/refresh` da sessão antiga falhará).
- **Refresh token bruto nunca é persistido.** Só o hash SHA-256 (`RefreshToken.tokenHash`, coluna já existente desde a migration `V3`/TASK-010) fica no banco — o valor bruto existe apenas no cliente e na resposta HTTP no momento da emissão.
- **Refresh token não é JWT** — é uma string aleatória (`SecureRandom`, 32 bytes, Base64 URL-safe), sem claims, sem assinatura própria; só serve para ser trocada por um `accessToken` novo via `/refresh`.
- **Escopo**: só sessão de usuário humano administrativo. Dispositivos (Totem/Caixa/Cozinha) não têm refresh token — continuam com token único de longa duração e revogação via `ativo=false` no dispositivo (TASK-010 em diante).
- **Fora do escopo desta task** (deliberado): cookie HttpOnly, múltiplas sessões simultâneas por usuário, tela de "sessões ativas", "remember me", CSRF, refresh token para dispositivos.

## Rate limiting do login administrativo (TASK-065)

`POST /api/auth/login` bloqueia temporariamente novas tentativas para a mesma chave (email normalizado + IP remoto) após várias falhas consecutivas, reduzindo o risco de força bruta.

**Configuração** (`application.yml`, com defaults documentados):

```yaml
app:
  security:
    login-rate-limit:
      max-failures: 5      # ${LOGIN_RATE_LIMIT_MAX_FAILURES}
      block-minutes: 15    # ${LOGIN_RATE_LIMIT_BLOCK_MINUTES}
```

**Resposta ao exceder o limite** (`429 Too Many Requests`), mesmo formato `ApiError` do restante da API, mais o header `Retry-After` (segundos até o bloqueio expirar):

```json
{
  "timestamp": "2026-07-10T18:20:00",
  "status": 429,
  "error": "Muitas tentativas",
  "message": "Muitas tentativas de login. Tente novamente mais tarde.",
  "path": "/api/auth/login"
}
```

**Regras**:

- Cada falha de credencial (email inexistente, usuário inativo, ou senha errada — sem distinção, a mensagem de `401` já é genérica) incrementa o contador da chave `email normalizado (trim + lowercase) + IP remoto`. Ao atingir `max-failures`, a chave fica bloqueada por `block-minutes`.
- **Login bem-sucedido zera o contador** da chave. Um usuário que erra a senha algumas vezes e depois acerta não fica bloqueado.
- **Durante o bloqueio, mesmo a senha correta retorna `429`** — a checagem de rate limit acontece antes de validar a senha, então nem chega a tentar autenticar.
- A chave combina email **e** IP: tentativas de um mesmo email vindas de IPs diferentes (ou vice-versa) não se bloqueiam mutuamente sem necessidade.
- Erros de validação de request (`400`, ex.: email malformado, campo ausente) **não contam como falha** — o `@Valid` do Spring rejeita a requisição antes de o controller sequer invocar o rate limiter.
- A resposta nunca revela se o bloqueio foi causado por email inexistente ou senha errada — mesma filosofia do `401` de login.

**Limitações do MVP (deliberadas)**:

- **Em memória** (`ConcurrentHashMap` num `LoginAttemptService` singleton) — reiniciar a aplicação limpa todos os contadores; não há coordenação entre múltiplas instâncias/réplicas do backend (cada uma teria seu próprio contador).
- Não substitui um WAF, proxy reverso ou rate limiting de borda em produção — é uma proteção básica de MVP.
- `getRemoteAddr()` é usado diretamente para o IP — atrás de um proxy/load balancer sem configuração de `X-Forwarded-For`, todas as requisições apareceriam com o mesmo IP (o do proxy). Não implementado nesta task (fora de escopo — exigiria decidir em quais proxies confiar).
- Sem captcha, sem desbloqueio administrativo manual, sem tabela de tentativas no banco — tudo deliberadamente fora do escopo do MVP.

## Totem

### Criar pedido

`POST /api/totem/pedidos`

Request — o frontend nunca envia preço, subtotal, total ou `restauranteId` (vêm sempre do produto cadastrado e do dispositivo autenticado):

```json
{
  "tipoConsumo": "LOCAL",
  "clienteNome": "Fabio",
  "itens": [
    { "produtoId": 10, "quantidade": 1, "observacao": "Sem cebola" }
  ]
}
```

Response (`201 Created`):

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusPedido": "CRIADO",
  "tipoConsumo": "LOCAL",
  "clienteNome": "Fabio",
  "valorTotal": 39.90,
  "itens": [
    {
      "produtoId": 10,
      "nomeProduto": "Combo X-Burger",
      "quantidade": 1,
      "precoUnitario": 39.90,
      "subtotal": 39.90,
      "observacao": "Sem cebola"
    }
  ],
  "criadoEm": "2026-05-05T15:00:00"
}
```

### Consultar pedido

`GET /api/totem/pedidos/{id}` — mesmo formato de response da criação (usado pelo Totem para acompanhamento manual/polling).

### Iniciar pagamento

`POST /api/totem/pedidos/{id}/pagamento`

Request — só `formaPagamento` (`PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO` ou `DINHEIRO`); o frontend nunca envia valor:

```json
{
  "formaPagamento": "PIX"
}
```

Response (`201 Created`) — PIX/cartão retornam `statusPagamento=AUTORIZADO`/`statusPedido=PAGO`; dinheiro retorna `PENDENTE`/`AGUARDANDO_PAGAMENTO_DINHEIRO`:

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusPedido": "PAGO",
  "pagamentoId": 9001,
  "formaPagamento": "PIX",
  "statusPagamento": "AUTORIZADO",
  "valor": 39.90,
  "codigoAutorizacao": "FAKE-AUTH-123",
  "referenciaExterna": null,
  "mensagem": "Pagamento aprovado",
  "criadoEm": "2026-05-05T15:05:00"
}
```

## Caixa

### Listar pendências

`GET /api/caixa/pedidos/pendentes` — retorna pedidos do restaurante do dispositivo em `AGUARDANDO_PAGAMENTO_DINHEIRO`, `PAGO` ou `PRONTO` (a partir da TASK-040), cada um com `acaoSugerida`:

```json
[
  {
    "pedidoId": 1024,
    "numeroPedido": "A1024",
    "statusPedido": "AGUARDANDO_PAGAMENTO_DINHEIRO",
    "tipoConsumo": "LOCAL",
    "clienteNome": "Fabio",
    "valorTotal": 39.90,
    "criadoEm": "2026-05-05T15:00:00",
    "atualizadoEm": "2026-05-05T15:00:00",
    "acaoSugerida": "CONFIRMAR_PAGAMENTO",
    "itens": [
      { "produtoId": 10, "nomeProduto": "Combo X-Burger", "quantidade": 1, "observacao": null, "subtotal": 39.90 }
    ]
  }
]
```

Mapeamento de `acaoSugerida`: `AGUARDANDO_PAGAMENTO_DINHEIRO` → `CONFIRMAR_PAGAMENTO`; `PAGO` → `ENVIAR_PARA_COZINHA`; `PRONTO` → `MARCAR_RETIRADO`.

### Confirmar dinheiro

`POST /api/caixa/pedidos/{id}/confirmar-pagamento`

Request — só `observacao`, opcional. O Caixa nunca envia `formaPagamento`, `valorRecebido` ou qualquer valor monetário:

```json
{
  "observacao": "Pagamento recebido no caixa"
}
```

Response (`200 OK`):

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusPedido": "PAGO",
  "pagamentoId": 9001,
  "formaPagamento": "DINHEIRO",
  "statusPagamento": "AUTORIZADO",
  "valor": 39.90,
  "confirmadoEm": "2026-05-05T15:10:00"
}
```

### Enviar para a cozinha

`POST /api/caixa/pedidos/{id}/enviar-cozinha` — sem corpo de requisição. Exige pedido `PAGO`.

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusPedido": "ENVIADO_PARA_COZINHA",
  "valorTotal": 39.90,
  "enviadoParaCozinhaEm": "2026-05-05T15:12:00"
}
```

### Marcar como retirado

`POST /api/caixa/pedidos/{id}/retirar` — sem corpo de requisição. Exige pedido `PRONTO`.

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusAnterior": "PRONTO",
  "statusAtual": "RETIRADO",
  "atualizadoEm": "2026-05-05T15:40:00"
}
```

### Cancelar pedido

`POST /api/caixa/pedidos/{id}/cancelar` — permitido apenas em `CRIADO`, `AGUARDANDO_PAGAMENTO`, `AGUARDANDO_PAGAMENTO_DINHEIRO` ou `PAGO`.

Request — só `motivo`, obrigatório (3 a 500 caracteres):

```json
{
  "motivo": "Cliente desistiu do pedido"
}
```

Response (`200 OK`):

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusAnterior": "CRIADO",
  "statusAtual": "CANCELADO",
  "motivo": "Cliente desistiu do pedido",
  "atualizadoEm": "2026-05-05T15:02:00"
}
```

## Cozinha

### Listar pedidos

`GET /api/cozinha/pedidos` — retorna pedidos `ENVIADO_PARA_COZINHA`/`EM_PREPARO` do restaurante, sem nenhum campo financeiro (sem `valorTotal`/`precoUnitario`/`subtotal`).

### Atualizar status na cozinha

`PATCH /api/cozinha/pedidos/{id}/status` — transições permitidas: `ENVIADO_PARA_COZINHA → EM_PREPARO` e `EM_PREPARO → PRONTO` (nenhuma outra, inclusive não permite pular etapa nem regredir).

Request:

```json
{
  "statusPedido": "EM_PREPARO",
  "observacao": "Preparo iniciado"
}
```

Response (`200 OK`):

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusAnterior": "ENVIADO_PARA_COZINHA",
  "statusAtual": "EM_PREPARO",
  "atualizadoEm": "2026-05-05T15:15:00"
}
```

## Admin — Dispositivos

### Atualizar dispositivo

`PUT /api/admin/dispositivos/{id}` — implementado na TASK-051. Exige perfil `SUPER_ADMIN` ou `ADMIN_RESTAURANTE`. **Não aceita `restauranteId`** (dispositivo não muda de restaurante por edição — mesma decisão já tomada em Categoria/Produto) nem `ativo`, `ativado` ou `codigoAtivacao`:

```json
{
  "nome": "Totem 01",
  "codigoIdentificacao": "TOTEM_01",
  "tipoDispositivo": "TOTEM"
}
```

Response (`200 OK`) — mesmo formato de `DispositivoResponse` usado em `POST`/`GET`/`PATCH`, incluindo o `codigoAtivacao` já existente (não regenerado pela edição):

```json
{
  "id": 3,
  "restauranteId": 1,
  "nome": "Totem 01",
  "codigoIdentificacao": "TOTEM_01",
  "tipoDispositivo": "TOTEM",
  "ativo": true,
  "ativado": false,
  "codigoAtivacao": "aB3x...",
  "ultimoAcesso": null,
  "ativadoEm": null,
  "criadoEm": "2026-05-05T15:00:00",
  "atualizadoEm": "2026-05-05T15:20:00"
}
```

## Admin — Usuários

Implementado na TASK-048. Todos os endpoints exigem perfil `SUPER_ADMIN`.

### Cadastrar usuário

`POST /api/admin/usuarios`

Request — `restauranteId` é **obrigatório** para todo perfil exceto `SUPER_ADMIN` (que nunca pode ter restaurante, sob pena de `400`); `ativo` é opcional (padrão `true`):

```json
{
  "restauranteId": 1,
  "nome": "Operador Caixa",
  "email": "caixa@totem.local",
  "senha": "Senha@2026!",
  "perfil": "OPERADOR_CAIXA",
  "ativo": true
}
```

Response (`201 Created`) — nunca inclui `senha`/`senhaHash`:

```json
{
  "id": 5,
  "restauranteId": 1,
  "nome": "Operador Caixa",
  "email": "caixa@totem.local",
  "perfil": "OPERADOR_CAIXA",
  "ativo": true,
  "criadoEm": "2026-05-05T15:00:00",
  "atualizadoEm": null
}
```

### Listar usuários

`GET /api/admin/usuarios[?restauranteId=]` — mesmo formato de resposta da criação, em lista. Sem filtro, retorna usuários de todos os restaurantes (incluindo `SUPER_ADMIN`).

### Atualizar usuário

`PUT /api/admin/usuarios/{id}` — mesmas regras de `restauranteId` por perfil. **Nunca** aceita `senha` ou `ativo` (ver endpoints dedicados abaixo):

```json
{
  "restauranteId": 1,
  "nome": "Operador de Caixa",
  "email": "caixa@totem.local",
  "perfil": "OPERADOR_CAIXA"
}
```

### Ativar / desativar usuário

`PATCH /api/admin/usuarios/{id}/ativar` e `PATCH /api/admin/usuarios/{id}/desativar` — sem corpo de requisição, retornam o mesmo formato de `UsuarioAdminResponse`. Desativar o próprio usuário autenticado é bloqueado com `400`.

### Alterar senha do usuário

`PATCH /api/admin/usuarios/{id}/senha` — implementado na TASK-049. Único campo aceito é `novaSenha` (o admin nunca informa/conhece a senha atual):

```json
{
  "novaSenha": "NovaSenha@2026!"
}
```

Response (`200 OK`) — mesmo formato de `UsuarioAdminResponse`, nunca inclui `senha`/`senhaHash`:

```json
{
  "id": 5,
  "restauranteId": 1,
  "nome": "Operador Caixa",
  "email": "caixa@totem.local",
  "perfil": "OPERADOR_CAIXA",
  "ativo": true,
  "criadoEm": "2026-05-05T15:00:00",
  "atualizadoEm": "2026-05-05T15:20:00"
}
```

`novaSenha` segue a mesma validação de `senha` no cadastro (`@NotBlank`, 8 a 100 caracteres). Não força logout do usuário alterado nem invalida tokens já emitidos (sem infraestrutura de revogação de token para usuários humanos — mesma limitação já documentada em `docs/testes-backend-mvp.md`).

## Admin — Pedidos (TASK-068)

Somente leitura — não altera status, pagamento nem qualquer dado do pedido (isso continua exclusivo do fluxo operacional Totem/Caixa/Cozinha). Exige perfil `SUPER_ADMIN` ou `ADMIN_RESTAURANTE`, com o mesmo escopo por restaurante da TASK-058: `SUPER_ADMIN` vê/lista tudo; `ADMIN_RESTAURANTE` só vê pedidos do próprio restaurante (`restauranteId` de outro restaurante, na listagem ou implícito no detalhe, retorna `403`).

### Listar pedidos

`GET /api/admin/pedidos[?restauranteId=][&statusPedido=]`

- `restauranteId`: `SUPER_ADMIN` pode informar qualquer um ou omitir (retorna todos); `ADMIN_RESTAURANTE` só pode informar o próprio (ou omitir — sempre fica restrito ao próprio de qualquer forma).
- `statusPedido`: filtra por um dos valores de `StatusPedido` (`CRIADO`, `AGUARDANDO_PAGAMENTO`, `AGUARDANDO_PAGAMENTO_DINHEIRO`, `PAGO`, `ENVIADO_PARA_COZINHA`, `EM_PREPARO`, `PRONTO`, `RETIRADO`, `CANCELADO`, `EXPIRADO`). Valor inválido retorna `400`.
- Resultado ordenado do mais recente para o mais antigo (`criadoEm desc`).

Response (`200 OK`):

```json
[
  {
    "pedidoId": 42,
    "numeroPedido": "A42",
    "restauranteId": 1,
    "restauranteNome": "Lanchonete Central",
    "clienteNome": "Cliente Teste",
    "tipoConsumo": "LOCAL",
    "statusPedido": "PAGO",
    "valorTotal": 51.80,
    "criadoEm": "2026-07-10T18:51:53.268448",
    "atualizadoEm": "2026-07-10T18:51:53.28396"
  }
]
```

### Consultar detalhes do pedido

`GET /api/admin/pedidos/{id}` — mesmos campos do resumo acima, mais `itens`, `pagamentos` e `historico`:

```json
{
  "pedidoId": 42,
  "numeroPedido": "A42",
  "restauranteId": 1,
  "restauranteNome": "Lanchonete Central",
  "clienteNome": "Cliente Teste",
  "tipoConsumo": "LOCAL",
  "statusPedido": "RETIRADO",
  "valorTotal": 51.80,
  "criadoEm": "2026-07-10T18:51:53.268448",
  "atualizadoEm": "2026-07-10T18:55:10.10000",
  "itens": [
    {
      "produtoId": 4,
      "nomeProduto": "X-Burger",
      "quantidade": 2,
      "precoUnitario": 25.90,
      "subtotal": 51.80,
      "observacao": "Sem cebola"
    }
  ],
  "pagamentos": [
    {
      "id": 7,
      "formaPagamento": "PIX",
      "statusPagamento": "AUTORIZADO",
      "valor": 51.80,
      "paymentProvider": "FAKE",
      "externalPaymentId": "FAKE-...",
      "criadoEm": "2026-07-10T18:51:53.28",
      "pagoEm": "2026-07-10T18:51:53.28",
      "canceladoEm": null
    }
  ],
  "historico": [
    { "statusAnterior": null, "statusNovo": "CRIADO", "dataAlteracao": "...", "observacao": "Pedido criado pelo Totem", "alteradoPorUsuarioNome": null, "alteradoPorDispositivoNome": "Totem Loja 1" },
    { "statusAnterior": "CRIADO", "statusNovo": "PAGO", "dataAlteracao": "...", "observacao": "Pagamento iniciado pelo Totem: PIX", "alteradoPorUsuarioNome": null, "alteradoPorDispositivoNome": "Totem Loja 1" }
  ]
}
```

`404` se o pedido não existir; `403` se pertencer a um restaurante fora do escopo do `ADMIN_RESTAURANTE` autenticado.

**Fora do escopo desta task**: edição de pedido, alteração de status pelo Admin, cancelamento pelo Admin, exportação, paginação (a listagem retorna todos os pedidos do escopo de uma vez — aceitável para o volume esperado do MVP; deve ser revisto se o histórico crescer muito).

## Admin — Expiração de pedidos (TASK-070)

Pedidos não pagos podem ficar indefinidamente em estados iniciais se o cliente abandonar o totem antes de pagar. A expiração automática/manual resolve isso sem tocar em pagamento, estorno ou pedidos já operacionais.

**Status elegíveis** (não pagos, "presos" antes da confirmação): `CRIADO`, `AGUARDANDO_PAGAMENTO`, `AGUARDANDO_PAGAMENTO_DINHEIRO`. **Nunca expira**: `PAGO`, `ENVIADO_PARA_COZINHA`, `EM_PREPARO`, `PRONTO`, `RETIRADO`, `CANCELADO`, `EXPIRADO` (idempotente — um pedido já expirado não é candidato de novo).

**Critério de idade**: `Pedido.criadoEm` (`@CreationTimestamp`) mais antigo que `app.pedidos.expiracao.minutos` (padrão 30min) a partir do momento da execução (job ou chamada manual).

**Configuração** (`application.yml`):

```yaml
app:
  pedidos:
    expiracao:
      minutos: 30              # ${PEDIDO_EXPIRACAO_MINUTOS}
      job-enabled: true        # ${PEDIDO_EXPIRACAO_JOB_ENABLED}
      job-fixed-delay-ms: 60000 # ${PEDIDO_EXPIRACAO_JOB_DELAY_MS}
```

**Job automático**: `PedidoExpiracaoJob`, executa a cada `job-fixed-delay-ms` (padrão 60s) enquanto `job-enabled=true`. Uma falha em uma execução é logada e não derruba a aplicação nem impede a próxima execução. Nos testes de integração, o job vem desligado (`job-enabled=false` em `application-test.yml`) para não expirar pedidos criados durante os cenários de teste.

### Expirar pedidos vencidos (manual)

`POST /api/admin/pedidos/expirar-vencidos` — exige perfil `SUPER_ADMIN` (mais restrito que a listagem de pedidos: ação em massa, afeta qualquer restaurante). Sem corpo de requisição.

Response (`200 OK`):

```json
{
  "pedidosExpirados": 3
}
```

**Histórico**: cada pedido expirado gera um registro em `HistoricoStatusPedido` com `statusAnterior` = status anterior à expiração, `statusNovo=EXPIRADO`, `observacao="Pedido expirado automaticamente por falta de pagamento."` e ambos `alteradoPorUsuario`/`alteradoPorDispositivo` nulos (ação do sistema, não de uma pessoa/dispositivo específico).

**Fora do escopo desta task**: estorno de pagamento (nunca acontece — pedido `PAGO` não expira), exclusão do pedido/itens/pagamentos, fila externa (SQS/RabbitMQ), regras de expiração diferentes por restaurante, tela nova no frontend (o painel Admin Pedidos já exibe `EXPIRADO` por já listar qualquer valor de `StatusPedido`, sem alteração necessária).

## Admin — Uploads

Implementado na TASK-053. Armazenamento local em disco (`app.uploads.dir`, padrão `uploads/`, configurável por variável de ambiente `UPLOAD_DIR`) — **em produção deve ser substituído por storage externo** (S3, Cloudinary ou equivalente). Os arquivos salvos ficam acessíveis publicamente sob `app.uploads.public-path` (padrão `/uploads`), ex.: `http://localhost:8080/uploads/produtos/<uuid>.png`.

### Enviar imagem de produto

`POST /api/admin/uploads/produtos/imagem` — exige perfil `SUPER_ADMIN` ou `ADMIN_RESTAURANTE`.

Request — `multipart/form-data`, campo `file`:

- Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`.
- Tamanho máximo: **5MB**.
- O nome do arquivo original **não é usado** — o backend gera um nome próprio (`UUID` + extensão derivada do content-type).
- **O backend não confia apenas no `Content-Type` declarado pelo cliente** (implementado na TASK-054): o conteúdo do arquivo é lido e comparado à assinatura binária (magic bytes) esperada para o tipo informado — JPEG começa com `FF D8 FF`, PNG com `89 50 4E 47 0D 0A 1A 0A`, e WEBP tem o contêiner RIFF (`RIFF` no offset 0, `WEBP` no offset 8). Um arquivo com `Content-Type: image/png` mas conteúdo binário de outro formato (ou não-imagem) é rejeitado com `400`, mesmo que a extensão/Content-Type pareçam válidos.

Response (`201 Created`):

```json
{
  "filename": "1b2c3d4e-...-uuid.webp",
  "url": "/uploads/produtos/1b2c3d4e-...-uuid.webp",
  "contentType": "image/webp",
  "size": 45210
}
```

A `url` retornada é o valor a preencher em `imagemUrl` ao criar/atualizar um produto — **o contrato de `POST`/`PUT /api/admin/produtos` não muda**, continua recebendo `imagemUrl` como string opcional.

Erros (`400`): arquivo ausente/vazio, tipo de arquivo não permitido, conteúdo binário incompatível com o `Content-Type` declarado (spoofing), ou arquivo acima de 5MB — todos seguem o formato padrão de erro abaixo, sem expor caminho de disco/detalhe interno (a mensagem é sempre genérica; o caminho completo só aparece em log de servidor, nunca na resposta HTTP).

**Nota de segurança (TASK-054)**: o armazenamento local em disco é uma decisão de MVP — os arquivos ficam publicamente acessíveis em `/uploads/**` sem autenticação (apenas o upload em si exige login admin) e sem qualquer verificação de malware. Em produção, isso deve ser substituído por um storage externo (S3, Cloudinary ou equivalente) e, se o risco justificar, complementado por um scan de antivírus antes de disponibilizar o arquivo publicamente — nenhum dos dois foi implementado nesta task.

**Nota de correção (TASK-055)**: a validação em ambiente real encontrou `SecurityConfig` bloqueando `/uploads/**` com `401`/`403` mesmo sem exigir isso na regra de negócio (só `anyRequest().authenticated()` cobria o path, sem exceção para o resource handler estático) — corrigido para liberar `app.uploads.public-path` (`/uploads/**`) como público, conforme já documentado acima.

### Limpar uploads órfãos de produto

Implementado na TASK-056. `POST /api/admin/uploads/produtos/limpar-orfas` — exige perfil `SUPER_ADMIN` (mais restrito que o upload em si: excluir arquivos do storage é uma operação sensível, diferente de apenas enviar uma imagem).

Query param `dryRun` (padrão `true`, por segurança):

- `dryRun=true` (ou omitido): identifica imagens órfãs em `uploads/produtos` e retorna o relatório, **sem excluir nada**.
- `dryRun=false`: identifica **e exclui** os arquivos órfãos, retornando o relatório da execução real.

Uma imagem é considerada órfã quando o arquivo existe em `uploads/produtos` mas seu path público (`/uploads/produtos/<filename>`) não aparece em nenhum `Produto.imagemUrl` do banco — cobre `imagemUrl` salva como path relativo (`/uploads/produtos/arquivo.png`) ou como URL absoluta (`http://localhost:8080/uploads/produtos/arquivo.png`, ou o domínio de produção equivalente). URLs externas que não apontam para `/uploads/produtos` (ex.: `https://exemplo.com/imagem.png`) nunca são candidatas a exclusão — a varredura só considera arquivos físicos dentro do diretório de uploads local.

Response (`200 OK`) em ambos os modos, mesmo formato:

```json
{
  "arquivosEncontrados": 5,
  "arquivosReferenciados": 3,
  "arquivosOrfaos": 2,
  "arquivosExcluidos": 2,
  "falhas": 0,
  "dryRun": false,
  "detalhes": [
    {
      "filename": "1b2c3d4e-...-uuid.png",
      "pathRelativo": "/uploads/produtos/1b2c3d4e-...-uuid.png",
      "excluido": true,
      "motivoFalha": null
    }
  ]
}
```

Em `dryRun=true`, `excluido` é sempre `false` nos itens de `detalhes` (nenhuma exclusão ocorre) e `arquivosExcluidos` é sempre `0`. `falhas` conta itens que eram órfãos mas não puderam ser excluídos (ex.: erro de I/O) — a falha em um arquivo não interrompe a exclusão dos demais. A varredura só considera arquivos regulares (sem seguir symlink) diretamente em `uploads/produtos` com extensão `.jpg`/`.jpeg`/`.png`/`.webp`; subdiretórios e outras extensões são ignorados. Se o diretório não existir, o relatório retorna zerado em todos os campos, sem erro.

**Fora do escopo desta task**: exclusão automática no momento de atualizar/trocar a `imagemUrl` de um produto (arriscado se duas entidades referenciarem a mesma imagem), agendamento/scheduler automático, e qualquer integração com storage externo.

## Escopo por restaurante para ADMIN_RESTAURANTE

Implementado na TASK-058, cobrindo Categorias, Produtos e Dispositivos (`/api/admin/categorias`, `/api/admin/produtos`, `/api/admin/dispositivos`).

**Regra**: `SUPER_ADMIN` continua com acesso irrestrito a qualquer restaurante. `ADMIN_RESTAURANTE` só pode consultar, criar, atualizar ou inativar/revogar recursos vinculados ao restaurante do seu próprio usuário — mesmo que informe um `restauranteId` diferente no corpo da requisição ou no filtro de listagem, a operação é bloqueada.

- **Criar** (`POST`): o `restauranteId` do corpo é validado contra o restaurante do usuário autenticado antes de qualquer outra regra de negócio. Tentar criar em outro restaurante retorna `403`.
- **Listar** (`GET`): se `ADMIN_RESTAURANTE` não informar `restauranteId`, a listagem é automaticamente restrita ao próprio restaurante (não retorna "todos"). Se informar um `restauranteId` diferente do seu, retorna `403`. `SUPER_ADMIN` mantém o comportamento anterior (sem filtro = todos os restaurantes).
- **Atualizar/inativar/revogar/reativar** (`PUT`/`DELETE`/`PATCH`): o recurso é buscado por `id` normalmente (`404` se não existir); em seguida o restaurante do recurso encontrado é validado contra o do usuário autenticado (`403` se for de outro restaurante). A ordem importa: recurso inexistente sempre é `404`, recurso de outro restaurante é `403`.

**Como o backend descobre o restaurante do `ADMIN_RESTAURANTE`**: o JWT de usuário humano já carrega `restauranteId` como claim, mas o filtro de autenticação não o utiliza — em vez de alterar login/geração de token, o backend resolve o restaurante buscando o usuário por email (`Authentication.getName()`) a cada validação de escopo (`AdminScopeService`). Login e emissão de token não foram alterados.

**Fora do escopo desta task**: `/api/admin/usuarios` continua exclusivo de `SUPER_ADMIN` (não recebeu escopo por restaurante — gestão de usuários é mais sensível). Upload de imagem (`/api/admin/uploads/produtos/imagem`) continua liberado a qualquer `ADMIN_RESTAURANTE` sem checagem de restaurante (o arquivo em si não pertence a um restaurante até ser referenciado por um produto); a limpeza de órfãos (`/limpar-orfas`) continua `SUPER_ADMIN` apenas.

**Frontend (TASK-059)**: o painel administrativo (`frontend/`) passou a refletir essa regra visualmente — `ADMIN_RESTAURANTE` não vê seletor de restaurante em Categorias/Produtos/Dispositivos (o campo aparece fixo, sem depender de `GET /api/admin/restaurantes`, que é `SUPER_ADMIN` apenas) e o painel `/admin` esconde os cards "Restaurantes"/"Usuários" para quem não é `SUPER_ADMIN`. Isso é só uma melhoria de UX — o contrato da API e a validação de escopo continuam inteiramente no backend, exatamente como documentado acima.

## Erro padrão

Todo erro (400/401/403/404/500) segue o mesmo formato:

```json
{
  "timestamp": "2026-05-05T15:10:22",
  "status": 400,
  "error": "Requisição inválida",
  "message": "Pedido não está pago e não pode ser enviado para a cozinha. Status atual: CRIADO",
  "path": "/api/caixa/pedidos/1024/enviar-cozinha",
  "errors": null
}
```

`errors` só é preenchido em erros de validação de campo (`400` por `@Valid`/Bean Validation), como uma lista de `{"campo": "...", "mensagem": "..."}` — um item por campo inválido.

Produzido por `GlobalExceptionHandler` (`@RestControllerAdvice`) para exceções lançadas dentro do controller/service, e por `RestAuthenticationEntryPoint` (TASK-061) para o caso específico de requisição não autenticada — ambos usam o mesmo formato `ApiError`.

### 401 vs. 403 (TASK-061)

Semântica corrigida na TASK-061 (antes, token ausente/inválido retornava `403` com corpo vazio, indistinguível de "autenticado mas sem permissão" — achado registrado na TASK-060):

- **`401 Unauthorized`** — **não autenticado**: nenhum token enviado, token malformado, assinatura inválida ou expirado. Produzido por `RestAuthenticationEntryPoint`, registrado em `SecurityConfig` via `.exceptionHandling(handling -> handling.authenticationEntryPoint(...))`. Também usado por `GlobalExceptionHandler` para credenciais inválidas em `POST /api/auth/login` (mensagem específica "Email ou senha inválidos", sem revelar qual campo errou).
- **`403 Forbidden`** — **autenticado, mas sem permissão**: perfil/tipo de dispositivo sem a role exigida (`@PreAuthorize`) ou violação de escopo por restaurante (`AdminScopeService`, TASK-058). Continua vindo de `GlobalExceptionHandler.handleAccessDenied`, sem mudança nesta task.

Nenhuma regra de autorização mudou — só a semântica do código HTTP para "sem autenticação válida". Isso permite ao frontend distinguir corretamente sessão inválida/expirada (`401` → limpar sessão e pedir novo login) de falta de permissão (`403` → manter sessão, mostrar mensagem de acesso negado).
