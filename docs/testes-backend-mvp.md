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

- Migrations Flyway aplicadas automaticamente na subida (`ddl-auto: none`, schema vem só de `V1`...`V7`).
- **Usuário SUPER_ADMIN (TASK-096)**: o antigo seed de senha fixa (`admin@totem.local`/`Admin@2026!`, migrations V4/V5) foi desativado pela V7 em qualquer instalação onde a senha nunca tenha sido trocada — não use mais essa credencial como referência de teste. Para ter um `SUPER_ADMIN` ativo, defina `SUPER_ADMIN_BOOTSTRAP_ENABLED=true`, `SUPER_ADMIN_EMAIL` e `SUPER_ADMIN_PASSWORD` (variáveis de ambiente) antes da primeira subida — ver `README.md` seção "Primeiro acesso administrativo" e `docs/04-seguranca.md`. Os exemplos de `curl` abaixo que usam `admin@totem.local`/`Admin@2026!` assumem que você configurou o bootstrap com esses valores localmente; substitua pelos que você escolheu.

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
| PUT | `/api/admin/dispositivos/{id}` (TASK-051, não altera restaurante/ativo/ativado/codigoAtivacao) |
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

### Admin — Upload (implementado na TASK-053, revisão de segurança na TASK-054, validado em ambiente real na TASK-055, limpeza de órfãos na TASK-056)

| Método | Rota | Permissão |
|---|---|---|
| POST | `/api/admin/uploads/produtos/imagem` (`multipart/form-data`, campo `file`; JPEG/PNG/WEBP até 5MB; retorna `url` para usar em `imagemUrl`) | `SUPER_ADMIN`, `ADMIN_RESTAURANTE` |
| POST | `/api/admin/uploads/produtos/limpar-orfas?dryRun=true\|false` (identifica/exclui imagens de `uploads/produtos` sem referência em nenhum `Produto.imagemUrl`) | `SUPER_ADMIN` |

A TASK-054 endureceu a validação: além do `Content-Type` declarado e do tamanho, o backend agora lê o conteúdo do arquivo e confere a assinatura binária (magic bytes) esperada para o tipo informado, rejeitando com `400` qualquer arquivo cujo conteúdo real não corresponda (ex.: um `.txt` renomeado/enviado como `image/png`). Mensagens de erro continuam genéricas — nenhuma resposta HTTP expõe o caminho de disco onde os arquivos são gravados.

A TASK-055 validou o fluxo completo em ambiente real (backend + Postgres + frontend rodando) e encontrou um bug real: `SecurityConfig` não liberava `/uploads/**`, então a URL pública de uma imagem já enviada retornava `401`/`403` mesmo sem token — quebrando a exibição da imagem em qualquer `<img>` do frontend, já que tags de imagem não enviam `Authorization`. Corrigido liberando `app.uploads.public-path` (`/uploads/**`) como público em `SecurityConfig`, mantendo o upload em si autenticado.

A TASK-056 implementou a limpeza manual de uploads órfãos (`limpar-orfas`), restrita a `SUPER_ADMIN` (mais restritivo que o upload, por ser uma operação destrutiva). Não há exclusão automática no update de produto — decisão deliberada para evitar side effects se duas entidades apontarem para a mesma `imagemUrl`. Ver `docs/09-contratos-api.md` para o contrato completo do relatório de limpeza.

### Admin — Usuário (`SUPER_ADMIN`, implementado na TASK-048)

| Método | Rota |
|---|---|
| POST | `/api/admin/usuarios` |
| GET | `/api/admin/usuarios` (filtro: `restauranteId`) |
| PUT | `/api/admin/usuarios/{id}` |
| PATCH | `/api/admin/usuarios/{id}/ativar` |
| PATCH | `/api/admin/usuarios/{id}/desativar` (bloqueado para o próprio usuário autenticado) |
| PATCH | `/api/admin/usuarios/{id}/senha` (TASK-049, nunca retorna senha/hash) |

### Admin — Pedidos (`SUPER_ADMIN`, `ADMIN_RESTAURANTE`; expiração manual restrita a `SUPER_ADMIN`; TASK-068/TASK-070)

| Método | Rota | Permissão |
|---|---|---|
| GET | `/api/admin/pedidos` (paginado, TASK-072; filtros `restauranteId`/`statusPedido`, `page`/`size`) | `SUPER_ADMIN`, `ADMIN_RESTAURANTE` |
| GET | `/api/admin/pedidos/{id}` (itens, pagamentos, histórico) | `SUPER_ADMIN`, `ADMIN_RESTAURANTE` |
| POST | `/api/admin/pedidos/expirar-vencidos` (TASK-070) | `SUPER_ADMIN` |

### Admin — Dashboard (`SUPER_ADMIN`, `ADMIN_RESTAURANTE`; TASK-074)

| Método | Rota | Permissão |
|---|---|---|
| GET | `/api/admin/dashboard` (contadores de pedidos, filtro opcional `restauranteId`) | `SUPER_ADMIN`, `ADMIN_RESTAURANTE` |

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

`GET /api/caixa/pedidos/pendentes` (TASK-027, ampliado na TASK-040) retorna pedidos do restaurante do dispositivo que exigem ação do Caixa:
- `AGUARDANDO_PAGAMENTO_DINHEIRO` → `acaoSugerida=CONFIRMAR_PAGAMENTO`
- `PAGO` → `acaoSugerida=ENVIAR_PARA_COZINHA`
- `PRONTO` → `acaoSugerida=MARCAR_RETIRADO`

Pedidos `CRIADO`/`AGUARDANDO_PAGAMENTO` (aguardando o cliente no Totem) e `ENVIADO_PARA_COZINHA`/`EM_PREPARO` (responsabilidade da Cozinha) não aparecem, nem status terminais (`RETIRADO`/`CANCELADO`/`EXPIRADO`). Ao contrário da listagem da Cozinha, esta expõe `valorTotal`/`subtotal`, já que o Caixa lida com pagamento.

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
curl.exe "http://localhost:8080/api/caixa/pedidos/pendentes" ^
  -H "Authorization: Bearer TOKEN_CAIXA"
```

Esperado (TASK-040): `200 OK`, `PEDIDO_ID` aparece com `statusPedido=PRONTO` e `acaoSugerida=MARCAR_RETIRADO`.

```bash
curl.exe -X POST "http://localhost:8080/api/caixa/pedidos/PEDIDO_ID/retirar" ^
  -H "Authorization: Bearer TOKEN_CAIXA"
