# Testes do Backend MVP — Totem Fast Food

Documento de validação ponta a ponta do backend, produzido na TASK-026 e atualizado na TASK-027. Não descreve funcionalidades novas além do que já foi implementado — apenas consolida como validar o backend (TASK-004 a TASK-027).

Ambiente de referência: Windows + PowerShell, comandos com `curl.exe` (mesmo padrão usado em todas as tasks anteriores). Substitua `http://localhost:8080` pela URL real se necessário.

## 1. Pré-requisitos

- PostgreSQL rodando e configurado conforme `application.yml`/variáveis de ambiente do projeto.
- Backend compilado e rodando:

```bash
cd backend
mvn clean compile
mvn spring-boot:run
```

- Migrations Flyway aplicadas automaticamente na subida (`ddl-auto: none`, schema vem só de `V1`...`V6`).
- Usuário SUPER_ADMIN já existe via seed/migration:
  - email: `admin@totem.local`
  - senha: `Admin@2026!`

## 2. Endpoints implementados por módulo

### Auth (público)

| Método | Rota | Observação |
|---|---|---|
| POST | `/api/auth/login` | Login humano, retorna JWT |
| POST | `/api/auth/dispositivos/ativar` | Ativação de dispositivo por código, retorna JWT de dispositivo |

### Admin — Restaurante (`SUPER_ADMIN`)

| Método | Rota |
|---|---|
| POST | `/api/admin/restaurantes` |
| GET | `/api/admin/restaurantes` |
| GET | `/api/admin/restaurantes/{id}` |
| PUT | `/api/admin/restaurantes/{id}` |
| PATCH | `/api/admin/restaurantes/{id}/ativar` |
| PATCH | `/api/admin/restaurantes/{id}/desativar` |

### Admin — Dispositivo (`SUPER_ADMIN`, `ADMIN_RESTAURANTE`)

| Método | Rota |
|---|---|
| POST | `/api/admin/dispositivos` |
| GET | `/api/admin/dispositivos` |
| PATCH | `/api/admin/dispositivos/{id}/revogar` |
| PATCH | `/api/admin/dispositivos/{id}/ativar` |

### Admin — Categoria (`SUPER_ADMIN`, `ADMIN_RESTAURANTE`)

| Método | Rota |
|---|---|
| POST | `/api/admin/categorias` |
| GET | `/api/admin/categorias` |
| PUT | `/api/admin/categorias/{id}` |
| DELETE | `/api/admin/categorias/{id}` (inativação lógica) |

### Admin — Produto (`SUPER_ADMIN`, `ADMIN_RESTAURANTE`)

| Método | Rota |
|---|---|
| POST | `/api/admin/produtos` |
| GET | `/api/admin/produtos` (filtros: `restauranteId`, `categoriaId`, `disponivel`) |
| PUT | `/api/admin/produtos/{id}` |
| DELETE | `/api/admin/produtos/{id}` (inativação lógica) |
| PATCH | `/api/admin/produtos/{id}/disponibilidade` |
| PATCH | `/api/admin/produtos/{id}/destaque` |

### Totem (`DEVICE_TOTEM`)

| Método | Rota |
|---|---|
| GET | `/api/totem/cardapio` |
| POST | `/api/totem/pedidos` |
| GET | `/api/totem/pedidos/{id}` |
| POST | `/api/totem/pedidos/{id}/pagamento` |

### Caixa (`DEVICE_CAIXA`)

| Método | Rota |
|---|---|
| GET | `/api/caixa/pedidos/pendentes` |
| POST | `/api/caixa/pedidos/{id}/confirmar-pagamento` |
| POST | `/api/caixa/pedidos/{id}/enviar-cozinha` |
| POST | `/api/caixa/pedidos/{id}/retirar` |
| POST | `/api/caixa/pedidos/{id}/cancelar` |

`GET /api/caixa/pedidos/pendentes` (TASK-027) retorna pedidos do restaurante do dispositivo que exigem ação do Caixa:
- `AGUARDANDO_PAGAMENTO_DINHEIRO` → `acaoSugerida=CONFIRMAR_PAGAMENTO`
- `PAGO` → `acaoSugerida=ENVIAR_PARA_COZINHA`

Pedidos `CRIADO`/`AGUARDANDO_PAGAMENTO` (aguardando o cliente no Totem) e qualquer status a partir de `ENVIADO_PARA_COZINHA` (responsabilidade da Cozinha) não aparecem. Ao contrário da listagem da Cozinha, esta expõe `valorTotal`/`subtotal`, já que o Caixa lida com pagamento.

