# Contratos de Dados da API

Revisado na TASK-041 para refletir os DTOs Java reais (antes desta revisão, este documento continha campos de um design inicial que nunca foram implementados — ver histórico do repositório). Os exemplos abaixo são representativos; para o contrato completo por campo, ver `docs/08-endpoints.md` e os próprios DTOs em `backend/src/main/java/com/totem/fastfood/dto/`.

## Padronização de fuso horário (TASK-079)

**Regra oficial: o backend opera inteiramente em UTC.** Todo campo de data/hora exposto pela API (`criadoEm`, `atualizadoEm`, `ativadoEm`, `revogadoEm`, `ultimoAcesso`, `dataAlteracao`, `pagoEm`, `canceladoEm`, `timestamp` de erro, etc.) é gravado e deve ser interpretado como **UTC**, independentemente de onde o backend estiver rodando.

**Como isso é garantido**:
- O fuso padrão da JVM é fixado para UTC em um bloco estático de `TotemApplication` (`TimeZone.setDefault(TimeZone.getTimeZone("UTC"))`), executado antes de qualquer código de aplicação — inclusive antes do Hibernate gerar o primeiro `@CreationTimestamp`/`@UpdateTimestamp`.
- `Clock.systemUTC()` (bean único em `ClockConfig`, usado por `PedidoExpiracaoService`, `DashboardAdminService`, `LoginAttemptService`, `DispositivoMapper`, `DispositivoAcessoService`, `DispositivoService`) permanece a fonte oficial de "agora" para toda regra de negócio.
- `spring.jpa.properties.hibernate.jdbc.time_zone: UTC` e `spring.jackson.time-zone: UTC` complementam a configuração (efeito prático limitado para os campos `LocalDateTime` atuais, que não carregam informação de fuso — mantidos por documentação explícita da intenção e por segurança caso o projeto passe a usar `Instant`/`OffsetDateTime` no futuro).

**Bug real encontrado e corrigido nesta task**: antes da TASK-079, campos automáticos do Hibernate (`@CreationTimestamp`/`@UpdateTimestamp`, presentes em toda entidade) eram gravados no fuso padrão da JVM do processo (ex.: `America/Sao_Paulo`, confirmado em ambiente real), enquanto `Clock.systemUTC()` já era UTC desde tasks anteriores. Isso causava uma mistura de fusos dentro do mesmo registro — e, mais grave, **`PedidoExpiracaoService` comparava `Pedido.criadoEm` (fuso local) contra um limite calculado em UTC**, fazendo pedidos recém-criados serem elegíveis para expiração automática quase instantaneamente em vez de após `app.pedidos.expiracao.minutos` (30min por padrão). Validado ao vivo contra backend real + PostgreSQL real: um pedido criado às `19:52:18` (hora local da JVM) apareceu `EXPIRADO` às `19:53:05` — **47 segundos depois**, não 30 minutos. Após a correção, o mesmo cenário (pedido criado e aguardado por mais de um ciclo do job de expiração) manteve o pedido em `CRIADO`, como esperado. Ver `docs/testes-backend-mvp.md` para o detalhamento completo da investigação e validação.

**Não migrado nesta task (deliberado)**: nenhuma entidade trocou `LocalDateTime` por `Instant`/`OffsetDateTime`; nenhum contrato de API mudou de formato; nenhuma migration de dados foi criada (ambiente de desenvolvimento, poucos registros de teste, sem necessidade). Os campos automáticos (`@CreationTimestamp`/`@UpdateTimestamp`) continuam `LocalDateTime` por simplicidade do MVP — a padronização de fuso já resolve a inconsistência sem exigir essa migração maior.

**Implicação para o frontend, corrigida na TASK-080**: como `LocalDateTime` serializa em JSON sem sufixo `Z`/offset (ex.: `"2026-07-12T23:04:55.882065"`), o `new Date(valor)` puro do navegador interpretaria essa string como **hora local do navegador**, não como UTC explícito — em um navegador configurado para `America/Sao_Paulo`, os valores apareceriam ~3h **adiantados** em relação ao horário real de Brasília. A TASK-080 corrigiu isso **inteiramente no frontend**, sem tocar no backend: todo valor de data/hora vindo da API passa por `parseBackendUtcDateTime` (`frontend/src/utils/dateTime.ts`), que acrescenta `Z` a strings sem offset antes de construir o `Date`, tratando-as corretamente como UTC — o navegador então converte para o fuso local do usuário automaticamente ao formatar. Ver `frontend/README.md` para o detalhamento da correção.