```

Esperado: `200 OK`, `statusAtual=RETIRADO`. Fim do ciclo de vida deste pedido. Uma nova chamada a `GET /api/caixa/pedidos/pendentes` não deve mais listar `PEDIDO_ID`.

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
| Sem token, ou token inválido/malformado/expirado, em qualquer endpoint protegido | qualquer `GET/POST/PATCH` de admin/totem/caixa/cozinha sem header `Authorization`, ou com um valor inválido | `401 Unauthorized` (**histórico**: este documento sempre afirmou `401`, mas até a TASK-060 o comportamento real era `403` com corpo vazio — não havia `AuthenticationEntryPoint` customizado, então o Spring Security caía no fallback padrão de `403`. **Corrigido de verdade na TASK-061** com `RestAuthenticationEntryPoint`, registrado em `SecurityConfig`. `401` também ocorre em `POST /api/auth/login` com credenciais inválidas — mensagem diferente, "Email ou senha inválidos", vinda do `GlobalExceptionHandler`) |
| Token de perfil/dispositivo errado (autenticado, mas sem permissão) | ex.: `POST /api/totem/pedidos` com `TOKEN_CAIXA` | `403 Forbidden` (sem mudança na TASK-061 — este caso já estava correto, via `@PreAuthorize`/`GlobalExceptionHandler`) |
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
| `service/CaixaPedidoServiceTest` (TASK-026, ampliado na TASK-027 e TASK-040) | `enviarParaCozinha`, `marcarComoRetirado`, `cancelarPedido`: transições válidas e bloqueio de todas as transições inválidas (parametrizado por `StatusPedido`), 404 para pedido inexistente/outro restaurante; `listarPendentes`: busca apenas `AGUARDANDO_PAGAMENTO_DINHEIRO`/`PAGO`/`PRONTO`, `acaoSugerida` correta por status (incluindo `PRONTO`→`MARCAR_RETIRADO`), lista vazia não chama `ItemPedidoRepository`, nunca altera o pedido |
| `service/CozinhaPedidoServiceTest` (novo, TASK-026) | `atualizarStatus`: `ENVIADO_PARA_COZINHA→EM_PREPARO`, `EM_PREPARO→PRONTO`, bloqueio de salto e de regressão, bloqueio para pedidos fora do fluxo da cozinha |
| `service/UsuarioServiceTest` (TASK-048, ampliado na TASK-049) | `criar`: `restauranteId` obrigatório/proibido conforme perfil, 404 para restaurante inexistente, e-mail duplicado, senha codificada via `PasswordEncoder`; `atualizar`: e-mail duplicado bloqueado; `desativar`: bloqueio de autodesativação, permitido para outro usuário; `alterarSenha`: hash atualizado via `PasswordEncoder`, 404 para usuário inexistente (sem chamar `encode`/`save`), response sem campo de senha |
| `service/DispositivoServiceTest` (TASK-051, escopo por restaurante na TASK-058) | `atualizar`: campos permitidos (`nome`/`codigoIdentificacao`/`tipoDispositivo`) atualizados via mapper, 404 para dispositivo inexistente, 400 para código de identificação duplicado (excluindo o próprio registro); `criar`/`atualizar`/`revogar`/`reativar`: `AccessDeniedException` quando o dispositivo alvo pertence a outro restaurante; `listar`: restringe a `findByRestauranteId` quando não é `SUPER_ADMIN`, usa `findAll` quando é |
| `service/UploadImagemServiceTest` (TASK-053, endurecido na TASK-054, limpeza de órfãos na TASK-056) | `salvarImagemProduto`: rejeita arquivo vazio e content-type não permitido; aceita JPEG/PNG/WEBP com assinatura binária real válida; rejeita content-type válido com bytes que não correspondem à assinatura esperada (incluindo o caso de spoofing: `Content-Type: image/png` com bytes de JPEG); rejeita arquivo pequeno demais para conter uma assinatura válida; nome gerado nunca reaproveita o nome original do arquivo, inclusive quando o nome original contém tentativa de path traversal (`../../../etc/passwd.png`). `limparUploadsOrfaosProdutos` (TASK-056, com `ProdutoRepository` mockado): dry-run identifica órfão sem excluir; execução real exclui órfão do disco; arquivo referenciado por produto (path relativo ou URL absoluta contendo `/uploads/produtos/<filename>`) nunca é excluído; URL externa não interfere na limpeza local; diretório inexistente retorna relatório zerado; subdiretório e extensão não controlada são ignorados; falha ao excluir um arquivo (simulada via atributo somente-leitura) não interrompe a exclusão dos demais |
| `security/AdminScopeServiceTest` (novo, TASK-058) | `isSuperAdmin`: lê a authority `ROLE_SUPER_ADMIN` do `SecurityContextHolder`; `getRestauranteIdUsuarioAtual`: busca o usuário autenticado por email; `validarAcessoRestaurante`: permite SUPER_ADMIN irrestrito, permite ADMIN_RESTAURANTE no próprio restaurante, `AccessDeniedException` para outro restaurante; `resolverRestauranteIdParaListagem`: SUPER_ADMIN usa o filtro pedido (ou `null` = todos), ADMIN_RESTAURANTE sempre restrito ao próprio (com ou sem filtro explícito) |
| `service/CategoriaServiceTest` (novo, TASK-058) | `criar`/`listar`/`atualizar`/`inativar`: escopo por restaurante — SUPER_ADMIN irrestrito, `AccessDeniedException` quando ADMIN_RESTAURANTE tenta acessar/alterar categoria ou filtro de outro restaurante |
| `service/ProdutoServiceTest` (novo, TASK-058) | `criar`/`listar`/`atualizar`/`inativar`/`alterarDisponibilidade`/`alterarDestaque`: mesma cobertura de escopo por restaurante de `CategoriaServiceTest`, aplicada a produto |
| `security/SecurityHttpStatusTest` (TASK-061, encoding UTF-8 reforçado na TASK-062) | `@SpringBootTest` + `@AutoConfigureMockMvc` (contexto real, H2 em memória) em vez de Mockito puro — exercita a cadeia completa de segurança: sem token → `401`, `Content-Type: application/json` com charset `UTF-8` e corpo com acentos corretos (`"Não autenticado"`/`"Autenticação necessária ou token inválido"`); token malformado → `401`; header `Authorization` sem prefixo `Bearer` → `401`; token válido de `ADMIN_RESTAURANTE` batendo em endpoint `SUPER_ADMIN` (`/api/admin/usuarios`) → `403`; `GET /api/health` → `200`; `GET /uploads/produtos/<inexistente>` → `404` (não `401`/`403`) |
| `security/RefreshTokenServiceTest` (TASK-063, revogação atômica reforçada na TASK-064) | Unitário puro (Mockito): `criarParaUsuario` revoga refresh tokens ativos existentes do usuário antes de emitir um novo, nunca persiste o valor bruto (só o hash); `validarERevogar`: aceita token válido e já o revoga via `revogarSeAtivo` (UPDATE atômico condicional), rejeita token inexistente/revogado/expirado/sem usuário (todos via 0 linhas afetadas); `revogar`: idempotente (token inexistente ou já revogado não causa erro nem `save` extra); novo teste `duasChamadasConcorrentesComMesmoToken_apenasUmaDeveSerAceita` simula a corrida encontrada na TASK-064 (`revogarSeAtivo` retornando `1` na primeira chamada e `0` na segunda) |
| `security/AuthRefreshLogoutTest` (novo, TASK-063) | `@SpringBootTest` + `@AutoConfigureMockMvc` (contexto real, H2 em memória) — fluxo ponta a ponta via HTTP: login retorna `accessToken`+`refreshToken`; `/refresh` com token válido emite par novo e diferente do anterior; reuso do refresh já rotacionado → `401`; refresh de token inexistente → `401`; login novo do mesmo usuário revoga o refresh token da sessão anterior; `/logout` revoga e bloqueia refresh futuro (`401`); `/logout` com token inexistente é idempotente (`204`) |
| `security/LoginAttemptServiceTest` (novo, TASK-065) | Unitário puro, `Clock` mutável de teste (sem `@SpringBootTest`, sem esperar tempo real): permite tentativa inicial; bloqueia ao atingir `max-failures`; não bloqueia abaixo do limite; sucesso zera o contador; chave diferencia email e IP independentemente; email é normalizado (trim + lowercase); bloqueio expira exatamente após `block-minutes` (testado avançando o `Clock`) e não expira um segundo antes |
| `security/AuthLoginRateLimitTest` (novo, TASK-065) | `@SpringBootTest` + `@AutoConfigureMockMvc` (contexto real, H2 em memória; `max-failures=3`/`block-minutes=1` no `application.yml` de teste só para não precisar de muitas requisições) — tentativas abaixo do limite continuam `401`; ao atingir o limite → `429` com header `Retry-After` e corpo `ApiError` padrão; senha **correta** durante o bloqueio também retorna `429` (não chega a validar a senha); login correto abaixo do limite zera o contador e permite novas tentativas erradas depois; login correto sem tentativas anteriores nunca é bloqueado |
| `integration/FluxoOperacionalMvpIntegrationTest` (novo, TASK-067) | **Primeiro teste de integração de fluxo de negócio completo do projeto** — `@SpringBootTest` + `@AutoConfigureMockMvc` (contexto real, H2 em memória), 100% via HTTP/MockMvc (nenhuma chamada direta a service). Dados base (`Restaurante`, `Categoria`, `Produto`) criados via repository no `@BeforeEach`; os 3 dispositivos (TOTEM/CAIXA/COZINHA) são ativados via `POST /api/auth/dispositivos/ativar` (fluxo real, não `JwtService` direto), obtendo tokens JWT reais. Teste principal (`fluxoCompleto_deveIrDeCriadoAteRetirado`) percorre: cardápio → criar pedido (`CRIADO`, total calculado pelo backend, snapshot do item preservado) → pagar via Pix (`PAGO`, pagamento `AUTORIZADO`) → Caixa lista pendente (`acaoSugerida=ENVIAR_PARA_COZINHA`) → enviar à cozinha (`ENVIADO_PARA_COZINHA`) → Cozinha lista → `EM_PREPARO` → `PRONTO` → Caixa lista pronto (`acaoSugerida=MARCAR_RETIRADO`) → retirar (`RETIRADO`); ao final, valida direto nos repositories que o pedido está `RETIRADO`, o pagamento `AUTORIZADO` existe, e o histórico de status tem as 6 transições esperadas (`CRIADO`→`PAGO`→`ENVIADO_PARA_COZINHA`→`EM_PREPARO`→`PRONTO`→`RETIRADO`). Mais 3 testes menores: pedido em dinheiro fica `AGUARDANDO_PAGAMENTO_DINHEIRO` até o Caixa confirmar; dispositivo COZINHA não pode chamar endpoint do Caixa (`403`) e vice-versa (dispositivo TOTEM não pode chamar endpoint da Cozinha); pedido sem pagamento não aparece na listagem da Cozinha. **O que não cobre**: fluxo de cancelamento, escopo por restaurante (múltiplos restaurantes), reprocessamento de pagamento recusado/estornado — todos já cobertos por outros testes unitários existentes (`CaixaPedidoServiceTest`, `CozinhaPedidoServiceTest`, `AdminScopeServiceTest`) ou fora do escopo desta task. |
| `integration/PedidoAdminIntegrationTest` (novo, TASK-068; casos `expirarVencidos_*` adicionados na TASK-070; paginação adicionada na TASK-072) | `@SpringBootTest` + `@AutoConfigureMockMvc` (contexto real, H2 em memória), via HTTP/MockMvc — cria 2 restaurantes com um pedido pago (Pix) cada, faz login real de um `SUPER_ADMIN` e de um `ADMIN_RESTAURANTE` (vinculado a um dos dois restaurantes). Cobre: sem token → `401`; `SUPER_ADMIN` lista pedidos dos dois restaurantes num objeto paginado (`content`/`page`/`size`/`totalElements`/`totalPages`/`first`/`last`); `SUPER_ADMIN` filtra por `statusPedido=PAGO`/`RETIRADO`; `statusPedido` inválido → `400`; `ADMIN_RESTAURANTE` só lista pedidos do próprio restaurante; `ADMIN_RESTAURANTE` filtrando `restauranteId` de outro restaurante → `403`; detalhe retorna itens, pagamentos e histórico completos (2 entradas: `CRIADO`→`PAGO`); `ADMIN_RESTAURANTE` não acessa detalhe de pedido de outro restaurante (`403`) mas acessa o do próprio; pedido inexistente → `404`. **TASK-070**: `POST /api/admin/pedidos/expirar-vencidos` sem token → `401`; `ADMIN_RESTAURANTE` → `403`; `SUPER_ADMIN` expira um pedido não pago com `criadoEm` retroagido via SQL nativo (`@CreationTimestamp` não é editável via JPA) e confirma `EXPIRADO` + histórico no detalhe, sem afetar o pedido `PAGO` já existente do mesmo restaurante. **TASK-072**: `page`/`size` customizados navegam corretamente entre páginas (`first`/`last` corretos); `size` acima de 100 é limitado a 100 silenciosamente. 15/15 testes. |
| `service/PedidoExpiracaoServiceTest` (novo, TASK-070) | Unitário puro (Mockito), `Clock` fixo controlado via `Clock.fixed`: expira pedido `CRIADO` e `AGUARDANDO_PAGAMENTO_DINHEIRO` antigos; não expira pedido recente (query não retorna nada); não expira pedido `PAGO` (query já filtra pelos 3 status elegíveis, e `pedidoElegivelParaExpiracao` barra qualquer status inesperado que a query eventualmente retornasse, testado via `@ParameterizedTest` para todos os demais valores de `StatusPedido`); registra histórico com `statusAnterior`/`statusNovo`/observação corretos; execução idempotente (segunda chamada não encontra mais o pedido já `EXPIRADO`, sem duplicar histórico); respeita `minutosExpiracao` configurado (verifica o limite calculado passado à query) |
| `integration/DashboardAdminIntegrationTest` (novo, TASK-074) | `@SpringBootTest` + `@AutoConfigureMockMvc` (contexto real, H2 em memória), via HTTP/MockMvc — cria 2 restaurantes; em restauranteA insere via repository 1 pedido de cada status "vivo" (`CRIADO`, `AGUARDANDO_PAGAMENTO_DINHEIRO`, `PAGO`, `ENVIADO_PARA_COZINHA`, `EM_PREPARO`, `PRONTO`, `RETIRADO`, `CANCELADO`, `EXPIRADO`) mais 1 `CRIADO` com `criadoEm` retroagido para ontem (SQL nativo); restauranteB recebe 1 pedido `PAGO` de controle. Cobre: sem token → `401`; `ADMIN_RESTAURANTE` vê contadores só do próprio restaurante (`totalPedidosHoje=9`, exclui o pedido de ontem; `pendentesPagamento=3`, inclui o de ontem — contador não filtrado por data; `valorPagoHoje` soma só os pedidos com pagamento confirmado criados hoje); `SUPER_ADMIN` sem filtro soma os dois restaurantes; `SUPER_ADMIN` filtrando `restauranteId` isola o restaurante certo; `ADMIN_RESTAURANTE` filtrando `restauranteId` de outro restaurante → `403`. 5/5 testes. |
| `service/DispositivoAcessoServiceTest` (novo, TASK-077) | Unitário puro (Mockito), `Clock` fixo: `registrarAcesso` persiste quando `ultimoAcesso` é nulo; persiste quando mais antigo que o intervalo mínimo de 1 minuto (throttle); **não** persiste (nunca chama `save`) quando dentro do intervalo mínimo; não lança exceção quando `save` falha (loga e segue, verificado via `verify` sem `assertThrows`) |
| `mapper/DispositivoMapperTest` (novo, TASK-077) | Unitário puro, `Clock` fixo, sem contexto Spring: `toResponse` deriva `statusOperacional` corretamente nos 4 cenários — `REVOGADO` quando `ativo=false` (independe de `ultimoAcesso`), `NUNCA_USADO` quando `ultimoAcesso=null`, `USADO_RECENTEMENTE` dentro da janela configurada, `ATIVO` fora da janela |
| `integration/DispositivoAcessoIntegrationTest` (novo, TASK-077) | `@SpringBootTest` + `@AutoConfigureMockMvc` (contexto real, H2 em memória), via HTTP/MockMvc — ativação real via `POST /api/auth/dispositivos/ativar`, requisição autenticada real via `GET /api/totem/cardapio`. Cobre: dispositivo recém-ativado aparece com `ultimoAcesso` preenchido e `statusOperacional=USADO_RECENTEMENTE` (nunca `NUNCA_USADO`); uma requisição autenticada de dispositivo com `ultimoAcesso` backdatado (SQL nativo, fora do throttle e da janela recente) atualiza o campo e o status muda de `ATIVO` para `USADO_RECENTEMENTE`; dispositivo revogado não atualiza `ultimoAcesso` com o token antigo (que passa a receber `401`) e aparece como `REVOGADO`; `ADMIN_RESTAURANTE` só vê dispositivos do próprio restaurante, cada um com `ultimoAcesso`/`statusOperacional` corretos. **Bug real encontrado e corrigido nesta task**: `DispositivoService.ativarComCodigo`/`revogar` usavam `LocalDateTime.now()` (fuso local da JVM) em vez do `Clock` injetado (UTC, mesmo padrão do resto do projeto) — divergência que fazia um dispositivo recém-ativado aparecer com status operacional incorreto em ambientes fora de UTC. Corrigido trocando as 3 chamadas por `LocalDateTime.now(clock)`. |
| `integration/TimezoneIntegrationTest` (novo, TASK-079) | `@SpringBootTest` + `@AutoConfigureMockMvc` (contexto real, H2 em memória) — regressão da padronização de fuso horário. `dispositivo_criadoEmEAtivadoEm_devemEstarProximos_naoComDiferencaDeFusoHorario`: cria e ativa um dispositivo real via HTTP, confirma diferença entre `criadoEm` (Hibernate) e `ativadoEm` (Clock) menor que 5 minutos (antes da correção, chegava a ~3h). `pedidoRecemCriado_naoDeveExpirarImediatamente`: salva um `Pedido` via repository deixando o Hibernate gerar `criadoEm` de verdade (não setado manualmente), chama `pedidoExpiracaoService.expirarPedidosVencidos()` e confirma que o pedido permanece `CRIADO` — reproduz exatamente o cenário do bug crítico encontrado nesta task (antes da correção, este teste falhava: o pedido expirava mesmo recém-criado). `ultimoAcessoNaListagemAdmin_devePertencerAoMesmoInstanteAproximado`: confirma que `ultimoAcesso` retornado pela ativação está a poucos minutos do `LocalDateTime.now()` do próprio processo de teste, validando que o fuso da JVM de teste está alinhado. |
| `service/RestauranteServiceTest` (novo, TASK-081) | Unitário puro (Mockito) — cobertura ausente identificada na consolidação da Fase 13: `RestauranteService` (entidade raiz do sistema) nunca tinha teste dedicado, nem unitário nem de integração, apesar de todo outro módulo administrativo ter. `criar`: persiste quando CNPJ não duplicado, `IllegalArgumentException` quando já cadastrado; `buscarPorId`/`atualizar`/`ativar`: `NoSuchElementException` para id inexistente; `atualizar`: `IllegalArgumentException` quando CNPJ já pertence a outro restaurante; `listar`: delega a `findAll`; `ativar`/`desativar`: alteram o campo `ativo` da entidade antes de salvar. 9 testes. |
| `integration/UploadAdminIntegrationTest` (novo, TASK-082) | `@SpringBootTest` + `@AutoConfigureMockMvc` (contexto real, H2 em memória), via HTTP/MockMvc — fecha a pendência importante identificada na TASK-081 (`/api/admin/uploads/**` sem teste HTTP de autorização). Isola `app.uploads.dir` num `@TempDir` próprio via `@DynamicPropertySource`, não reaproveitando `target/test-uploads` do `application.yml` de teste, para não deixar arquivos reais no diretório de build entre execuções. Cobre `POST /api/admin/uploads/produtos/imagem`: sem token → `401`; `SUPER_ADMIN` e `ADMIN_RESTAURANTE` com PNG real (magic bytes válidos, via `MockMultipartFile`) → `201`, corpo com `filename`/`url`/`contentType`/`size` corretos, arquivo físico gravado no diretório isolado com os bytes exatos enviados; `OPERADOR_CAIXA`/`OPERADOR_COZINHA` → `403`; PNG com `Content-Type` correto mas magic bytes inválidos → `400` (mesma mensagem já validada em `UploadImagemServiceTest`, agora também pela cadeia HTTP completa); **acesso público confirmado**: `GET` na `url` retornada, sem header `Authorization`, retorna `200` com os bytes exatos do arquivo salvo, confirmando que `SecurityConfig`/`WebConfig` liberam `app.uploads.public-path` corretamente. Cobre também `POST /api/admin/uploads/produtos/limpar-orfas`: sem token → `401`; `ADMIN_RESTAURANTE` → `403`; `SUPER_ADMIN` com `dryRun=true` → `200`. 9/9 testes, **nenhum bug de produção encontrado** — toda a cadeia de autorização/multipart/acesso público já se comportava exatamente como documentado. |

A maioria desses testes é unitária pura (Mockito, sem Spring context, sem banco) — valida apenas a lógica de transição de status dentro dos services, não o comportamento HTTP completo. A exceção é `SecurityHttpStatusTest` (TASK-061), que sobe o contexto Spring completo com H2 em memória e usa MockMvc para exercitar a cadeia real de filtros/handlers HTTP — o primeiro teste do projeto a fazer isso, embora ainda restrito a status code de autenticação/autorização, não a fluxos de negócio completos.

## 7-bis. Suíte de integração contra PostgreSQL real (Testcontainers, TASK-083)

Todos os testes da tabela acima (inclusive os `@SpringBootTest`/MockMvc) rodam contra **H2 em memória**, nunca PostgreSQL real — e isso não é hipotético: os dois bugs mais graves encontrados no projeto (mistura de fuso horário Hibernate/`Clock`, TASK-078/079; pedido expirando em ~47 segundos em vez de 30 minutos) só apareceram em validação manual com backend real + PostgreSQL real, nunca em `mvn test`. `PedidoExpiracaoServiceTest` (Mockito puro) e os casos `expirarVencidos_*` de `PedidoAdminIntegrationTest` (H2) nunca teriam pego o bug de expiração prematura, porque nenhum dos dois deixa o Hibernate gerar `criadoEm` de verdade contra um banco real com fuso configurável.

A TASK-083 adicionou uma **suíte mínima** de integração com [Testcontainers](https://testcontainers.com/) (`org.testcontainers:junit-jupiter`, `org.testcontainers:postgresql` — versão gerenciada pelo BOM já importado por `spring-boot-dependencies`, nenhuma versão fixada manualmente), cobrindo exatamente os dois pontos onde bugs reais já apareceram: fuso horário e expiração de pedidos.

**Decisão de execução — profile Maven separado, não `mvn test` normal**: `mvn test` continua rodando só a suíte H2 (rápida, sem dependência externa). A suíte Postgres exige Docker disponível e leva bem mais tempo (subir um container real + rodar migrations Flyway), então roda só sob demanda:

```bash
cd backend
mvn verify -Ppostgres-it
```

**Como funciona**:
- `PostgresIntegrationTestBase` (classe base abstrata): sobe um container `postgres:16` real via Testcontainers, usando o padrão "singleton container" (campo estático, sem `@Testcontainers`/`@Container` — o container é compartilhado por todas as subclasses na mesma execução, e o Ryuk do Testcontainers garante a remoção automática ao final, sem `stop()` manual).
- **Migrations reais**: em vez de reconfigurar `spring.autoconfigure.exclude` (que exclui `FlywayAutoConfiguration` no `application.yml` de teste, para a suíte H2) via propriedade dinâmica — abordagem frágil, já que "limpar" uma lista YAML via override de propriedade não tem semântica garantida —, o Flyway roda manualmente contra o container (`Flyway.configure()...migrate()`, mesmas migrations de `classpath:db/migration` usadas em produção) antes do contexto Spring subir. Só `spring.datasource.*`, `spring.jpa.hibernate.ddl-auto=none` e `hibernate.dialect=PostgreSQLDialect` são sobrescritos via `@DynamicPropertySource` — overrides escalares simples, sem ambiguidade de merge.
- **Classes com sufixo `IT` são ignoradas pelo Surefire padrão** (que só casa `*Test.java`) e descobertas pelo Failsafe (padrão default `**/*IT.java`), habilitado só dentro do profile `postgres-it` — por isso `mvn test`/`mvn verify` sem o profile nunca tentam rodá-las, mesmo sem Docker disponível.

| Classe | Cobertura |
|---|---|
| `integration/TimezonePostgresIT` (novo, TASK-083) | Mesmos dois cenários críticos de `TimezoneIntegrationTest` (H2), agora contra Postgres real: diferença entre `criadoEm` e `ativadoEm` de um dispositivo criado+ativado em sequência (< 5min, não ~3h); pedido recém-criado (`criadoEm` gerado pelo Hibernate contra Postgres real, não setado manualmente) não expira imediatamente ao chamar `pedidoExpiracaoService.expirarPedidosVencidos()`. 2 testes. |
| `integration/PedidoExpiracaoPostgresIT` (novo, TASK-083) | Três cenários de negócio da expiração automática (TASK-070), todos com `Pedido.criadoEm` lido/gerado no Postgres real: pedido `CRIADO` recente não expira; pedido `CRIADO` antigo (backdatado via SQL nativo, mesmo padrão de `PedidoAdminIntegrationTest`) expira; pedido `PAGO` antigo nunca expira, mesmo com `criadoEm` backdatado. 3 testes. |

**Validado nesta task**: `mvn test` (H2) → **233/233, BUILD SUCCESS**, inalterado (as classes `*IT.java` não são tocadas pelo Surefire padrão). `mvn verify -Ppostgres-it` → **5/5, BUILD SUCCESS** contra Postgres 16 real via Testcontainers — container compartilhado entre as duas classes (Flyway rodou uma vez só, ~26s incluindo subida do container + migrations; segunda classe reaproveitou o contexto/container, 0.27s). Confirmado via `docker ps -a` que nenhum container de teste ficou órfão após a execução (Ryuk limpa automaticamente).

**Escopo deliberadamente mínimo** (não é objetivo desta task migrar a suíte inteira): não cobre o fluxo operacional completo Totem→Caixa→Cozinha contra Postgres real (candidato a uma task futura, se justificado — ver `docs/status-mvp.md`), nem todos os módulos administrativos. O objetivo era proteger especificamente os dois pontos onde bugs reais já escaparam da suíte H2.

## 7-ter. CI (GitHub Actions, TASK-084)

A TASK-084 adicionou `.github/workflows/ci.yml`, rodando em `pull_request` e em `push` para `main` (branch principal real do repositório), com três jobs independentes em paralelo:

| Job | O que roda | Observação |
|---|---|---|
| `backend-h2` | `cd backend && mvn test` | Suíte padrão H2, sem Docker — sempre roda, mesmo sem o profile `postgres-it`. |
| `backend-postgres-it` | `cd backend && mvn verify -Ppostgres-it` | Suíte Testcontainers (seção 7-bis). Runners `ubuntu-latest` do GitHub Actions já suportam Docker nativamente, então o Testcontainers sobe o `postgres:16` normalmente, sem configuração adicional. |
| `frontend` | `cd frontend && npm ci && npm run build && npm run lint` | `npm ci` (não `npm install`) porque `frontend/package-lock.json` já existe e está versionado. `npm run lint` executa `oxlint` (script já existente em `package.json`, não criado por esta task). |

**Decisões técnicas**:
- **Sem Maven Wrapper**: o projeto não tinha `mvnw`/`mvnw.cmd` antes desta task e não foi adicionado — os jobs backend usam o Maven do runner via `actions/setup-java@v4` (que já inclui Maven) com `cache: maven`, mais simples e suficiente para o escopo desta task.
- **`mvn test` (job `backend-h2`) permanece independente de Docker** — só `backend-postgres-it` depende de Docker/Testcontainers, exatamente como já era localmente (regra obrigatória da TASK-084: não tornar `mvn test` dependente de Docker).
- **Três jobs separados, não um único job sequencial**: cada job roda em runner próprio, em paralelo — uma falha no frontend não atrasa o feedback do backend e vice-versa; o cache de dependências (`cache: maven`/`cache: npm`) também fica isolado por job, evitando invalidação cruzada.
- **`npm run lint` (não `npx oxlint` direto)**: usa o script já padronizado em `package.json`, que roda o mesmo `oxlint` binário. O warning pré-existente em `ThemeContext.tsx` (`react/only-export-components`) não falha o job — `oxlint` retorna código de saída `0` quando só há warnings, sem erros (confirmado localmente via `npx oxlint`).
- **Triggers**: `pull_request` (qualquer branch de origem) + `push` para `main` — único branch principal usado neste repositório (confirmado via `git branch --show-current`). Não há branch `master` nem `develop`.

**Validado nesta task** (localmente, simulando os três jobs): `mvn test` → **233/233, BUILD SUCCESS**; `mvn verify -Ppostgres-it` → **5/5, BUILD SUCCESS**; `npm run build` → sem erro TypeScript; `npx oxlint` → exit code `0`, 1 warning pré-existente (mesmo comportamento esperado dentro do job `frontend`). O workflow em si (`ci.yml`) não pôde ser executado de fato nesta sessão (exigiria push/PR real no GitHub), mas cada comando que ele invoca foi validado localmente com o mesmo resultado esperado.

## 7-quater. CORS para o frontend em desenvolvimento (TASK-085)

**Bug real encontrado e corrigido nesta task**: `SecurityConfig` nunca teve nenhuma configuração de CORS (nem `http.cors(...)`, nem `CorsConfigurationSource`, nem `@CrossOrigin` em nenhum controller) — confirmado por busca no projeto inteiro. Isso não é uma questão de porta errada (5173 vs. 5174); nenhuma origem jamais foi liberada, então **qualquer** chamada feita pelo navegador contra a API era bloqueada no preflight, independente da porta do Vite. Só não tinha sido percebido antes porque toda validação de frontend anterior no projeto usa `curl`/Postman direto contra o backend (sem CORS) — nunca clique real no navegador (pendência documentada desde a TASK-060, ver `docs/status-mvp.md`).

**Diagnóstico** (login SUPER_ADMIN "não funcionando" pelo frontend): `POST /api/auth/login` via `curl` retornava `200` com `accessToken`/`refreshToken` corretos (credencial, seed e rate limit OK); o mesmo POST pelo navegador falhava no console com `blocked by CORS policy` — confirma que a causa era exclusivamente CORS, não autenticação/backend.

**Correção**: adicionado `corsConfigurationSource()` (bean `CorsConfigurationSource`/`UrlBasedCorsConfigurationSource`) em `SecurityConfig`, habilitado via `.cors(Customizer.withDefaults())` na `SecurityFilterChain`. Origens liberadas: `http://localhost:5173` e `http://localhost:5174` (as duas portas que o Vite usa em desenvolvimento local — 5174 quando 5173 já está ocupada por outra instância). Deliberadamente **não** usa `allowedOriginPatterns`/`"*"` — lista fixa e explícita de origens de desenvolvimento, evitando abrir a API para qualquer origem externa.