### Cozinha (`DEVICE_COZINHA`)

| Método | Rota |
|---|---|
| GET | `/api/cozinha/pedidos` |
| PATCH | `/api/cozinha/pedidos/{id}/status` |

### Infra (público)

| Método | Rota |
|---|---|
| GET | `/api/health` |
| GET | `/swagger-ui.html`, `/swagger-ui/**` |
| GET | `/v3/api-docs/**`, `/api-docs/**` |

## 3. Observações sobre tokens

- Existem dois "tipos" de token JWT, com claims diferentes (ver `JwtService`):
  - **Usuário humano**: claim `tipo=USER`, `perfil`, `restauranteId` (nem sempre presente — `SUPER_ADMIN` não tem restaurante fixo).
  - **Dispositivo**: claim `tipo=DEVICE`, `dispositivoId`, `tipoDispositivo`, `restauranteId`.
- O `JwtAuthenticationFilter` recarrega o `Dispositivo` do banco a cada request — revogar o dispositivo (`PATCH /api/admin/dispositivos/{id}/revogar`) derruba o acesso imediatamente, mesmo com token ainda válido.
- Authorities geradas:
  - Usuário: `ROLE_<PerfilUsuario>` (ex.: `ROLE_SUPER_ADMIN`, `ROLE_ADMIN_RESTAURANTE`).
  - Dispositivo: `ROLE_DEVICE_<TipoDispositivo>` (ex.: `ROLE_DEVICE_TOTEM`, `ROLE_DEVICE_CAIXA`, `ROLE_DEVICE_COZINHA`).
- Todos os endpoints de Totem/Caixa/Cozinha usam `@AuthenticationPrincipal Dispositivo dispositivo` — o `restauranteId` **sempre** vem do dispositivo autenticado, nunca do request.
- Não existe refresh token nem logout implementados — o token expira conforme `app.security.jwt.expiration-minutes` e não há forma de revogá-lo antes disso (exceto revogando o dispositivo, que só afeta tokens de dispositivo).

## 4. Observações sobre IDs

- Cada bloco de comando abaixo depende do ID retornado pelo bloco anterior (`restauranteId`, `categoriaId`, `produtoId`, `dispositivoId`, `codigoAtivacao`, `pedidoId`). Substitua manualmente ao copiar os comandos.
- `numeroPedido` é gerado como `"A" + id` do pedido (ex.: `A42`) — não confundir com `pedidoId`.
- IDs de restaurante variam conforme o banco já tenha dados de execuções anteriores; rode `GET /api/admin/restaurantes` para conferir o próximo ID esperado, se necessário.

## 5. Ordem recomendada de execução (cenário feliz completo)

### 5.1 Login SUPER_ADMIN

```bash
curl.exe -X POST "http://localhost:8080/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@totem.local\",\"senha\":\"Admin@2026!\"}"
```

Esperado: `200 OK` com `accessToken`. Guarde como `TOKEN_SUPER_ADMIN`.

### 5.2 Criar restaurante

```bash
curl.exe -X POST "http://localhost:8080/api/admin/restaurantes" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_SUPER_ADMIN" ^
  -d "{\"nome\":\"Totem Fast Food\",\"cnpj\":\"12345678000199\",\"endereco\":\"Rua Teste, 100\"}"
```

Esperado: `201 Created` com `id` (guarde como `RESTAURANTE_ID`).

### 5.3 Criar categoria e produto disponível

```bash
curl.exe -X POST "http://localhost:8080/api/admin/categorias" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_SUPER_ADMIN" ^
  -d "{\"restauranteId\":RESTAURANTE_ID,\"nome\":\"Lanches\",\"descricao\":\"Hamburgueres\",\"ordemExibicao\":1}"

curl.exe -X POST "http://localhost:8080/api/admin/produtos" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_SUPER_ADMIN" ^
  -d "{\"restauranteId\":RESTAURANTE_ID,\"categoriaId\":CATEGORIA_ID,\"nome\":\"X-Burger\",\"descricao\":\"Hamburguer artesanal\",\"preco\":29.90,\"imagemUrl\":\"https://exemplo.com/x.png\",\"disponivel\":true,\"destaque\":true,\"recomendado\":false,\"ordemExibicao\":1}"
```

Esperado: `201 Created` em ambos.

### 5.4 Cadastrar e ativar dispositivos TOTEM, CAIXA e COZINHA