**Migração futura recomendada (fora do escopo da TASK-080)**: o backend passar a serializar esses campos com offset explícito (`Instant`/`OffsetDateTime` em vez de `LocalDateTime`) tornaria esse utilitário de "adivinhação" no frontend desnecessário — a série de correções nas TASK-078/079/080 resolveu a inconsistência de fuso sem essa migração maior, mas ela continua sendo a solução mais robusta a longo prazo.

**Contadores "hoje" do Dashboard continuam em UTC nesta task** (não em `America/Sao_Paulo`) — mesma limitação já documentada desde a TASK-074. Corrigir isso, se desejado, deve ser uma task dedicada.

## Autenticação — login, refresh e logout

### Login

`POST /api/auth/login` — sem mudança de contrato de request. A partir da TASK-063, a response passa a incluir `refreshToken`/`refreshExpiresIn`:

Request:

```json
{
  "email": "admin@totem.local",
  "senha": "Admin@2026!"
}
```

Exemplo ilustrativo do formato do corpo — não é uma credencial válida por padrão desde a TASK-096 (ver `docs/04-seguranca.md` e `README.md` seção "Primeiro acesso administrativo").

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

`POST /api/auth/refresh` — endpoint público (`permitAll`), mas a validação real é do `refreshToken` no corpo, não de um Bearer token. **Rotação**: o `refreshToken` informado é sempre revogado (uso único), mesmo em caso de sucesso — a resposta traz um `refreshToken` novo, que deve substituir o anterior no cliente. O titular pode ser usuário ou dispositivo; para dispositivo, `usuario` é `null` e `dispositivo` é preenchido.

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

- **Um refresh token ativo por titular.** Login/ativação novos revogam qualquer refresh token anterior do mesmo usuário/dispositivo — isso não afeta o `accessToken` já emitido, que continua válido até expirar por tempo.
- **Refresh token bruto nunca é persistido.** Só o hash SHA-256 (`RefreshToken.tokenHash`, coluna já existente desde a migration `V3`/TASK-010) fica no banco — o valor bruto existe apenas no cliente e na resposta HTTP no momento da emissão.
- **Refresh token não é JWT** — é uma string aleatória (`SecureRandom`, 32 bytes, Base64 URL-safe), sem claims, sem assinatura própria; só serve para ser trocada por um `accessToken` novo via `/refresh`.
- **Escopo**: refresh tokens de dispositivo são revogados ao regenerar o código de ativação. O access token JWT antigo é stateless e pode continuar válido até expirar; a próxima renovação exigirá o código novo.
- **Fora do escopo** (deliberado): cookie HttpOnly, múltiplas sessões simultâneas por titular, tela de "sessões ativas", "remember me", CSRF.

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

## Login operacional de operador (TASK-092)

Implementa o Modelo C decidido na TASK-091: dispositivo continua sendo a autenticação principal e única exigida por `/api/caixa/**`/`/api/cozinha/**`; o operador humano é uma camada **adicional e opcional** de auditoria, identificada dentro de uma sessão de dispositivo já ativa.

### Identificar operador

`POST /api/auth/operador/login` — **não é público**: exige `Authorization: Bearer <accessToken do dispositivo>` de um dispositivo `CAIXA` ou `COZINHA` já autenticado (`@PreAuthorize("hasAnyRole('DEVICE_CAIXA', 'DEVICE_COZINHA')")`). Dispositivo `TOTEM`/`ADMINISTRACAO` recebe `403` automaticamente, sem lógica adicional.

Request:

```json
{
  "email": "operador@restaurante.com",
  "senha": "Senha@2026!"
}
```

Response (`200 OK`):

```json
{
  "operadorToken": "eyJhbGciOiJIUzUxMiJ9...",
  "expiresIn": 1800,
  "operador": {
    "id": 10,
    "nome": "João",
    "email": "operador@restaurante.com",
    "perfil": "OPERADOR_CAIXA",
    "restauranteId": 1
  }
}
```