**Validado nesta task**:
- `curl` direto (sem `Origin`): `POST /api/auth/login` → `200`, tokens corretos (confirma que credencial/seed/rate-limit não eram o problema).
- `curl -H "Origin: http://localhost:5174"`: preflight `OPTIONS /api/auth/login` → `200` com `Access-Control-Allow-Origin: http://localhost:5174`; `POST /api/auth/login` com o mesmo header → `200` com o mesmo `Access-Control-Allow-Origin`.
- `mvn test` → **233/233, BUILD SUCCESS**, inalterado.
- `npm run build` → sem erro TypeScript.
- **Login SUPER_ADMIN confirmado funcionando pelo navegador real** (`http://localhost:5174/admin/login`) após reiniciar o backend — sem erro de CORS no console, tokens salvos, redirecionamento para `/admin`.

**Melhoria de UX incluída** (não é a causa do bug): `autoComplete="email"`/`autoComplete="current-password"` adicionados aos campos de `AdminLoginPage.tsx`, resolvendo o warning "Input elements should have autocomplete attributes" do DevTools.

**Fora do escopo desta task (deliberado)**: script `npm run dev` não foi alterado para forçar porta fixa (`--port 5173 --strictPort`) — a correção no backend já cobre as duas portas que o Vite usa naturalmente, tornando essa mudança desnecessária para o objetivo desta task. Se o time preferir uma porta sempre previsível (ex.: para scripts externos), isso pode ser avaliado separadamente.