```bash
curl.exe -X POST "http://localhost:8080/api/admin/dispositivos" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_SUPER_ADMIN" ^
  -d "{\"restauranteId\":RESTAURANTE_ID,\"nome\":\"Totem 01\",\"codigoIdentificacao\":\"TOTEM_01\",\"tipoDispositivo\":\"TOTEM\"}"

curl.exe -X POST "http://localhost:8080/api/admin/dispositivos" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_SUPER_ADMIN" ^
  -d "{\"restauranteId\":RESTAURANTE_ID,\"nome\":\"Caixa 01\",\"codigoIdentificacao\":\"CAIXA_01\",\"tipoDispositivo\":\"CAIXA\"}"

curl.exe -X POST "http://localhost:8080/api/admin/dispositivos" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_SUPER_ADMIN" ^
  -d "{\"restauranteId\":RESTAURANTE_ID,\"nome\":\"Cozinha 01\",\"codigoIdentificacao\":\"COZINHA_01\",\"tipoDispositivo\":\"COZINHA\"}"
```

Cada resposta traz `codigoAtivacao`. Ative cada um:

```bash
curl.exe -X POST "http://localhost:8080/api/auth/dispositivos/ativar" ^
  -H "Content-Type: application/json" ^
  -d "{\"codigoAtivacao\":\"CODIGO_TOTEM\"}"

curl.exe -X POST "http://localhost:8080/api/auth/dispositivos/ativar" ^
  -H "Content-Type: application/json" ^
  -d "{\"codigoAtivacao\":\"CODIGO_CAIXA\"}"

curl.exe -X POST "http://localhost:8080/api/auth/dispositivos/ativar" ^
  -H "Content-Type: application/json" ^
  -d "{\"codigoAtivacao\":\"CODIGO_COZINHA\"}"
```

Esperado: `200 OK` com `accessToken` de cada dispositivo. Guarde `TOKEN_TOTEM`, `TOKEN_CAIXA`, `TOKEN_COZINHA`.

### 5.5 Consultar cardápio pelo Totem

```bash
curl.exe "http://localhost:8080/api/totem/cardapio" ^
  -H "Authorization: Bearer TOKEN_TOTEM"
```

Esperado: `200 OK`, categoria "Lanches" com o produto "X-Burger" disponível.

### 5.6 Fluxo A — pagamento eletrônico (PIX/cartão, autorização imediata)

```bash
curl.exe -X POST "http://localhost:8080/api/totem/pedidos" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_TOTEM" ^
  -d "{\"tipoConsumo\":\"LOCAL\",\"clienteNome\":\"Fabio\",\"itens\":[{\"produtoId\":PRODUTO_ID,\"quantidade\":2,\"observacao\":\"Sem cebola\"}]}"
```

Esperado: `201 Created`, `statusPedido=CRIADO`, `valorTotal=59.80`. Guarde `PEDIDO_ID`.

```bash
curl.exe -X POST "http://localhost:8080/api/totem/pedidos/PEDIDO_ID/pagamento" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_TOTEM" ^
  -d "{\"formaPagamento\":\"PIX\"}"
```

Esperado: `201 Created`, `statusPagamento=AUTORIZADO`, `statusPedido=PAGO`.

```bash
curl.exe -X POST "http://localhost:8080/api/caixa/pedidos/PEDIDO_ID/enviar-cozinha" ^
  -H "Authorization: Bearer TOKEN_CAIXA"
```

Esperado: `200 OK`, `statusPedido=ENVIADO_PARA_COZINHA`.

```bash
curl.exe "http://localhost:8080/api/cozinha/pedidos" ^
  -H "Authorization: Bearer TOKEN_COZINHA"
```

Esperado: `200 OK`, lista contém o pedido, sem campos financeiros.

```bash
curl.exe -X PATCH "http://localhost:8080/api/cozinha/pedidos/PEDIDO_ID/status" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_COZINHA" ^
  -d "{\"statusPedido\":\"EM_PREPARO\",\"observacao\":\"Preparo iniciado\"}"

curl.exe -X PATCH "http://localhost:8080/api/cozinha/pedidos/PEDIDO_ID/status" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_COZINHA" ^
  -d "{\"statusPedido\":\"PRONTO\",\"observacao\":\"Pedido pronto\"}"
```

Esperado: `200 OK` em cada chamada, `statusAtual` evoluindo `EM_PREPARO` → `PRONTO`.

