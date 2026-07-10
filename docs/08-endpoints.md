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

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/auth/login` | Autenticar usuário humano |
| POST | `/api/auth/refresh` | Renovar sessão com refresh token |
| POST | `/api/auth/logout` | Encerrar sessão e revogar token |
| POST | `/api/auth/dispositivos/ativar` | Ativar dispositivo por código |

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

## Administração de usuários

Permissão exigida: `SUPER_ADMIN` (implementado na TASK-048; alteração de senha na TASK-049). **Não recebeu escopo por restaurante na TASK-058** — continua exclusivo de `SUPER_ADMIN`, decisão deliberada (gestão de usuários, inclusive outros admins, é mais sensível que cardápio/dispositivos).

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/usuarios` | Cadastrar usuário |
| GET | `/api/admin/usuarios` | Listar usuários (filtro opcional `restauranteId`) |
| PUT | `/api/admin/usuarios/{id}` | Atualizar usuário (não altera senha nem `ativo`) |
| PATCH | `/api/admin/usuarios/{id}/ativar` | Ativar usuário |
| PATCH | `/api/admin/usuarios/{id}/desativar` | Desativar usuário (bloqueado para o próprio usuário autenticado) |
| PATCH | `/api/admin/usuarios/{id}/senha` | Alterar senha do usuário (nunca retorna a senha/hash) |

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
