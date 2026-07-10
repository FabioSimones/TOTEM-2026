# Contratos de Dados da API

Revisado na TASK-041 para refletir os DTOs Java reais (antes desta revisão, este documento continha campos de um design inicial que nunca foram implementados — ver histórico do repositório). Os exemplos abaixo são representativos; para o contrato completo por campo, ver `docs/08-endpoints.md` e os próprios DTOs em `backend/src/main/java/com/totem/fastfood/dto/`.

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

## Erro padrão

Todo erro (400/401/403/404/500) segue o mesmo formato, produzido pelo `GlobalExceptionHandler`:

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