```bash
curl.exe -X POST "http://localhost:8080/api/caixa/pedidos/PEDIDO_ID/retirar" ^
  -H "Authorization: Bearer TOKEN_CAIXA"
```

Esperado: `200 OK`, `statusAtual=RETIRADO`. Fim do ciclo de vida deste pedido.

### 5.7 Fluxo B — pagamento em dinheiro (pendência no caixa)

```bash
curl.exe -X POST "http://localhost:8080/api/totem/pedidos" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_TOTEM" ^
  -d "{\"tipoConsumo\":\"VIAGEM\",\"clienteNome\":\"Maria\",\"itens\":[{\"produtoId\":PRODUTO_ID,\"quantidade\":1}]}"

curl.exe -X POST "http://localhost:8080/api/totem/pedidos/PEDIDO_ID_2/pagamento" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_TOTEM" ^
  -d "{\"formaPagamento\":\"DINHEIRO\"}"
```

Esperado: `statusPagamento=PENDENTE`, `statusPedido=AGUARDANDO_PAGAMENTO_DINHEIRO`.

```bash
curl.exe "http://localhost:8080/api/caixa/pedidos/pendentes" ^
  -H "Authorization: Bearer TOKEN_CAIXA"
```

Esperado: `200 OK`, lista contém `PEDIDO_ID_2` com `statusPedido=AGUARDANDO_PAGAMENTO_DINHEIRO` e `acaoSugerida=CONFIRMAR_PAGAMENTO`. Um pedido `ENVIADO_PARA_COZINHA` (ex.: o do Fluxo A) **não** deve aparecer nesta lista.

```bash
curl.exe -X POST "http://localhost:8080/api/caixa/pedidos/PEDIDO_ID_2/confirmar-pagamento" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_CAIXA" ^
  -d "{\"observacao\":\"Cliente pagou em dinheiro\"}"
```

Esperado: `200 OK`, pagamento `AUTORIZADO`, `statusPedido=PAGO`.

```bash
curl.exe "http://localhost:8080/api/caixa/pedidos/pendentes" ^
  -H "Authorization: Bearer TOKEN_CAIXA"
```

Esperado: `200 OK`, `PEDIDO_ID_2` agora aparece com `statusPedido=PAGO` e `acaoSugerida=ENVIAR_PARA_COZINHA`. A partir daqui repita o restante do fluxo A (`enviar-cozinha` → status → `retirar`) — após `enviar-cozinha`, uma nova chamada a `GET /api/caixa/pedidos/pendentes` não deve mais listar `PEDIDO_ID_2`.

### 5.8 Fluxo C — cancelamento pelo Caixa

```bash
curl.exe -X POST "http://localhost:8080/api/totem/pedidos" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_TOTEM" ^
  -d "{\"tipoConsumo\":\"LOCAL\",\"clienteNome\":\"Joao\",\"itens\":[{\"produtoId\":PRODUTO_ID,\"quantidade\":1}]}"

curl.exe -X POST "http://localhost:8080/api/caixa/pedidos/PEDIDO_ID_3/cancelar" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_CAIXA" ^
  -d "{\"motivo\":\"Cliente desistiu do pedido\"}"
```

Esperado: `200 OK`, `statusAnterior=CRIADO`, `statusAtual=CANCELADO`.

## 6. Cenários de erro principais