**Regras de compatibilidade perfil × tipo de dispositivo**:

| Dispositivo | Perfis aceitos |
|---|---|
| CAIXA | `OPERADOR_CAIXA`, `ADMIN_RESTAURANTE` |
| COZINHA | `OPERADOR_COZINHA`, `ADMIN_RESTAURANTE` |
| TOTEM/ADMINISTRACAO | nenhum — `403` antes mesmo de validar credenciais (bloqueado pelo `@PreAuthorize` do controller) |

`SUPER_ADMIN` **nunca** pode operar loja (decisão de produto da TASK-092) — sempre `403`, independentemente do tipo de dispositivo. Operador precisa pertencer ao **mesmo restaurante** do dispositivo (`Usuario.restaurante.id == Dispositivo.restaurante.id`) — de outro restaurante, `403`.

**Erros**:

- `401` — token de dispositivo ausente/inválido (endpoint não é público), ou email/senha do operador inválidos, ou usuário inativo (mesmo padrão de `/api/auth/login`: mensagem genérica "Email ou senha inválidos", não distingue os dois casos).
- `403` — dispositivo `TOTEM`/`ADMINISTRACAO`; perfil incompatível com o tipo do dispositivo (`OPERADOR_CAIXA` numa `COZINHA` ou vice-versa); `SUPER_ADMIN`; ou operador de outro restaurante.

**Token de operador**: JWT curto (`app.security.jwt.operador-expiration-minutes`, padrão 30 minutos) e **sem refresh** — quando expira, o operador precisa se identificar de novo. Claims: `tipo=OPERADOR`, `operadorId`, `perfil`, `restauranteId`, `dispositivoId`, `tipoDispositivo`. Não é persistido em `RefreshToken` (diferente dos tokens de usuário/dispositivo) — não há tabela nem endpoint de revogação; expira sozinho.

### Usar o token de operador nas ações de Caixa/Cozinha

As 5 ações abaixo aceitam **opcionalmente** o header `X-Operador-Token` — sem ele, comportamento idêntico ao anterior à TASK-092 (`HistoricoStatusPedido.alteradoPorUsuario` fica `null`):

- `POST /api/caixa/pedidos/{id}/confirmar-pagamento`
- `POST /api/caixa/pedidos/{id}/enviar-cozinha`
- `POST /api/caixa/pedidos/{id}/retirar`
- `POST /api/caixa/pedidos/{id}/cancelar`
- `PATCH /api/cozinha/pedidos/{id}/status`

Quando o header está presente, o backend (`OperadorContextService`) recarrega o `Usuario` do banco (nunca confia só no claim do JWT — mesmo padrão de `JwtAuthenticationFilter` para dispositivo) e **revalida perfil/restaurante contra o dispositivo autenticado da requisição atual**, não o da emissão do token:

- Token ausente/malformado/expirado, ou operador não existe mais/foi desativado → `401`.
- Token válido, mas perfil incompatível com o tipo do dispositivo atual, ou restaurante diferente → `403`. Isso cobre inclusive o caso de um `X-Operador-Token` emitido para um dispositivo COZINHA sendo reenviado numa ação do CAIXA (ou vice-versa).
- Token válido e compatível → a ação prossegue normalmente e `HistoricoStatusPedido.alteradoPorUsuario` é preenchido, além de `alteradoPorDispositivo` (já preenchido desde sempre).

**Fora do escopo desta task** (deliberado): PIN de operador (fica email/senha por enquanto), refresh token de operador, WebSocket/notificação de troca de operador, e preenchimento de `alteradoPorUsuario` no fluxo do Totem (cliente não é um `Usuario` do sistema).

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

## Admin — Dispositivos (gestão operacional, TASK-077)

`ultimoAcesso` já existia na entidade `Dispositivo` desde a TASK-002/V2 (coluna `ultimo_acesso`), mas nunca era atualizado após a ativação — só refletia o momento em que o dispositivo trocou o código de ativação pelo token. A TASK-077 passou a atualizá-lo de verdade a cada requisição autenticada de dispositivo, e adicionou um status operacional derivado para o Admin ter uma visão rápida de uso — **não é presença em tempo real** (sem WebSocket, sem heartbeat): reflete apenas a última requisição autenticada já processada pelo backend.