## 7-quinquies. Validação real no navegador (TASK-086)

Com o CORS corrigido na TASK-085, a TASK-086 finalmente executou clique real (não `curl`) nas principais telas do painel Admin: login SUPER_ADMIN, Admin Home, Dashboard, Pedidos (lista/paginação/filtro/detalhe), Dispositivos (lista/filtros/revogar/reativar), Produtos (lista/CRUD/upload/preview/disponibilidade), Categorias (lista/CRUD/inativar), Restaurantes (lista/CRUD/ativar/desativar), Usuários (lista/CRUD/alterar senha), login `ADMIN_RESTAURANTE` (escopo preservado, 403 sem derrubar sessão) e renovação automática de sessão via refresh token. **Nenhum bug encontrado** — nenhuma alteração de código de produção foi necessária. Ver `docs/checklists/admin-mvp.md` seção 11 para o detalhamento completo.

### Pendência de teste de integração

## 7-sexies. TASK-088 — refresh de dispositivos

`integration/DispositivoRefreshIntegrationTest` cobre ativação com `accessToken` e `refreshToken`, rotação de dispositivo (reuso do token antigo retorna `401`), independência do refresh administrativo, regeneração de código e revogação das renovações anteriores, além de `401` sem token e `403` para `ADMIN_RESTAURANTE` fora do próprio restaurante. `RefreshTokenServiceTest` cobre associação, revogação e validação de titulares de dispositivo.

Limitação conhecida: a revogação de refresh não invalida access tokens JWT stateless já emitidos; eles permanecem válidos até a expiração configurada.

## 7-septies. TASK-089 — validação real (via `curl`) do refresh de dispositivos

Validação end-to-end contra backend real (H2 do `mvn test` cobre o contrato; esta rodada usou o backend rodando de fato, com PostgreSQL local), reproduzindo a sequência exata que `services/api.ts` executa no navegador. Sem automação de navegador neste ambiente — equivalente funcional ao clique real, não clique real em si.

Passos e resultado, para os três tipos de dispositivo (TOTEM, CAIXA, COZINHA), cada um ativado do zero via `POST /api/auth/dispositivos/ativar`:

- `accessToken` inválido em `/api/totem/cardapio` / `/api/caixa/pedidos/pendentes` / `/api/cozinha/pedidos` → `401`.
- `POST /api/auth/refresh` com o `refreshToken` do dispositivo → `200`, novo `accessToken`/`refreshToken`, `dispositivo` preenchido e `usuario: null` na resposta.
- Repetir a chamada de domínio com o novo `accessToken` → `200`.
- Reutilizar o `refreshToken` antigo (já rotacionado) → `401` (uso único).
- `refreshToken` totalmente inválido → `401` em `/api/auth/refresh`, sem erro 500.

Regeneração de código (`PATCH /api/admin/dispositivos/{id}/regenerar-codigo`), com usuários `ADMIN_RESTAURANTE` criados especificamente para o teste (um por restaurante, para isolar o escopo):

- `SUPER_ADMIN` → `200`, novo `codigoAtivacao` diferente do anterior.
- `ADMIN_RESTAURANTE` no próprio restaurante → `200`.
- `ADMIN_RESTAURANTE` em dispositivo de outro restaurante → `403`.
- Sem token → `401`.
- `refreshToken` anterior do dispositivo passa a retornar `401` após a regeneração; o `accessToken` JWT antigo, ainda não expirado, continua autenticando normalmente (`200`) — confirma a limitação de JWT stateless já documentada.
- Reativação com o código novo → `200`, novo par `accessToken`/`refreshToken`.

CORS: preflight `OPTIONS /api/auth/refresh` com `Origin: http://localhost:5173` → `200` com `Access-Control-Allow-Origin` correto (sem regressão da correção da TASK-085).

Baseline antes e depois da validação: `mvn test` → **240/240, BUILD SUCCESS**; `npm run build` sem erro TypeScript; `npx oxlint` só o warning pré-existente (`ThemeContext.tsx`).

**Nenhum bug encontrado — nenhuma alteração de código nesta task.** Pendência: clique real no navegador (DevTools, Local Storage, console) não executado por falta de automação; roteiro detalhado deixado em `frontend/README.md` ("Como testar refresh token de dispositivo") para quem for reproduzir manualmente.

## 7-octies. TASK-090 — gestão de usuários pelo ADMIN_RESTAURANTE

`UsuarioService` ganhou `AdminScopeService` (mesmo padrão de `CategoriaService`/`ProdutoService`/`DispositivoService`/`PedidoAdminService`/`DashboardAdminService`) e `UsuarioAdminController` passou de `hasRole('SUPER_ADMIN')` para `hasAnyRole('SUPER_ADMIN', 'ADMIN_RESTAURANTE')`. Regra: `SUPER_ADMIN` mantém acesso irrestrito; `ADMIN_RESTAURANTE` só gerencia `OPERADOR_CAIXA`/`OPERADOR_COZINHA` do próprio restaurante — nunca `SUPER_ADMIN`, nunca outro `ADMIN_RESTAURANTE` (nem promover um operador para esses perfis), nunca usuário/restaurante alheio.

**Testes unitários** (`UsuarioServiceTest`, 32 testes, Mockito): os 14 pré-existentes (TASK-048/049) continuam representando o comportamento de `SUPER_ADMIN` (`AdminScopeService.isSuperAdmin()` mockado como `true` por padrão em `setUp`); os 18 novos cobrem `ADMIN_RESTAURANTE` — listagem restrita/`403` em outro restaurante, criação de operador com/sem `restauranteId` explícito, rejeição de `SUPER_ADMIN`/`ADMIN_RESTAURANTE` na criação e na atualização (perfil solicitado), rejeição de alvo fora do escopo (outro restaurante, `SUPER_ADMIN`, outro `ADMIN_RESTAURANTE`) em atualizar/ativar/desativar/alterar-senha.

**Teste de integração HTTP** (`integration/UsuarioAdminScopeIntegrationTest`, 18 testes, MockMvc contra H2 em memória): réplica os mesmos cenários via `POST`/`GET`/`PUT`/`PATCH` reais, com `401` sem token, `403` para `OPERADOR_CAIXA` tentando acessar o módulo, e os cenários de escalada de privilégio/vazamento entre restaurantes listados acima — todos `403`. `SUPER_ADMIN` criando `ADMIN_RESTAURANTE`/editando usuário de qualquer restaurante/alterando senha de qualquer usuário → `200`/`201`, sem regressão.

**Ajuste em teste pré-existente**: `SecurityHttpStatusTest.tokenValidoSemPermissao_deveRetornar403` usava `GET /api/admin/usuarios` como o endpoint-exemplo de "token válido, sem permissão" para um `ADMIN_RESTAURANTE` de teste — deixou de ser um exemplo válido depois da TASK-090 (o endpoint passou a aceitar esse perfil). Trocado para `GET /api/admin/restaurantes`, que continua exclusivo de `SUPER_ADMIN`; nenhuma outra asserção do teste mudou.

`mvn test` → **279/279, BUILD SUCCESS** (suíte completa, sem regressão). `npm run build` sem erro TypeScript; `npx oxlint` só o warning pré-existente.

## 7-nonies. TASK-092 — login operacional de operador (Modelo C da TASK-091)

Dispositivo continua sendo a autenticação principal e única exigida por `/api/caixa/**`/`/api/cozinha/**` (`@PreAuthorize` inalterado). Operador humano é uma camada adicional e opcional, resolvida via novo header `X-Operador-Token`.

**Novo endpoint**: `POST /api/auth/operador/login` (`OperadorAuthController`, `@PreAuthorize("hasAnyRole('DEVICE_CAIXA', 'DEVICE_COZINHA')")`) — exige dispositivo CAIXA/COZINHA autenticado; TOTEM/ADMINISTRACAO recebem `403` automaticamente do próprio Spring Security, sem lógica extra. `OperadorAuthService` valida perfil compatível com o tipo do dispositivo, restaurante igual, e rejeita `SUPER_ADMIN` sempre. `JwtService.gerarTokenOperador` emite um JWT curto (`app.security.jwt.operador-expiration-minutes`, padrão 30min) sem refresh.

**Novo componente de resolução**: `OperadorContextService.resolver(operadorToken, dispositivo)` — usado pelos controllers de Caixa/Cozinha para ler o header `X-Operador-Token` (opcional). Recarrega o `Usuario` do banco (nunca confia só no claim) e revalida perfil/restaurante contra o **dispositivo da requisição atual** — não o da emissão do token. `OperadorEscopoValidator` centraliza a regra de compatibilidade perfil × tipo de dispositivo, reaproveitada por `OperadorAuthService` (login) e `OperadorContextService` (resolução por ação), evitando duas implementações divergentes da mesma regra.

**Testes unitários**:
- `OperadorAuthServiceTest` (11 testes, Mockito): CAIXA+OPERADOR_CAIXA/COZINHA+OPERADOR_COZINHA/CAIXA+ADMIN_RESTAURANTE/COZINHA+ADMIN_RESTAURANTE mesmo restaurante → sucesso; CAIXA+OPERADOR_COZINHA, COZINHA+OPERADOR_CAIXA, operador de outro restaurante, SUPER_ADMIN → `AccessDeniedException`; senha errada, usuário inativo, email inexistente → `BadCredentialsException`.
- `OperadorContextServiceTest` (8 testes, Mockito): sem header → `Optional.empty()`; token inválido/de outro tipo/operador não encontrado/inativo → `BadCredentialsException`; perfil incompatível com o dispositivo atual ou restaurante diferente (revalidados a cada chamada, não confiando no claim do token) → `AccessDeniedException`; token válido → retorna o `Usuario`.
- `CaixaPedidoServiceTest`/`CozinhaPedidoServiceTest`: novos casos confirmando que `alteradoPorUsuario` é preenchido quando um operador é passado e permanece `null` quando não é (compatibilidade com o comportamento anterior à TASK-092); todos os testes pré-existentes atualizados para a nova assinatura (parâmetro `Usuario operador` adicional, `null` nos casos que não testam operador).

**Teste de integração HTTP** (`integration/OperadorLoginIntegrationTest`, MockMvc contra H2 em memória): cobre todos os cenários de login (`200`/`401`/`403` por combinação dispositivo×perfil×restaurante) e as ações de Caixa/Cozinha com/sem `X-Operador-Token`, incluindo o caso de token de operador emitido para um tipo de dispositivo sendo reenviado a outro (perfil incompatível com o dispositivo atual → `403`). Confirma no banco (`HistoricoStatusPedidoRepository`) que `alteradoPorUsuario` é preenchido só quando o header é válido, e que `FluxoOperacionalMvpIntegrationTest`/`DispositivoRefreshIntegrationTest`/`UsuarioAdminScopeIntegrationTest` continuam passando sem alteração (o header é sempre opcional).

**Migration**: nenhuma — reaproveita `Usuario`/`Dispositivo`/`HistoricoStatusPedido.alteradoPorUsuario`, todos já existentes.

`mvn test` → **320/320, BUILD SUCCESS** (suíte completa, sem regressão). `npm run build`/`npx oxlint` sem erro.

**Fora do escopo desta task**: PIN de operador, refresh token de operador, preenchimento de `alteradoPorUsuario` no fluxo do Totem, WebSocket.

## 7-decies. TASK-093 — validação funcional da auditoria de operador (backend real)

Revalidação da TASK-092 contra o backend rodando de verdade (não só a suíte automatizada), com PostgreSQL local — restaurante 1, dispositivos TOTEM/CAIXA/COZINHA novos ativados via `POST /api/auth/dispositivos/ativar`, usuários `OPERADOR_CAIXA`/`OPERADOR_COZINHA`/`ADMIN_RESTAURANTE` do mesmo restaurante e um `OPERADOR_CAIXA` de outro restaurante para o teste negativo.

**Login operacional** (`POST /api/auth/operador/login`):
- CAIXA+`OPERADOR_CAIXA`, COZINHA+`OPERADOR_COZINHA`, CAIXA+`ADMIN_RESTAURANTE`, COZINHA+`ADMIN_RESTAURANTE` (mesmo restaurante) → `200`, `operadorToken` + `operador.restauranteId` igual ao do dispositivo.
- `SUPER_ADMIN` → `403`; `OPERADOR_CAIXA` em dispositivo COZINHA → `403`; `OPERADOR_COZINHA` em dispositivo CAIXA → `403`; operador de outro restaurante → `403`; dispositivo TOTEM → `403`; senha errada → `401`; usuário inativo → `401` (mesmo padrão do `/api/auth/login`).

**Fluxo ponta a ponta sem operador** (pedido `#12`): Totem cria e paga em dinheiro → Caixa confirma pagamento/envia à cozinha → Cozinha marca `EM_PREPARO`/`PRONTO` → Caixa marca `RETIRADO`, nenhuma chamada com `X-Operador-Token`. `GET /api/admin/pedidos/12` confirmou as 7 entradas de histórico com `alteradoPorDispositivoNome` correto (Totem/Caixa/Cozinha) e `alteradoPorUsuarioNome: null` em todas — comportamento idêntico ao anterior à TASK-092.