| Cenário | Requisição | Esperado |
|---|---|---|
| Sem token em qualquer endpoint protegido | qualquer `GET/POST/PATCH` de admin/totem/caixa/cozinha sem header `Authorization` | `401 Unauthorized` |
| Token de perfil/dispositivo errado | ex.: `POST /api/totem/pedidos` com `TOKEN_CAIXA` | `403 Forbidden` |
| Pedido sem item | `POST /api/totem/pedidos` com `itens: []` | `400 Bad Request` |
| Quantidade zero/negativa | item com `quantidade: 0` | `400 Bad Request` |
| Produto indisponível | pedido com produto `disponivel=false` | `400 Bad Request` |
| Produto de outro restaurante | produtoId pertence a outro restaurante | `400`/`404` conforme o produto existir ou não |
| Pedido de outro restaurante consultado/alterado | `GET/POST` em pedido de outro restaurante com token do dispositivo errado | `404 Not Found` |
| Pagar pedido já `PAGO` | `POST /pagamento` em pedido `PAGO` | `400 Bad Request` |
| Confirmar dinheiro sem pagamento pendente | `POST /confirmar-pagamento` em pedido sem `Pagamento DINHEIRO PENDENTE` | `400 Bad Request` |
| Enviar à cozinha pedido não `PAGO` | `POST /enviar-cozinha` em pedido `CRIADO`/`AGUARDANDO_*` | `400 Bad Request` |
| Pular etapa na cozinha | `PATCH /status` de `ENVIADO_PARA_COZINHA` direto para `PRONTO` | `400 Bad Request` |
| Regredir status na cozinha | `PATCH /status` de `PRONTO` para `EM_PREPARO` | `400 Bad Request` |
| Retirar pedido não `PRONTO` | `POST /retirar` em qualquer outro status | `400 Bad Request` |
| Cancelar pedido já enviado à cozinha/pronto/retirado/cancelado | `POST /cancelar` fora de `CRIADO/AGUARDANDO_*/PAGO` | `400 Bad Request` |
| Cancelar sem motivo | `POST /cancelar` com `motivo` vazio/ausente | `400 Bad Request` (Bean Validation) |
| Dispositivo revogado | `PATCH /api/admin/dispositivos/{id}/revogar` seguido de qualquer chamada com o token revogado | `401`/`403` (autenticação falha no filtro) |
| Caixa de outro restaurante lista pendentes | `GET /api/caixa/pedidos/pendentes` com `TOKEN_CAIXA` de outro restaurante | `200 OK` com lista vazia (ou sem os pedidos do restaurante alheio) |

## 7. Testes automatizados existentes

```bash
cd backend
mvn test
```

| Classe | Cobertura |
|---|---|
| `BCryptValidationTest` | Hash do SUPER_ADMIN aplicado pela migration V5 corresponde à senha documentada |
| `GerarSenhaUtilTest` | Utilitário de geração de hash de senha |
| `payment/FakePaymentProviderTest` | PIX/cartão → `AUTORIZADO`; dinheiro → `PENDENTE` |
| `service/CaixaPedidoServiceTest` (TASK-026, ampliado na TASK-027) | `enviarParaCozinha`, `marcarComoRetirado`, `cancelarPedido`: transições válidas e bloqueio de todas as transições inválidas (parametrizado por `StatusPedido`), 404 para pedido inexistente/outro restaurante; `listarPendentes`: busca apenas `AGUARDANDO_PAGAMENTO_DINHEIRO`/`PAGO`, `acaoSugerida` correta por status, lista vazia não chama `ItemPedidoRepository`, nunca altera o pedido |
| `service/CozinhaPedidoServiceTest` (novo, TASK-026) | `atualizarStatus`: `ENVIADO_PARA_COZINHA→EM_PREPARO`, `EM_PREPARO→PRONTO`, bloqueio de salto e de regressão, bloqueio para pedidos fora do fluxo da cozinha |

Esses testes são unitários puros (Mockito, sem Spring context, sem banco) — validam apenas a lógica de transição de status dentro dos services, não o comportamento HTTP completo (autenticação, serialização, banco real).

### Pendência de teste de integração

Não existe teste de integração real (subindo contexto Spring + banco) no projeto. Cobrir os fluxos completos (HTTP + segurança + persistência) exigiria configurar Testcontainers ou um banco H2/Postgres de teste dedicado — isso não foi feito nesta task para não introduzir infraestrutura nova sem alinhamento explícito. Fica documentado como pendência técnica (seção 9).

## 8. Divergências encontradas entre `docs/08-endpoints.md` e a implementação

| Divergência | Situação | Sugestão |
|---|---|---|
| `POST /api/auth/refresh` | Documentado, **não implementado** | Implementar em task futura de refresh token, ou remover da doc até lá |
| `POST /api/auth/logout` | Documentado, **não implementado** | Idem — depende de refresh token existir primeiro |
| `POST /api/admin/usuarios`, `GET`, `PUT`, `PATCH /desativar` | Documentados, **nenhum implementado** (não existe `UsuarioAdminController`) | CRUD administrativo de usuários nunca foi implementado em nenhuma task até a 024 — avaliar se é necessário para o MVP ou se pode ficar para depois do frontend |
| `POST /api/caixa/pedidos/{id}/enviar-cozinha` | **Implementado, não documentado** em `docs/08-endpoints.md` | Adicionar à tabela "Caixa" da doc |
| `POST /api/caixa/pedidos/{id}/retirar` | **Implementado, não documentado** em `docs/08-endpoints.md` | Adicionar à tabela "Caixa" da doc |
| `POST /api/webhooks/pix`, `POST /api/webhooks/pagamentos` | Documentados como "futuros", não implementados | Esperado — não é uma divergência real, apenas roadmap ainda não executado |