### Campo novo em `DispositivoResponse`

`GET`/`POST`/`PUT`/`PATCH /api/admin/dispositivos*` — a resposta ganhou `statusOperacional`, sempre calculado, nunca persistido:

```json
{
  "id": 3,
  "restauranteId": 1,
  "nome": "Totem 01",
  "codigoIdentificacao": "TOTEM_01",
  "tipoDispositivo": "TOTEM",
  "ativo": true,
  "ativado": true,
  "codigoAtivacao": null,
  "ultimoAcesso": "2026-07-12T18:40:00",
  "ativadoEm": "2026-07-12T18:00:00",
  "criadoEm": "2026-07-12T17:55:00",
  "atualizadoEm": "2026-07-12T18:40:00",
  "statusOperacional": "USADO_RECENTEMENTE"
}
```

**Regra de derivação** (`DispositivoMapper`, ordem de avaliação):

1. `ativo=false` → **`REVOGADO`** (revogado administrativamente — independe de `ultimoAcesso`).
2. `ultimoAcesso=null` → **`NUNCA_USADO`** (habilitado, mas nunca autenticou uma requisição).
3. `ultimoAcesso` dentro dos últimos `app.dispositivos.online-recente-minutos` (padrão **5 minutos**, `${DISPOSITIVO_ONLINE_RECENTE_MINUTOS:5}`) → **`USADO_RECENTEMENTE`**.
4. Caso contrário → **`ATIVO`** (habilitado, já usado alguma vez, mas não recentemente).

### Atualização de `ultimoAcesso`

- Feita em `DispositivoAcessoService.registrarAcesso`, chamado só de `JwtAuthenticationFilter.autenticarDispositivo` — **nunca** no caminho de autenticação de usuário humano (admin não atualiza `ultimoAcesso` de nenhum dispositivo).
- Só grava quando o dispositivo já foi considerado autorizado (`ativo=true` e `ativado=true`) — um token de dispositivo revogado nunca registra novo acesso, mesmo que a tentativa de autenticação chegue ao filtro.
- **Throttle de 1 minuto**: só persiste se `ultimoAcesso` for `null` ou tiver mais de 1 minuto — evita um `UPDATE` a cada requisição autenticada (ex.: polling do Totem a cada 15s). Decisão de MVP: dentro dessa janela de até 1 minuto, o horário exibido pode ficar levemente desatualizado.
- Nunca lança exceção — uma falha ao gravar (ex.: erro pontual de conexão) é logada e ignorada, nunca derruba a autenticação da requisição em andamento.

### Correção de bug encontrada nesta task

`DispositivoService.ativarComCodigo`/`revogar` usavam `LocalDateTime.now()` (fuso horário local do sistema/JVM) para `ultimoAcesso`/`ativadoEm`/`revogadoEm`, enquanto o restante do projeto (`PedidoExpiracaoService`, `LoginAttemptService`, `DashboardAdminService`, e o novo `DispositivoAcessoService`) usa o `Clock` injetado (`Clock.systemUTC()`, bean único em `ClockConfig`). Em qualquer ambiente cuja JVM não rode em UTC, isso fazia `ultimoAcesso` da ativação divergir do relógio usado para calcular `statusOperacional`, produzindo um status incorreto (ex.: dispositivo recém-ativado aparecendo como `ATIVO` em vez de `USADO_RECENTEMENTE`) — encontrado pelo teste de integração desta própria task. Corrigido trocando as 3 chamadas por `LocalDateTime.now(clock)`.

### Configuração (`application.yml`)

```yaml
app:
  dispositivos:
    online-recente-minutos: ${DISPOSITIVO_ONLINE_RECENTE_MINUTOS:5}
```

**Fora do escopo desta task**: WebSocket, heartbeat, presença em tempo real e filtro por tipo/status no backend (o filtro em `/admin/dispositivos` é só no frontend, sobre a lista já carregada — não há paginação nem novo query param nesta listagem). Refresh token de dispositivo foi implementado na TASK-088.

## Admin — Usuários