**Fluxo ponta a ponta com operador** (pedido `#13`): mesmo roteiro, mas Caixa/Cozinha identificados (`OPERADOR_CAIXA`/`OPERADOR_COZINHA`) e todas as ações com `X-Operador-Token`. Histórico confirmado: entradas do Totem com `alteradoPorUsuarioNome: null`; entradas do Caixa (confirmar pagamento, enviar à cozinha, retirar) com `alteradoPorUsuarioNome: "Operador Caixa T093"`; entradas da Cozinha (`EM_PREPARO`, `PRONTO`) com `alteradoPorUsuarioNome: "Operador Cozinha T093"` — em todos os casos `alteradoPorDispositivoNome` também presente. `PedidoAdminMapper`/`HistoricoPedidoAdminResponse` (já existentes, nunca alterados) exibem o nome corretamente, sem `undefined`.

**Troca de operador** (pedido `#14`): identificado operador A (`OPERADOR_CAIXA`) para uma ação, depois operador B (`ADMIN_RESTAURANTE`) para a próxima, mesmo dispositivo CAIXA — histórico registrou A na primeira e B na segunda corretamente, confirmando que múltiplos operadores podem se revezar no mesmo terminal dentro da janela de validade dos tokens (sem revogação — cada `operadorToken` expira sozinho).

**Token de operador inválido numa ação de escrita** → `401` ("Token de operador inválido ou expirado"), e uma chamada seguinte **sem** o header no mesmo dispositivo retornou `200` normalmente — confirma que o token de dispositivo não é afetado. Token de operador de tipo incompatível com o dispositivo atual (emitido na Cozinha, reenviado numa ação do Caixa) → `403`, mesmo padrão de `OperadorContextServiceTest`.

**CORS**: preflight de `POST /api/auth/operador/login` e das ações de Caixa com `Access-Control-Request-Headers: Authorization, X-Operador-Token` → `200` com `Access-Control-Allow-Headers` incluindo `X-Operador-Token` (após a correção abaixo).

**Bug real encontrado e corrigido**: `SecurityConfig.corsConfigurationSource()` — `allowedHeaders` continha só `Authorization`/`Content-Type`, sem `X-Operador-Token`. Reproduzido via `curl` simulando o preflight do navegador: `Access-Control-Allow-Headers: Authorization` (sem o header novo) antes da correção — num navegador real, isso bloquearia toda ação de Caixa/Cozinha com operador identificado (o preflight nega o header que a requisição real tentaria enviar). Corrigido adicionando `"X-Operador-Token"` à lista em `SecurityConfig.java`. Backend precisou ser reiniciado para a mudança surtir efeito (arquivo `application.yml`/beans de segurança só são lidos na inicialização) — `mvn test` → **320/320, BUILD SUCCESS** depois da correção, sem regressão.

**Nenhum outro bug encontrado.** `npm run build`/`npx oxlint` sem erro (nenhuma alteração de frontend nesta task).

## 7-undecies. TASK-094 — validação operacional completa (cobertura estendida, backend real)

Continuação da TASK-093 contra o mesmo backend real + PostgreSQL local, restaurante 1 (mais um segundo restaurante e um operador dele, já preparados, para o teste de escopo cruzado), cobrindo cenários que a TASK-093 ainda não tinha exercitado.

**`ADMIN_RESTAURANTE` como operador**: login `200` tanto no dispositivo CAIXA quanto no COZINHA; ação executada com sucesso em ambos; histórico do pedido (`#16`) confirmou a cadeia completa: Totem sem operador → Caixa com `OPERADOR_CAIXA` → Cozinha com `OPERADOR_COZINHA` → última ação (retirar) corretamente atribuída ao `ADMIN_RESTAURANTE` que assumiu o papel de operador no Caixa.

**Matriz completa de perfis incompatíveis** (todos `403`, login operacional não efetivado): `OPERADOR_CAIXA` tentando logar operacionalmente na Cozinha; `OPERADOR_COZINHA` tentando logar no Caixa; `SUPER_ADMIN` em qualquer dispositivo; operador de **outro restaurante** (`restauranteId` diferente do dispositivo); dispositivo TOTEM (bloqueado antes mesmo da lógica de perfil, via `@PreAuthorize`).

**Credenciais inválidas**: senha errada e usuário inativo retornam ambos `401` com a mensagem genérica idêntica ("Email ou senha inválidos") — não vaza se o e-mail existe ou está desativado, mesmo padrão de segurança do login administrativo. Sessão do dispositivo confirmada válida (`200`) em chamada subsequente após ambas as falhas.

**Pedido sem operador, revalidado** (pedido `#12`, reaproveitado da TASK-093 — mesmo código, sem mudança): as 7 entradas de histórico confirmadas novamente com `alteradoPorUsuarioNome: null` em todas.

**Troca de operador no mesmo dispositivo** (pedido `#17`, Caixa): operador A (`OPERADOR_CAIXA` T094) confirma pagamento, depois operador B (`OPERADOR_CAIXA` T093, distinto) envia à cozinha na ação seguinte — histórico atribuiu corretamente cada ação ao operador que estava identificado no momento, ambas sob o mesmo dispositivo `Caixa TASK094`, sem mistura de tokens.

**Token de operador inválido numa ação real** (assinatura corrompida): `401` "Token de operador inválido ou expirado"; ação **não** persistida (pedido permaneceu no status anterior); dispositivo confirmado ainda autenticado (listagem retornou `200` na sequência). Revisão de código (`CaixaHomePage.tsx`/`CozinhaHomePage.tsx`, função `tratarErroAcao`) confirma que o frontend, ao receber esse `401` com um `operadorToken` presente no storage, chama **apenas** `clearOperadorSession()`, preservando a sessão do dispositivo — comportamento já existente desde a TASK-092, não alterado.

**Token de operador de perfil incompatível usado cross-context**: operador logado no dispositivo COZINHA usando o próprio token numa ação do CAIXA → `403` (validado por `OperadorEscopoValidator`, que roda antes de qualquer regra de negócio do pedido); pedido não alterado; dispositivo Caixa permanece autenticado.

**Token de operador expirado**: não reproduzido esperando os 30 minutos reais nem alterando `jwt.operador-expiration-minutes` (evitaria alteração de configuração fora do escopo da validação) — confirmado por revisão de código que `JwtService.isTokenValido()` envolve `parseClaims()` num `catch (Exception ex)` genérico, o mesmo caminho que já trata assinatura inválida (testado empiricamente acima) tratando `ExpiredJwtException` de forma idêntica, com a mesma resposta `401`.

**Token de dispositivo genuinamente inválido com operador identificado**: chamando `POST /api/auth/refresh` com um refresh token inexistente/inválido confirma `401` ("Refresh token inválido ou expirado") — o gatilho que, dentro de `api.ts` (`tentarRenovarSessao()` falhando), aciona `clearSession()` completo (dispositivo + usuário + operador) diretamente no cliente HTTP central, **antes** de qualquer tela decidir com base em `getOperadorToken()`. Diferente do caso anterior (só o token de operador inválido), onde o dispositivo permanece intacto — os dois caminhos coexistem corretamente no mesmo código (`api.ts` + `tratarErroAcao`), sem alteração nesta task.

**Separação de storage**: revisão completa de `tokenStorage.ts` confirma que `totem.operadorToken`/`totem.operador` são chaves de `localStorage` totalmente separadas de `totem.accessToken`/`totem.refreshToken`/`totem.dispositivo`/`totem.usuario`; `clearOperadorSession()` só remove as duas primeiras, `clearSession()` remove todas.

**Nenhum bug encontrado. Nenhuma alteração de código nesta task** — `git status`/`git diff` confirmaram que o único arquivo de código com alteração pendente no repositório continua sendo `SecurityConfig.java` (correção da TASK-093, não tocada novamente). `mvn test`/`npm run build` não foram reexecutados por não haver nenhuma alteração de código a validar (último resultado conhecido, TASK-093: **320/320, BUILD SUCCESS**; `npm run build`/`npx oxlint` sem erro).

**Limitação de ambiente, reconfirmada**: sem `chromium-cli`/Playwright/Cypress/computer-use disponíveis nesta sessão — toda a validação acima é equivalente funcional via `curl` reproduzindo exatamente as chamadas que o frontend faria (mesmos headers, mesma ordem), não clique real no navegador. Escolha confirmada explicitamente pelo solicitante diante da limitação.

## 7-duodecies. TASK-094.1 — tentativa de homologação visual (bloqueada por ambiente)

Nova checagem de disponibilidade de `chromium-cli`/Playwright/Cypress neste ambiente: continuam ausentes; instalar ferramenta nova estava fora do escopo desta tentativa. Nenhuma alteração de código no repositório desde o fechamento da TASK-094 (`git status` confirmado). Suíte de regressão reexecutada por precaução: `mvn test` → **320/320, BUILD SUCCESS**; `npm run build` sem erro; `npx oxlint` sem erro (mesmo warning cosmético pré-existente em `ThemeContext.tsx` — `npm run lint` ficou com saída inesperada por interceptação de um hook local do ambiente, não relacionada ao projeto; `npx oxlint` direto confirma o resultado real). **Nenhum bug encontrado — pendência de clique real permanece aberta, dependente de testador humano ou ferramenta de automação de navegador.**

## 7-tredecies. TASK-096 — seed de SUPER_ADMIN seguro

Corrige o risco P0 identificado na TASK-095 (revisão de roadmap): o seed de `SUPER_ADMIN` das migrations `V4`/`V5` usava uma senha fixa (`Admin@2026!`) documentada em texto claro no repositório versionado.

**Mudanças de código**:
- `V7__desativar_seed_super_admin_conhecido.sql` (nova migration): `UPDATE usuarios SET ativo = false ... WHERE email = 'admin@totem.local' AND senha_hash = '<hash exato da V5>'` — só desativa a conta se a senha nunca tiver sido trocada (hash ainda bate); se já foi trocada pelo painel, não faz nada. `V4`/`V5` **não foram editadas** (evita quebrar o checksum do Flyway em bancos onde já foram aplicadas).
- `SuperAdminBootstrapRunner` (`backend/src/main/java/com/totem/fastfood/bootstrap/`, novo `ApplicationRunner`): cria o primeiro `SUPER_ADMIN` de um ambiente, condicionado a `app.bootstrap.super-admin.enabled` (`@ConditionalOnProperty`, default `false` — bean nem é instanciado quando desligado). Exige `app.bootstrap.super-admin.email`/`password` (variáveis `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`) — sem elas, falha o startup com `IllegalStateException` em vez de criar algo silenciosamente. Nunca cria um segundo `SUPER_ADMIN` se já existir um ativo (`UsuarioRepository.existsByPerfilAndAtivoTrue`, método novo).
- `application.yml`: novo bloco `app.bootstrap.super-admin` (enabled/email/password, todos via variável de ambiente, sem default de senha).

**Testes novos**: `SuperAdminBootstrapRunnerTest` (4 casos, unitário puro com Mockito — sem contexto Spring): não cria quando já existe um `SUPER_ADMIN` ativo; falha ao iniciar quando habilitado sem e-mail/senha; falha ao iniciar com e-mail mas sem senha; cria com senha criptografada (via `PasswordEncoder`, mesmo bean de `SecurityConfig`) quando habilitado e não existe um ativo.

**Por que o bean condicional é seguro para a suíte existente**: como o bootstrap não foi habilitado em `backend/src/test/resources/application.yml` (permanece `false`, o default), o `SuperAdminBootstrapRunner` **nunca é instanciado** nos ~13 testes `@SpringBootTest` do projeto — confirmado que `TotemApplicationTests.contextLoads` continua passando sem nenhum usuário extra sendo criado.

**Testes ajustados (comentário apenas, lógica preservada)**: `BCryptValidationTest`/`GerarSenhaUtilTest` — Javadoc atualizado para deixar claro que documentam um bug histórico (hash V4→V5) e que a conta em questão está desativada desde a V7; nenhuma assertion foi alterada, ambos continuam passando.

`mvn test` → **324/324, BUILD SUCCESS** (320 anteriores + 4 novos). Nenhuma alteração de frontend.

**Efeito em ambientes existentes**: qualquer instalação que ainda tivesse a senha `Admin@2026!` nunca trocada perde o acesso via essa credencial na próxima subida (a V7 desativa a conta). Para recuperar acesso administrativo, habilitar o bootstrap (`SUPER_ADMIN_BOOTSTRAP_ENABLED=true` + `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`) antes do próximo restart — documentado em `README.md` e `docs/04-seguranca.md`.

## 7-quattuordecies. TASK-097 — JWT secret sem fallback inseguro

Corrige o segundo risco P0 identificado na TASK-095: `application.yml` tinha `secret: ${JWT_SECRET:uma-chave-local-de-desenvolvimento-...}` — um fallback fixo e publicamente conhecido, usado silenciosamente para assinar tokens de USER/DEVICE/OPERADOR (mesma `SecretKey` para os três, confirmado por leitura de `JwtService`) sempre que `JWT_SECRET` não fosse definido.