Nenhuma correção foi aplicada automaticamente, conforme instruído.

## 9. Pendências consolidadas

### Pendências técnicas

- Sem testes de integração (HTTP + banco real) — só unitários de regra de negócio e de autenticação isolada.
- `POST /api/caixa/pedidos/{id}/enviar-cozinha` e `.../retirar` implementados mas ausentes de `docs/08-endpoints.md`.
- Não existe listagem administrativa de pedidos/histórico (nenhum endpoint `GET /api/admin/pedidos` ou similar) — hoje só é possível inspecionar pedidos via banco ou via os endpoints operacionais (Totem/Caixa/Cozinha), cada um com seu próprio escopo restrito.
- CRUD administrativo de `Usuario` nunca foi implementado, apesar de documentado em `docs/08-endpoints.md`.

### Pendências de produto

- Sem frontend (Totem, Caixa, Cozinha, Admin) — todo o MVP foi validado via `curl`/HTTP direto.
- Sem WebSocket/atualização em tempo real — Caixa e Cozinha dependeriam de polling em `GET /api/caixa/pedidos/pendentes` (quando existir) e `GET /api/cozinha/pedidos`.
- Sem expiração automática de pedidos não pagos (`StatusPedido.EXPIRADO` existe no enum, mas nada o atribui automaticamente).
- Sem relatórios/dashboards administrativos.
- Adicionais/complementos de produto não implementados (mencionados no contrato de `docs/09-contratos-api.md` como `complementos`, mas fora de escopo em todas as tasks).

### Pendências de segurança

- Usuário humano (`ADMIN_RESTAURANTE`, `OPERADOR_CAIXA`, `OPERADOR_COZINHA`) não carrega `restauranteId` no principal (`CustomUserDetailsService` só expõe `email`/`authorities`) — por isso todos os endpoints operacionais (Totem/Caixa/Cozinha) exigem dispositivo, nunca usuário humano. Isso é uma limitação deliberada, repetida e documentada em todas as tasks de 019 a 024.
- `ADMIN_RESTAURANTE` não tem escopo por restaurante nos CRUDs administrativos (Categoria/Produto/Dispositivo) — um `ADMIN_RESTAURANTE` autenticado consegue, em tese, operar sobre dados de outro restaurante, já que os services não filtram por restaurante do usuário autenticado, apenas pelo `restauranteId` do corpo da requisição.
- Sem refresh token nem logout — token só expira por tempo (`app.security.jwt.expiration-minutes`), sem revogação ativa para usuários humanos (dispositivos têm revogação via `ativo=false`).
- Sem rate limiting/brute-force protection no login.

### Pendências financeiras

- Cancelamento de pedido `PAGO` não estorna o pagamento — `Pagamento.statusPagamento` permanece `AUTORIZADO` mesmo com o pedido `CANCELADO` (decisão documentada na TASK-024).
- `PaymentProvider` não tem método de cancelamento/estorno implementado (`FakePaymentProvider` só tem `processar`).
- Sem Pix real, TEF ou SmartPOS — apenas `FakePaymentProvider` simulado.
- Sem conciliação financeira/relatório de caixa.

## 10. O backend está pronto para iniciar o frontend?

**Sim, para o fluxo operacional principal do MVP** (Totem → Pagamento → Caixa → Cozinha → Retirada/Cancelamento), que está implementado, consistente e testável ponta a ponta conforme a seção 5 deste documento.

Com a TASK-027, a tela de Caixa ganhou a peça que faltava: `GET /api/caixa/pedidos/pendentes` já entrega, num único request, tudo que o Caixa precisa agir (dinheiro pendente + pago aguardando envio à cozinha), com `acaoSugerida` pronta para decidir qual botão mostrar.

Ressalvas que o time de frontend ainda precisa saber antes de começar:

1. Painéis de Caixa e Cozinha vão precisar de **polling manual** (sem WebSocket) — inclusive para atualizar a fila de `GET /api/caixa/pedidos/pendentes`.
2. Login/sessão administrativa não tem refresh token — o frontend admin precisa lidar com expiração de sessão sem um fluxo de renovação automática.
3. Painel administrativo de usuários não tem backend — se o MVP de frontend incluir gestão de usuários, essa API precisa ser criada antes.
4. Cancelamento de pedido pago não estorna — se a UI permitir cancelar um pedido pago, deve deixar claro ao operador que o valor não é automaticamente devolvido.