Implementado na TASK-048. Todos os endpoints exigem perfil `SUPER_ADMIN` ou `ADMIN_RESTAURANTE` (TASK-090 abriu para `ADMIN_RESTAURANTE`, com escopo — ver abaixo). `OPERADOR_CAIXA`/`OPERADOR_COZINHA` nunca acessam este módulo (`403`).

**Escopo por restaurante (TASK-090)**:

- `SUPER_ADMIN`: comportamento inalterado — qualquer perfil, qualquer restaurante, qualquer usuário-alvo.
- `ADMIN_RESTAURANTE`: só pode listar/criar/atualizar/ativar/desativar/alterar senha de usuários com perfil `OPERADOR_CAIXA` ou `OPERADOR_COZINHA` **do próprio restaurante**. Qualquer uma das situações abaixo retorna `403`:
  - Criar ou atualizar um usuário com `perfil=SUPER_ADMIN` ou `perfil=ADMIN_RESTAURANTE` (não pode promover operador nem criar outro admin).
  - Informar `restauranteId` diferente do próprio (na criação, se omitido o backend assume o restaurante do `ADMIN_RESTAURANTE`; na atualização, sempre é forçado para o próprio).
  - Listar/filtrar (`?restauranteId=`) outro restaurante.
  - Atualizar, ativar, desativar ou alterar a senha de um usuário-alvo que não seja `OPERADOR_CAIXA`/`OPERADOR_COZINHA` do próprio restaurante (inclui: outro `ADMIN_RESTAURANTE`, qualquer `SUPER_ADMIN`, ou usuário de outro restaurante).
  - Desativar a si mesmo (bloqueio pré-existente da TASK-048, `400`, continua valendo antes de qualquer checagem de escopo).
- Essa abertura **não torna `OPERADOR_CAIXA`/`OPERADOR_COZINHA` operadores reais do fluxo Caixa/Cozinha** — eles seguem sem acesso a `/api/caixa/**`/`/api/cozinha/**` (exclusivamente dispositivo, `ROLE_DEVICE_CAIXA`/`ROLE_DEVICE_COZINHA`). Auditoria de ação por operador humano (preencher `HistoricoStatusPedido.alteradoPorUsuario`) fica para task futura — ver `docs/status-mvp.md`.

### Cadastrar usuário

`POST /api/admin/usuarios`

Request — `restauranteId` é **obrigatório** para todo perfil exceto `SUPER_ADMIN` (que nunca pode ter restaurante, sob pena de `400`); `ativo` é opcional (padrão `true`). Para `ADMIN_RESTAURANTE`, `restauranteId` é opcional (assume o próprio restaurante) e `perfil` só aceita `OPERADOR_CAIXA`/`OPERADOR_COZINHA`:

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

`GET /api/admin/usuarios[?restauranteId=]` — mesmo formato de resposta da criação, em lista. `SUPER_ADMIN` sem filtro retorna usuários de todos os restaurantes (incluindo outros `SUPER_ADMIN`). `ADMIN_RESTAURANTE` (TASK-090) sempre fica restrito ao próprio restaurante — filtro omitido ou igual ao próprio retorna a lista normalmente; qualquer outro valor retorna `403`.

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

### Listar pedidos (paginado, TASK-072)

`GET /api/admin/pedidos[?restauranteId=][&statusPedido=][&page=][&size=]`

- `restauranteId`: `SUPER_ADMIN` pode informar qualquer um ou omitir (retorna todos); `ADMIN_RESTAURANTE` só pode informar o próprio (ou omitir — sempre fica restrito ao próprio de qualquer forma).
- `statusPedido`: filtra por um dos valores de `StatusPedido` (`CRIADO`, `AGUARDANDO_PAGAMENTO`, `AGUARDANDO_PAGAMENTO_DINHEIRO`, `PAGO`, `ENVIADO_PARA_COZINHA`, `EM_PREPARO`, `PRONTO`, `RETIRADO`, `CANCELADO`, `EXPIRADO`). Valor inválido retorna `400`.
- `page`: número da página, 0-indexed (padrão `0`).
- `size`: tamanho da página (padrão `20`, limitado silenciosamente a `100` — valores maiores são reduzidos para `100`, sem erro `400`).
- Resultado ordenado do mais recente para o mais antigo (`criadoEm desc`).
- **Mudança de contrato (TASK-072)**: a resposta deixou de ser um array e passou a ser um objeto paginado (`PageResponse<PedidoAdminResumoResponse>`) — quebra de compatibilidade aceitável neste estágio do MVP.