**Mudanças de código**:
- `application.yml`: `secret: ${JWT_SECRET:}` — sem fallback.
- `JwtSecretValidator` (`backend/src/main/java/com/totem/fastfood/security/`, novo, classe utilitária sem estado): chamado no construtor de `JwtService`, antes de `Keys.hmacShaKeyFor(...)`. Lança `IllegalStateException` se o secret for nulo/branco, menor que 32 caracteres, ou igual ao valor antigo do fallback (constante `SEGREDO_ANTIGO_CONHECIDO`, para rejeitar explicitamente alguém copiando o valor comprometido para uma variável de ambiente por engano).
- `JwtService`: nenhuma mudança de claims, algoritmo ou expiração — só a validação adicionada no construtor, antes da criação da `SecretKey`.
- `backend/src/test/resources/application.yml`: **nenhuma alteração necessária** — o secret de teste já existente (`chave-fake-de-teste-nao-usar-em-producao-totem-fast-food-contextloads`) já tem mais de 32 caracteres e é diferente do valor antigo, passando na nova validação sem ajuste.

**Testes novos**: `JwtSecretValidatorTest` (6 casos, unitário puro, sem contexto Spring): falha com secret nulo; falha com secret vazio; falha com secret em branco; falha com secret menor que o mínimo; falha com o valor antigo conhecido; passa com um secret válido de tamanho suficiente.

**Por que não foi criado um profile `dev`**: a recomendação do investigador previa duas opções — permitir fallback só em profile `dev`/`local`, ou exigir `JWT_SECRET` sempre. Como o projeto não usa `spring.profiles.active` em lugar nenhum hoje (o isolamento de teste é feito via arquivo de `resources` separado, não por profile), introduzir profiles agora seria uma mudança de arquitetura maior que o necessário e replicaria o mesmo tipo de risco por outro caminho (um "modo dev" que alguém esquece de desligar). Optou-se por exigir a variável sempre, inclusive em desenvolvimento local — documentado com destaque em `README.md`.

**Por que a suíte continua determinística**: `JwtService` é instanciado pelo Spring em todo teste `@SpringBootTest` (13 classes) usando o secret de `backend/src/test/resources/application.yml`, que já era válido para a nova regra — nenhuma dessas classes precisou de ajuste.

`mvn test` → **330/330, BUILD SUCCESS** (324 anteriores + 6 novos). Nenhuma alteração de frontend, CORS, seed de SUPER_ADMIN, fluxo de login, claims ou expiração de token.

**Efeito em ambientes existentes**: qualquer instalação que dependia do fallback antigo (nunca definiu `JWT_SECRET`) para de subir na próxima execução até que a variável seja definida — comportamento intencional (falha clara, não silenciosa). Ver `README.md` seção "Variáveis de ambiente obrigatórias".

## 7-quindecies. TASK-098 — CORS externalizado por ambiente

Corrige o terceiro e último P0 identificado na TASK-095: `SecurityConfig.corsConfigurationSource()` tinha as origens permitidas hardcoded (`http://localhost:5173`/`5174`) — funcionava só em desenvolvimento local, qualquer domínio de produção exigiria alterar e recompilar código.