Response (`200 OK`):

```json
{
  "content": [
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
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true
}
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

**Fora do escopo desta task**: edição de pedido, alteração de status pelo Admin, cancelamento pelo Admin, exportação. **Paginação implementada na TASK-072** — ver acima.

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

## Admin — Dashboard (TASK-074)

Resumo administrativo básico — contadores simples de pedidos para dar uma visão rápida da operação. Somente leitura, sem gráficos, sem exportação, sem relatório financeiro completo. Exige perfil `SUPER_ADMIN` ou `ADMIN_RESTAURANTE`, com o mesmo escopo por restaurante da listagem de pedidos: `SUPER_ADMIN` vê/filtra qualquer restaurante; `ADMIN_RESTAURANTE` só vê o próprio (`restauranteId` de outro restaurante retorna `403`).

### Obter resumo

`GET /api/admin/dashboard[?restauranteId=]`

- `restauranteId`: `SUPER_ADMIN` pode informar qualquer um ou omitir (soma todos os restaurantes); `ADMIN_RESTAURANTE` só pode informar o próprio (ou omitir — sempre fica restrito ao próprio de qualquer forma).

Response (`200 OK`):

```json
{
  "restauranteId": 1,
  "restauranteNome": "Lanchonete Central",
  "dataReferencia": "2026-07-11",
  "totalPedidosHoje": 4,
  "pendentesPagamento": 1,
  "pagosAguardandoCozinha": 1,
  "emOperacao": 1,
  "prontosRetirada": 0,
  "retiradosHoje": 1,
  "canceladosHoje": 0,
  "expiradosHoje": 1,
  "valorPagoHoje": 103.60
}
```

`restauranteId`/`restauranteNome` vêm `null` quando `SUPER_ADMIN` consulta sem filtro (resumo somado de todos os restaurantes).

**Definições dos contadores**:

- `pendentesPagamento`, `pagosAguardandoCozinha`, `emOperacao`, `prontosRetirada`: **fila operacional atual** — contam pedidos pelo status vigente, **sem filtro de data** (um pedido pendente desde ontem continua contando hoje, igual à lista de pendências do Caixa/Cozinha). Mapeamento: `pendentesPagamento` = `CRIADO`/`AGUARDANDO_PAGAMENTO`/`AGUARDANDO_PAGAMENTO_DINHEIRO`; `pagosAguardandoCozinha` = `PAGO`; `emOperacao` = `ENVIADO_PARA_COZINHA`/`EM_PREPARO`; `prontosRetirada` = `PRONTO`.
- `totalPedidosHoje`, `retiradosHoje`, `canceladosHoje`, `expiradosHoje`, `valorPagoHoje`: **filtrados por "hoje"** — ver definição abaixo.

**Definição de "hoje" (decisão de MVP)**: todos os contadores/soma acima usam **`Pedido.criadoEm`** (data de criação do pedido), não a data em que o pedido mudou para o status terminal (`RETIRADO`/`CANCELADO`/`EXPIRADO`). Simplificação deliberada: evita depender de `HistoricoStatusPedido` para essa data, e é precisa o bastante já que, na prática, um pedido atinge um status terminal no mesmo dia em que foi criado. O dia é calculado via `LocalDate.now(clock)` com o `Clock` já usado por `PedidoExpiracaoService`/`LoginAttemptService` (`Clock.systemUTC()`) — **limitação conhecida**: o "dia" segue UTC, não o fuso horário local do Brasil (mesma limitação, deliberadamente não resolvida nesta task, já que o projeto não tem configuração de fuso horário).

**Definição de `valorPagoHoje` (decisão de MVP)**: soma **`Pedido.valorTotal`** (não `Pagamento.valor`) dos pedidos criados hoje em qualquer status que implique pagamento confirmado (`PAGO`, `ENVIADO_PARA_COZINHA`, `EM_PREPARO`, `PRONTO`, `RETIRADO`). Optou-se por não somar `Pagamento.valor` para evitar juntar com a tabela de pagamentos e contar em duplicidade um pedido com mais de uma tentativa de pagamento (ex.: Pix falhou, tentou cartão em seguida) — `Pedido.valorTotal` já é a mesma fonte de verdade usada pelo resumo/detalhe de pedido (`GET /api/admin/pedidos`).

**Fora do escopo desta task**: gráficos, exportação, relatório financeiro completo, comparação por período (semana/mês), filtro de data customizado, seletor de fuso horário.

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

Implementado na TASK-058, cobrindo Categorias, Produtos e Dispositivos (`/api/admin/categorias`, `/api/admin/produtos`, `/api/admin/dispositivos`). Estendido na TASK-090 para Usuários (`/api/admin/usuarios`), com uma regra adicional de hierarquia de perfil — ver seção "Admin — Usuários" acima para o detalhamento completo desse módulo.

**Regra**: `SUPER_ADMIN` continua com acesso irrestrito a qualquer restaurante. `ADMIN_RESTAURANTE` só pode consultar, criar, atualizar ou inativar/revogar recursos vinculados ao restaurante do seu próprio usuário — mesmo que informe um `restauranteId` diferente no corpo da requisição ou no filtro de listagem, a operação é bloqueada.

- **Criar** (`POST`): o `restauranteId` do corpo é validado contra o restaurante do usuário autenticado antes de qualquer outra regra de negócio. Tentar criar em outro restaurante retorna `403`.
- **Listar** (`GET`): se `ADMIN_RESTAURANTE` não informar `restauranteId`, a listagem é automaticamente restrita ao próprio restaurante (não retorna "todos"). Se informar um `restauranteId` diferente do seu, retorna `403`. `SUPER_ADMIN` mantém o comportamento anterior (sem filtro = todos os restaurantes).
- **Atualizar/inativar/revogar/reativar** (`PUT`/`DELETE`/`PATCH`): o recurso é buscado por `id` normalmente (`404` se não existir); em seguida o restaurante do recurso encontrado é validado contra o do usuário autenticado (`403` se for de outro restaurante). A ordem importa: recurso inexistente sempre é `404`, recurso de outro restaurante é `403`.

**Como o backend descobre o restaurante do `ADMIN_RESTAURANTE`**: o JWT de usuário humano já carrega `restauranteId` como claim, mas o filtro de autenticação não o utiliza — em vez de alterar login/geração de token, o backend resolve o restaurante buscando o usuário por email (`Authentication.getName()`) a cada validação de escopo (`AdminScopeService`). Login e emissão de token não foram alterados.

**`/api/admin/usuarios` (TASK-090)**: ~~continua exclusivo de `SUPER_ADMIN`~~ passou a aceitar `ADMIN_RESTAURANTE`, mas com uma regra adicional além do isolamento por restaurante — hierarquia de perfil (só gerencia `OPERADOR_CAIXA`/`OPERADOR_COZINHA`, nunca `SUPER_ADMIN`/`ADMIN_RESTAURANTE`) — ver seção "Admin — Usuários" acima. Upload de imagem (`/api/admin/uploads/produtos/imagem`) continua liberado a qualquer `ADMIN_RESTAURANTE` sem checagem de restaurante (o arquivo em si não pertence a um restaurante até ser referenciado por um produto); a limpeza de órfãos (`/limpar-orfas`) continua `SUPER_ADMIN` apenas.

**Frontend (TASK-059, estendido na TASK-090)**: o painel administrativo (`frontend/`) reflete essa regra visualmente — `ADMIN_RESTAURANTE` não vê seletor de restaurante em Categorias/Produtos/Dispositivos/Usuários (o campo aparece fixo, sem depender de `GET /api/admin/restaurantes`, que é `SUPER_ADMIN` apenas), o painel `/admin` esconde o card "Restaurantes" para quem não é `SUPER_ADMIN` e o card "Usuários" para `OPERADOR_CAIXA`/`OPERADOR_COZINHA`, e `/admin/usuarios` só exibe/permite atribuir os perfis `OPERADOR_CAIXA`/`OPERADOR_COZINHA` quando o autenticado é `ADMIN_RESTAURANTE`. Isso é só uma melhoria de UX — o contrato da API e a validação de escopo continuam inteiramente no backend, exatamente como documentado acima.

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