**Mudanças de código**:
- `application.yml`: `allowed-origins: ${CORS_ALLOWED_ORIGINS:}` (`app.security.cors.allowed-origins`) — sem fallback.
- `CorsOriginsValidator` (`backend/src/main/java/com/totem/fastfood/config/`, novo, classe utilitária sem estado): chamado dentro de `SecurityConfig.corsConfigurationSource()`, antes de montar o `CorsConfiguration`. Lança `IllegalStateException` se a configuração estiver ausente/em branco, contiver `"*"` (mesmo misturado com origens válidas), ou contiver uma origem sem `http://`/`https://` explícito.
- `SecurityConfig`: `corsConfigurationSource()` passa a ler `List<String> allowedOrigins = CorsOriginsValidator.validar(corsAllowedOrigins)` em vez de `List.of("http://localhost:5173", "http://localhost:5174")` hardcoded. Métodos (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`/`OPTIONS`) e headers (`Authorization`/`Content-Type`/`X-Operador-Token`) não mudaram.
- `backend/src/test/resources/application.yml`: ganhou `app.security.cors.allowed-origins: http://localhost:5173,http://localhost:5174` — **obrigatório**, diferente do bootstrap de SUPER_ADMIN (TASK-096, condicional/opt-in): o bean `corsConfigurationSource()` é sempre instanciado pelo Spring Security, então as 13 classes `@SpringBootTest` do projeto quebrariam sem essa propriedade.

**Testes novos**:
- `CorsOriginsValidatorTest` (8 casos, unitário puro): falha com configuração nula/vazia/só espaços e vírgulas; falha com `"*"` sozinho ou misturado com origem válida; falha com origem sem protocolo; passa com uma origem válida; passa com múltiplas origens separadas por vírgula (com espaços ao redor, aparados corretamente).
- `CorsConfigurationIntegrationTest` (3 casos, MockMvc contra o contexto Spring completo — **primeira cobertura automatizada de CORS do projeto**, todas as validações anteriores TASK-085/093/094 foram feitas manualmente via `curl`): preflight `OPTIONS /api/auth/login` com `Origin: http://localhost:5173` retorna `Access-Control-Allow-Origin: http://localhost:5173`; preflight de uma ação de Caixa com `Access-Control-Request-Headers: authorization,x-operador-token` retorna `Access-Control-Allow-Headers` contendo `x-operador-token`; preflight com `Origin: http://malicioso.local` (origem não configurada) **não** retorna `Access-Control-Allow-Origin` — confirmado empiricamente, não só por leitura de código.

`mvn test` → **341/341, BUILD SUCCESS** (330 anteriores + 11 novos: 8 do validador + 3 de integração). Nenhuma alteração de frontend, JWT, seed de SUPER_ADMIN, autenticação ou endpoints.

**Efeito em ambientes existentes**: qualquer instalação que dependia das origens hardcoded antigas (nunca definiu `CORS_ALLOWED_ORIGINS`) para de subir na próxima execução até que a variável seja definida — mesmo padrão de falha clara e intencional das TASK-096/097. Ver `README.md` seção "Variáveis de ambiente obrigatórias".

~~Não existe uma suíte de teste de integração completa (subindo contexto Spring + banco, exercitando fluxos de negócio ponta a ponta via HTTP) no projeto~~ **implementado na TASK-067**: `integration/FluxoOperacionalMvpIntegrationTest` cobre o ciclo operacional completo (Totem cria pedido e paga → Caixa envia à cozinha → Cozinha prepara e finaliza → Caixa marca retirado) via HTTP real (MockMvc) contra o contexto Spring completo com H2 em memória — ver detalhes na tabela acima. A TASK-057 havia adicionado H2 em memória para permitir que `TotemApplicationTests.contextLoads` suba o contexto completo (smoke test de que os beans se conectam); a TASK-061 deu o primeiro passo real testando HTTP de verdade via MockMvc (`SecurityHttpStatusTest`), mas cobrindo só autenticação/autorização. A TASK-067 é o primeiro teste de **fluxo de negócio** completo via HTTP.

**Limitação conhecida, deliberada**: H2 em memória (`MODE=PostgreSQL`, schema via `ddl-auto: create-drop`) valida a integração HTTP + JPA + regras de transição de status num único processo, mas **não substitui** um teste contra PostgreSQL real — não exercita comportamento específico do driver/dialeto Postgres (ex.: `SERIAL`/`BIGSERIAL`, locks de linha reais como os usados em `RefreshTokenService.revogarSeAtivo`, tipos específicos). Migrar para Testcontainers (subir um PostgreSQL real em container durante o teste) continua como pendência técnica caso se queira essa cobertura mais fiel — deliberadamente fora do escopo da TASK-067.

## 7-sedecies. TASK-099 — Observabilidade mínima (Actuator + logs operacionais)

Primeiro item P1 do roadmap pós-MVP (TASK-095), executado logo após a leva de hardening P0 (TASK-096/097/098): adiciona `spring-boot-starter-actuator` para health/info operacionais e fecha as duas lacunas de log identificadas na revisão (`CozinhaPedidoService` sem log nenhum; `SuperAdminBootstrapRunner` sem log no caso desabilitado).

**Mudanças de código**:
- `pom.xml`: `spring-boot-starter-actuator`.
- `application.yml`/`test/resources/application.yml`: `management.endpoints.web.exposure.include: health,info` (só esses dois — qualquer outro endpoint do Actuator não tem exposure habilitado e nem chega a existir como rota Spring MVC), `management.endpoint.health.show-details: never` (não vaza detalhes de componentes internos, ex.: status do datasource), `management.info.env.enabled: true` (necessário para o `/actuator/info` expor as propriedades estáticas `info.app.*` — sem isso, o contribuidor de env fica desligado por padrão desde o Spring Boot 2.5).
- `SecurityConfig`: `/actuator/health` e `/actuator/info` adicionados a `ENDPOINTS_PUBLICOS`. Como a exposição já é restrita a esses dois, um request a `/actuator/env` (ou qualquer outro) não tem rota registrada — cai em `401` (não está na lista pública, exige autenticação) antes mesmo do Spring MVC decidir 404.
- `SuperAdminBootstrapRunner`: deixou de ser `@ConditionalOnProperty` (o bean não existia quando `enabled=false`, então o caso desabilitado nunca tinha como logar nada) — agora sempre registrado, checando `enabled` via `@Value` no início de `run()` e logando os dois estados (habilitado/desabilitado). Comportamento funcional idêntico (mesmas condições de criação/erro), só a forma de checar mudou.
- `CozinhaPedidoService`: ganhou `@Slf4j` e um log em `atualizarStatus` (pedidoId, restauranteId, statusAnterior→statusNovo) — era o único fluxo sensível de Caixa/Cozinha listado na task sem nenhum log; os demais (confirmar pagamento dinheiro, enviar cozinha, retirar, cancelar, login admin/operador, ativação/refresh de dispositivo) já logavam IDs técnicos sem dado sensível desde tasks anteriores.
- `/api/health` (`HealthController`) não foi alterado — continua público, sem dependência de banco/beans, mantido para compatibilidade como health legado simples ao lado do `/actuator/health` operacional.

**Testes novos**: `ActuatorSecurityIntegrationTest` (5 casos, MockMvc contra o contexto Spring completo): `GET /actuator/health` sem token → `200 {status: UP}`; `GET /api/health` sem token → `200` (regressão do legado); `GET /actuator/info` sem token → `200` com `app.name` estático, sem dado sensível; `GET /actuator/env` → nunca `200`; endpoint protegido (`GET /api/admin/dashboard`) sem token continua `401`.

`SuperAdminBootstrapRunnerTest` ganhou um caso novo (`naoExecutaNadaQuandoDesabilitado`) e os quatro existentes passaram a informar o novo parâmetro `enabled` no construtor.

`mvn test` → **347/347, BUILD SUCCESS** (341 anteriores + 6 novos: 5 de `ActuatorSecurityIntegrationTest` + 1 de `SuperAdminBootstrapRunnerTest`). Nenhuma alteração de frontend, autenticação de usuário/dispositivo/operador, ou regra de negócio de pedidos.

**Fora do escopo, deliberadamente**: Prometheus/Grafana, tracing distribuído, ELK/Loki, dashboard operacional, log estruturado (JSON) — a task pede observabilidade mínima, não uma stack de monitoramento completa (ver `docs/roadmap-pos-mvp.md`).

## 8. Divergências encontradas entre `docs/08-endpoints.md` e a implementação

| Divergência | Situação | Sugestão |
|---|---|---|
| ~~`POST /api/auth/refresh`~~ | Documentado desde o início, **implementado na TASK-063** | — |
| ~~`POST /api/auth/logout`~~ | Documentado desde o início, **implementado na TASK-063** | — |
| `POST /api/webhooks/pix`, `POST /api/webhooks/pagamentos` | Documentados como "futuros", não implementados | Esperado — não é uma divergência real, apenas roadmap ainda não executado |

`POST/GET/PUT /api/admin/usuarios`, `PATCH .../ativar` e `.../desativar` — documentados desde a fase inicial, **implementados na TASK-048** junto com o frontend `/admin/usuarios`. Diferente de Categoria/Produto/Dispositivo, restrito a `SUPER_ADMIN` apenas (gestão de usuários, inclusive outros admins, é mais sensível). `PATCH .../senha` (alteração de senha por um admin) **implementado na TASK-049**.

`POST /api/caixa/pedidos/{id}/enviar-cozinha` e `.../retirar` estavam implementados mas ausentes de `docs/08-endpoints.md` desde a TASK-026/TASK-027 — **corrigido na TASK-041** (revisão ponta a ponta).

## 9. Pendências consolidadas

### Pendências técnicas

- Sem testes de integração (HTTP + banco real) — só unitários de regra de negócio e de autenticação isolada.
- ~~Campos `criadoEm`/`atualizadoEm` do Hibernate gravados no fuso local da JVM, misturados com campos UTC~~ **corrigido na TASK-079** (descoberto na validação manual da TASK-078). Diagnóstico original: os campos `criadoEm`/`atualizadoEm` gerenciados pelo Hibernate (`@CreationTimestamp`/`@UpdateTimestamp`, presentes em toda entidade do projeto — `Restaurante`, `Categoria`, `Produto`, `Usuario`, `Pedido`, `Dispositivo`, `Pagamento`, `HistoricoStatusPedido`, `Auditoria`, `RefreshToken`) eram gravados no fuso horário padrão da JVM (`America/Sao_Paulo`, confirmado via `user.timezone` nos relatórios de teste), enquanto os campos manuais controlados por código (`Dispositivo.ultimoAcesso`/`ativadoEm`/`revogadoEm` desde a TASK-077, e toda comparação via `Clock.systemUTC()` em `PedidoExpiracaoService`/`LoginAttemptService`/`DashboardAdminService`) usavam UTC.

  **A investigação da TASK-079 revelou que o impacto era muito mais grave do que uma divergência cosmética**: `PedidoExpiracaoService.expirarPedidosVencidos()` compara `Pedido.criadoEm` (Hibernate, fuso local) contra um limite calculado via `LocalDateTime.now(clock).minusMinutes(minutosExpiracao)` (`clock` = UTC). Como `America/Sao_Paulo` está 3h atrás de UTC, `criadoEm` sempre aparecia "mais antigo" do que deveria por exatamente esse offset — tornando a janela de expiração efetiva `minutosExpiracao - 180` minutos. Com o padrão de 30 minutos, isso significa **elegibilidade para expiração quase instantânea**. **Validado ao vivo contra o backend real + PostgreSQL real** (2026-07-12, antes da correção): um pedido criado às `19:52:18` (hora local da JVM) apareceu `EXPIRADO` às `19:53:05` — **47 segundos depois**, não 30 minutos. Esse teste automatizado unitário existente (`PedidoExpiracaoServiceTest`) nunca pegou esse bug porque usa Mockito puro com `Pedido` construído manualmente (sem passar pelo Hibernate) e `Clock` fixo — só um teste de integração real, com Hibernate gerando `criadoEm` de verdade, expõe o problema.

  **Correção**: fuso padrão da JVM fixado para UTC via bloco estático em `TotemApplication` (`TimeZone.setDefault(TimeZone.getTimeZone("UTC"))`), executado antes de qualquer geração de timestamp do Hibernate ou chamada de `LocalDateTime.now()` remanescente no projeto (`CaixaPagamentoService`, `PagamentoTotemService`, `RefreshTokenService`, `RestAuthenticationEntryPoint`, `GlobalExceptionHandler`) — resolve a causa raiz num único ponto, sem precisar reescrever cada entidade ou call site individualmente. Complementado por `spring.jpa.properties.hibernate.jdbc.time_zone: UTC` e `spring.jackson.time-zone: UTC` em `application.yml` (principal e teste), por documentação explícita da intenção. `ClockConfig` permanece `Clock.systemUTC()`, agora com Javadoc explicando o alinhamento.

  **Validado após a correção**: mesmo cenário (pedido criado, aguardado por mais de um ciclo do job de expiração de 60s) → pedido permaneceu `CRIADO`, como esperado; `criadoEm`/`ativadoEm` de um dispositivo criado e ativado em sequência passaram a ter diferença de frações de segundo, não 3 horas; `date -u` do sistema confirmado batendo com os valores retornados pela API. `mvn test` completo: **215/215, BUILD SUCCESS** (212 anteriores + 3 novos de `TimezoneIntegrationTest`, incluindo o teste de regressão que reproduz exatamente o cenário do bug: `Pedido` salvo via repository, deixando o Hibernate gerar `criadoEm`, seguido de `pedidoExpiracaoService.expirarPedidosVencidos()` — confirma que o pedido não expira). Ver `docs/09-contratos-api.md` seção "Padronização de fuso horário" para a regra oficial.

  **Fora do escopo desta task (deliberado)**: migração de `LocalDateTime` para `Instant`/`OffsetDateTime`; migration de dados (ambiente de desenvolvimento, poucos registros de teste); correção do Dashboard "hoje" para `America/Sao_Paulo` (continua UTC); ajuste do frontend para exibir corretamente os novos valores UTC sem sufixo de fuso (documentado como limitação conhecida, mesma raiz da já existente desde a TASK-077 para `ultimoAcesso`) — **corrigido na TASK-080** (frontend puro, novo utilitário `frontend/src/utils/dateTime.ts`, sem mudança de backend; ver `frontend/README.md` e `docs/checklists/admin-mvp.md` seção 9o).
- ~~Não existe listagem administrativa de pedidos/histórico~~ **implementado na TASK-068, validado manualmente com backend real na TASK-069**: `GET /api/admin/pedidos` (filtros opcionais `restauranteId`/`statusPedido`) e `GET /api/admin/pedidos/{id}` (itens, pagamentos e histórico completo), com o mesmo escopo por restaurante da TASK-058 (`ADMIN_RESTAURANTE` só vê o próprio). Somente leitura — não altera status/pagamento nem implementa cancelamento/edição/exportação pelo Admin. **Paginação implementada na TASK-072, validada com backend real + PostgreSQL real na TASK-073** (registro histórico abaixo mantido como estava antes dessa task). Ver `docs/09-contratos-api.md` seção "Admin — Pedidos" e `docs/checklists/admin-mvp.md` seção 9i para o detalhamento completo da validação de paginação (banco com 9 pedidos: `page`/`size` navegando corretamente, filtro por status/restaurante preservado sob paginação, `size` acima de 100 limitado silenciosamente, escopo `ADMIN_RESTAURANTE` preservado, detalhe inalterado — nenhum bug encontrado). Validado via `curl` contra o backend real (2026-07-10), com 2 restaurantes, 4 pedidos (`RETIRADO`, `AGUARDANDO_PAGAMENTO_DINHEIRO`, `PAGO` em dois restaurantes diferentes) e um `ADMIN_RESTAURANTE` real: listagem sem filtro (SUPER_ADMIN) retorna os 4; filtro por `restauranteId` isola corretamente cada restaurante; filtro por `statusPedido=RETIRADO` retorna só o pedido retirado; filtro combinado sem resultado retorna `[]` (`200`); detalhe do pedido retirado traz as 6 transições de histórico completas, item e pagamento corretos; `ADMIN_RESTAURANTE` lista só o próprio restaurante, recebe `403` ao filtrar `restauranteId` de outro ou ao abrir detalhe de pedido de outro restaurante (sessão preservada, confirmado pelo mesmo token continuar `200` logo depois); `statusPedido` inválido → `400` com a lista de valores aceitos na mensagem; sem token → `401`; perfil operacional (`OPERADOR_CAIXA`) → `403`. Nenhum bug encontrado — nenhuma alteração de código foi necessária.
- ~~`TotemApplicationTests.contextLoads` falhava em ambiente local~~ **corrigido na TASK-057**. Causa raiz real (não só o JWT): `src/test/resources/application.yml` **substitui** por completo o `application.yml` principal durante os testes (mesmo nome de arquivo, classpath de teste tem prioridade), então nenhuma propriedade `app.security.jwt.*`/`app.uploads.*` (usadas via `@Value` em `JwtService`, `WebConfig`, `UploadImagemService`, `SecurityConfig`) tinha valor — `Could not resolve placeholder 'app.security.jwt.secret'`. Corrigir só isso revelou uma segunda causa: os testes excluíam `DataSourceAutoConfiguration`/`HibernateJpaAutoConfiguration` para não depender de PostgreSQL, mas o contexto completo (`@SpringBootTest`) precisa de `UsuarioRepository` (JPA) para `CustomUserDetailsService` → `JwtAuthenticationFilter` → `SecurityConfig`. Resolvido adicionando H2 em memória **só para teste** (`pom.xml`, escopo `test`) com `ddl-auto: create-drop` (schema gerado das entidades JPA, já que as migrations Flyway usam sintaxe `SERIAL`/`BIGSERIAL` específica do PostgreSQL e continuam excluídas nos testes). O secret de JWT usado em teste é uma string fictícia, nunca usada para assinar token real. `mvn test` completo passa: 90/90.

### Pendências de produto

- **Atualizado na TASK-048**: o frontend do Totem, Caixa, Cozinha e do painel Admin (restaurante/categoria/produto/dispositivo/usuário, TASK-042 a TASK-048) está implementado e cobre o ciclo operacional completo mais a gestão administrativa via `/admin/*`.
- Sem WebSocket/atualização em tempo real — Caixa e Cozinha usam **polling manual** (botão "Atualizar lista") sobre `GET /api/caixa/pedidos/pendentes` e `GET /api/cozinha/pedidos`; o Totem usa polling automático leve (15s) em `GET /api/totem/pedidos/{id}` para acompanhamento.
- ~~Sem expiração automática de pedidos não pagos~~ **implementado na TASK-070, validado com backend real na TASK-071**: `PedidoExpiracaoJob` (`@Scheduled`, desligável via `app.pedidos.expiracao.job-enabled`) e `POST /api/admin/pedidos/expirar-vencidos` (manual, `SUPER_ADMIN`) marcam como `EXPIRADO` pedidos `CRIADO`/`AGUARDANDO_PAGAMENTO`/`AGUARDANDO_PAGAMENTO_DINHEIRO` criados há mais de `app.pedidos.expiracao.minutos` (padrão 30min), registrando histórico. Nunca afeta pedido `PAGO` em diante. Ver `docs/09-contratos-api.md` seção "Admin — Expiração de pedidos".

  **Validação manual TASK-071 (2026-07-11)**, backend real + PostgreSQL real (não H2), pedidos criados via HTTP no restaurante 1 e envelhecidos pelo relógio real (sem editar `criado_em` manualmente — a espera de ~1h20 durante a investigação abaixo tornou isso desnecessário):
  - Pedido `CRIADO` (id 5) envelhecido → **expirou** para `EXPIRADO`, histórico `CRIADO→EXPIRADO` com a observação padrão.
  - Pedido `AGUARDANDO_PAGAMENTO_DINHEIRO` (id 6, forma DINHEIRO) envelhecido → **expirou**, histórico correto.
  - Pedido `PAGO` (id 9, Pix) envelhecido → **permaneceu `PAGO`**, sem entrada de expiração no histórico.
  - Pedido `ENVIADO_PARA_COZINHA` (id 7, veio de um Pix enviado à cozinha pelo Caixa) envelhecido → **permaneceu `ENVIADO_PARA_COZINHA`**, sem entrada de expiração.
  - Pedido pré-existente de uma task anterior (id 2, `AGUARDANDO_PAGAMENTO_DINHEIRO` desde a TASK-069, >4h de idade) também expirou corretamente — confirma que a regra vale para qualquer pedido elegível no banco, não só os criados nesta validação.
  - **Job automático confirmado em execução real**: todas as expirações acima ocorreram sozinhas, disparadas pelo `@Scheduled` no instante seguinte ao boot da aplicação (comportamento padrão de `fixedDelay`, primeira execução imediata) — nenhuma chamada manual ao endpoint foi necessária para produzi-las.
  - Endpoint manual `POST /api/admin/pedidos/expirar-vencidos`: `200`/`{"pedidosExpirados":0}` quando não há nada elegível (idempotente — chamado duas vezes seguidas, sem duplicar histórico); sem token → `401`; `ADMIN_RESTAURANTE` → `403`; `SUPER_ADMIN` → `200`.
  - `GET /api/admin/pedidos?statusPedido=EXPIRADO` retorna os 4 pedidos expirados; `GET /api/admin/pedidos/{id}` mostra o histórico completo com a transição para `EXPIRADO`. Frontend não foi clicado diretamente (sem automação de navegador disponível), mas o contrato consumido é o mesmo já confirmado por código na TASK-070 (`STATUS_FILTRAVEIS` e `pedidoStatus.ts` já incluíam `EXPIRADO`).
  - `mvn test` completo (Maven 3.9.12 localizado em `~/.m2/wrapper/dists`, já que `mvn` não está no `PATH` do shell padrão): **193/193 testes, BUILD SUCCESS**, incluindo os 14 de `PedidoExpiracaoServiceTest` e os 13 de `PedidoAdminIntegrationTest`.

  **Achado operacional (não é bug de código)**: o processo de backend que já estava rodando havia horas (iniciado antes de todas as edições da TASK-070 serem salvas) respondia `500 Erro interno do servidor` especificamente em `POST /api/admin/pedidos/expirar-vencidos`, mesmo com `GET /api/admin/pedidos` funcionando normalmente no mesmo processo. Investigação: (1) `mvn test` local passa 100%; (2) o UPDATE+INSERT equivalente executado manualmente via `psql` direto no Postgres real funciona sem erro; (3) subindo uma instância nova e limpa do backend (mesmo código, mesmo banco, porta diferente) o mesmo `POST` retornou `200` e expirou os pedidos corretamente. Conclusão: o processo antigo ficou com estado inconsistente por causa do hot-swap incremental do IDE ao longo de várias edições estruturais (novas classes/beans da TASK-070) — reiniciar o backend (`mvn spring-boot:run` do zero) resolve. **Nenhuma alteração de código foi feita** — não é um bug da implementação, é uma limitação conhecida de hot-swap em processos Spring Boot de longa duração durante desenvolvimento ativo. Recomendação registrada no checklist: sempre reiniciar o backend depois de uma task que adiciona `@Component`/`@Service`/`@Scheduled` novos, antes de validar manualmente.
- ~~Sem relatórios/dashboards administrativos~~ **implementado na TASK-074**: `GET /api/admin/dashboard` retorna contadores simples de pedidos (fila operacional atual + contadores/valor pago "hoje", por `Pedido.criadoEm`), com o mesmo escopo por restaurante das demais telas administrativas. Sem gráficos, exportação ou relatório financeiro completo — ver `docs/09-contratos-api.md` seção "Admin — Dashboard" para as definições e limitações do MVP.
- ~~Gestão de dispositivos era só cadastral, sem visão de uso operacional~~ **implementado na TASK-077**: `ultimoAcesso` (campo já existente desde o início do projeto, mas nunca atualizado após a ativação) passa a ser atualizado a cada requisição autenticada de dispositivo (throttle de 1 minuto); `DispositivoResponse` ganhou `statusOperacional` derivado (`USADO_RECENTEMENTE`/`ATIVO`/`NUNCA_USADO`/`REVOGADO`). Não é presença em tempo real — sem WebSocket/heartbeat. **Bug real encontrado e corrigido nesta task**: `DispositivoService` usava `LocalDateTime.now()` (fuso local da JVM) em vez do `Clock` injetado (UTC), causando status operacional incorreto para dispositivos recém-ativados fora de UTC. Ver `docs/09-contratos-api.md` seção "Admin — Dispositivos (gestão operacional, TASK-077)". `mvn test` completo (Maven localizado em `~/.m2/wrapper/dists`, mesmo caminho documentado na TASK-071): **212/212 testes, BUILD SUCCESS**. **Validado manualmente com backend real + PostgreSQL real na TASK-078** (2026-07-12) via `curl`: criação/ativação de dispositivo TOTEM real → `GET /api/admin/dispositivos` mostra `ultimoAcesso` preenchido e `statusOperacional=USADO_RECENTEMENTE`; duas chamadas autenticadas consecutivas (`GET /api/totem/cardapio`) confirmam o throttle de 1 minuto (`ultimoAcesso` idêntico nas duas, sem erro `200`/`200`); revogação → token antigo passa a `401`, `ultimoAcesso` não avança, `statusOperacional=REVOGADO`; reativação → volta a `USADO_RECENTEMENTE` (ainda dentro da janela recente); `ADMIN_RESTAURANTE` só lista dispositivos do próprio restaurante, todos com `statusOperacional` correto; sem token → `401`; `ADMIN_RESTAURANTE` tentando revogar dispositivo de outro restaurante → `403`, sessão preservada (mesmo token continua `200` na chamada seguinte). Nenhum bug de código na feature em si — ver a nova pendência técnica de fuso horário registrada acima, encontrada durante esta validação.
- Adicionais/complementos de produto não implementados — nunca fizeram parte do contrato real (o `complementos` que aparecia em versões antigas de `docs/09-contratos-api.md` era um campo de design nunca implementado; documento corrigido na TASK-041).
- ~~`RestauranteService` sem nenhum teste dedicado (unitário ou integração)~~ **encontrado e corrigido na TASK-081** (consolidação da Fase 13): apesar de `Restaurante` ser a entidade raiz do sistema (tudo depende dela) e todo outro módulo administrativo ter cobertura de teste, o CRUD de restaurantes nunca tinha teste próprio. Adicionado `service/RestauranteServiceTest` (9 testes unitários, Mockito). Ver tabela de testes acima.
- **Pendência ainda aberta (identificada na TASK-081, não corrigida)**: `POST /api/admin/uploads/produtos/imagem` e `POST /api/admin/uploads/produtos/limpar-orfas` não têm teste de integração HTTP — `UploadImagemServiceTest` cobre a lógica de negócio do service diretamente (Mockito), mas nenhum teste verifica o `@PreAuthorize` do `UploadAdminController` (ex.: `ADMIN_RESTAURANTE` deveria receber `403` em `limpar-orfas`, exclusivo de `SUPER_ADMIN`). Não corrigido nesta task por exigir um teste de integração com `multipart/form-data` real — maior que uma correção "pequena e objetiva". Recomenda-se uma task futura dedicada, ou incluir junto de alguma revisão de uploads.

### Pendências de segurança

- Usuário humano (`ADMIN_RESTAURANTE`, `OPERADOR_CAIXA`, `OPERADOR_COZINHA`) não carrega `restauranteId` no principal (`CustomUserDetailsService` só expõe `email`/`authorities`) — por isso todos os endpoints operacionais (Totem/Caixa/Cozinha) exigem dispositivo, nunca usuário humano. Isso é uma limitação deliberada, repetida e documentada em todas as tasks de 019 a 024. A TASK-058 contornou essa mesma limitação para os CRUDs administrativos (ver item abaixo) sem alterar login/token: `AdminScopeService` resolve o restaurante do usuário autenticado buscando por email a cada validação de escopo, em vez de carregar `restauranteId` no principal.
- ~~`ADMIN_RESTAURANTE` não tem escopo por restaurante nos CRUDs administrativos (Categoria/Produto/Dispositivo)~~ **corrigido na TASK-058**: `AdminScopeService` valida, em cada operação de Categoria/Produto/Dispositivo, que o `ADMIN_RESTAURANTE` só acessa/altera/lista dados do próprio restaurante (`403` via `AccessDeniedException` caso contrário); `SUPER_ADMIN` mantém acesso irrestrito. `/api/admin/usuarios` permanece deliberadamente fora dessa regra (continua `SUPER_ADMIN` exclusivo). Ver `docs/09-contratos-api.md` seção "Escopo por restaurante para ADMIN_RESTAURANTE".
- ~~Sem refresh token nem logout — token só expira por tempo, sem revogação ativa para usuários humanos~~ **implementado na TASK-063**: `POST /api/auth/refresh` (rotação, um refresh ativo por usuário, login novo revoga o anterior) e `POST /api/auth/logout` (revoga o refresh token informado, idempotente). O `accessToken` (JWT) em si continua sem revogação ativa — só expira por tempo (`app.security.jwt.expiration-minutes`); é o `refreshToken` que passa a ter revogação real. Ver `docs/09-contratos-api.md` seção "Autenticação — login, refresh e logout administrativo".
- ~~Condição de corrida em `RefreshTokenService.validarERevogar`~~ **encontrada e corrigida na TASK-064**: o método fazia `SELECT` (via `findByTokenHash`) e depois `UPDATE` (via `save`) em passos separados — duas requisições concorrentes usando o **mesmo** refresh token (ex.: duas abas com o mesmo `accessToken` expirado chamando `/refresh` quase ao mesmo tempo) podiam ambas ler `revogado=false` antes de qualquer uma commitar, rotacionando com sucesso o mesmo token de uso único duas vezes — violando a invariante de "um refresh ativo por usuário". Reproduzido empiricamente contra o backend real: em 5 repetições de duas chamadas concorrentes com o mesmo token, todas as 5 tiveram **sucesso duplo** (`200`/`200`), quando o esperado era no máximo um sucesso. Corrigido com `RefreshTokenRepository.revogarSeAtivo` — um `UPDATE` atômico condicional (`WHERE token_hash = ? AND revogado = false AND expira_em > ?`) que se apoia no lock de linha do próprio Postgres: a segunda transação concorrente bloqueia até a primeira commitar e, ao reavaliar o `WHERE`, não encontra mais `revogado = false`, afetando 0 linhas. Reconfirmado manualmente após a correção (ver seção de validação da TASK-064 abaixo). Novo teste `RefreshTokenServiceTest.validarERevogar_duasChamadasConcorrentesComMesmoToken_apenasUmaDeveSerAceita`.
- ~~Sem rate limiting/brute-force protection no login~~ **implementado na TASK-065, validado manualmente com backend real na TASK-066**: `LoginAttemptService` (em memória, `ConcurrentHashMap`) bloqueia temporariamente (`429`) a chave email+IP após `app.security.login-rate-limit.max-failures` falhas consecutivas (padrão 5), por `block-minutes` (padrão 15). Login bem-sucedido zera o contador. Validado via `curl` contra o backend real (2026-07-10): 5 tentativas erradas → `401` cada; 6ª → `429` com header `Retry-After` (segundos restantes do bloqueio); senha correta durante o bloqueio → ainda `429`, sem tokens; e-mail existente sem tentativas anteriores (`admin.r1@totem.local`) não é afetado pelo bloqueio de `admin@totem.local`, mesmo IP; refresh/logout continuam funcionando normalmente para o usuário bloqueado (o bloqueio afeta só `/login`). Reset do contador após sucesso não foi reexercitado manualmente (exigiria esperar 15 minutos reais ou alterar a configuração só para o teste) — comportamento já coberto por `LoginAttemptServiceTest.bloqueioDeveExpirarAposBlockMinutos`/`sucessoDeveLimparContadorDeFalhas` com `Clock` controlado. Ver `docs/09-contratos-api.md` seção "Rate limiting do login administrativo". Limitação conhecida: em memória por instância — não há coordenação entre réplicas do backend, e reiniciar o processo limpa os contadores; não substitui WAF/proxy de borda em produção.
- ~~Token ausente/inválido/expirado sempre retorna 403 (nunca 401), então o fluxo de "sessão expirada" do frontend nunca dispara~~ **corrigido na TASK-061**: `RestAuthenticationEntryPoint` (novo, registrado em `SecurityConfig` via `.exceptionHandling().authenticationEntryPoint(...)`) agora responde `401` para qualquer requisição não autenticada; `403` continua reservado a "autenticado mas sem permissão" (`@PreAuthorize`/`AdminScopeService`, sem mudança). `JwtAuthenticationFilter` também passou a capturar qualquer exceção ao resolver a autenticação (ex.: usuário do token já excluído do banco) em vez de deixar vazar como `500`. Coberto por `security/SecurityHttpStatusTest` (MockMvc, contexto real). Achado original documentado na TASK-060 (encontrado durante a validação de escopo `ADMIN_RESTAURANTE`). **Bug adicional encontrado e corrigido na TASK-062**: a resposta `401` saía com `charset=ISO-8859-1` (padrão do servlet container quando não se chama `response.setCharacterEncoding(...)` explicitamente antes de `getWriter()`), corrompendo os acentos da mensagem — diferente do `403`/demais erros, que já saem em UTF-8 via o `HttpMessageConverter` do Spring MVC. `RestAuthenticationEntryPoint` agora chama `response.setCharacterEncoding("UTF-8")`, e o teste correspondente ganhou asserções de `Content-Type`/encoding/corpo para prevenir regressão.

### Pendências financeiras

- Cancelamento de pedido `PAGO` não estorna o pagamento — `Pagamento.statusPagamento` permanece `AUTORIZADO` mesmo com o pedido `CANCELADO` (decisão documentada na TASK-024).
- `PaymentProvider` não tem método de cancelamento/estorno implementado (`FakePaymentProvider` só tem `processar`).
- Sem Pix real, TEF ou SmartPOS — apenas `FakePaymentProvider` simulado.
- Sem conciliação financeira/relatório de caixa.

## 10. O backend está pronto para iniciar o frontend?

> **Nota (TASK-041)**: esta seção foi escrita na TASK-027, antes do frontend existir, como um checklist de prontidão do backend. O frontend operacional (Totem/Caixa/Cozinha) foi implementado nas TASK-028 a TASK-040 e todas as 4 ressalvas abaixo se confirmaram corretas na prática. O texto original foi mantido como registro histórico da decisão.

**Sim, para o fluxo operacional principal do MVP** (Totem → Pagamento → Caixa → Cozinha → Retirada/Cancelamento), que está implementado, consistente e testável ponta a ponta conforme a seção 5 deste documento.

Com a TASK-027, a tela de Caixa ganhou a peça que faltava: `GET /api/caixa/pedidos/pendentes` já entrega, num único request, tudo que o Caixa precisa agir (dinheiro pendente + pago aguardando envio à cozinha), com `acaoSugerida` pronta para decidir qual botão mostrar.

Ressalvas que o time de frontend ainda precisa saber antes de começar:

1. Painéis de Caixa e Cozinha vão precisar de **polling manual** (sem WebSocket) — inclusive para atualizar a fila de `GET /api/caixa/pedidos/pendentes`. ✅ Confirmado: implementado como botão "Atualizar lista" em ambos.
2. Login/sessão administrativa não tem refresh token — o frontend admin precisa lidar com expiração de sessão sem um fluxo de renovação automática. ✅ Confirmado: implementado sem renovação automática, apenas detecção de 401 e redirecionamento para login.
3. Painel administrativo de usuários não tinha backend. ✅ Resolvido na TASK-048: `UsuarioAdminController`/`UsuarioService` implementados, com frontend `/admin/usuarios`.
4. Cancelamento de pedido pago não estorna — se a UI permitir cancelar um pedido pago, deve deixar claro ao operador que o valor não é automaticamente devolvido. ✅ Confirmado: `PedidoPendenteCard` no Caixa permite cancelar pedidos `PAGO`, sem indicação de estorno na UI — mesma limitação do backend, documentada no `frontend/README.md`.
