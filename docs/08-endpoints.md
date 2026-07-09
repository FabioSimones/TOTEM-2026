# Endpoints REST Iniciais

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

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/categorias` | Criar categoria |
| GET | `/api/admin/categorias` | Listar categorias |
| PUT | `/api/admin/categorias/{id}` | Atualizar categoria |
| DELETE | `/api/admin/categorias/{id}` | Remover ou inativar categoria |

## Administração de produtos

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/produtos` | Criar produto |
| GET | `/api/admin/produtos` | Listar produtos |
| PUT | `/api/admin/produtos/{id}` | Atualizar produto |
| DELETE | `/api/admin/produtos/{id}` | Remover ou inativar produto |
| PATCH | `/api/admin/produtos/{id}/disponibilidade` | Alterar disponibilidade |
| PATCH | `/api/admin/produtos/{id}/destaque` | Alterar destaque |

## Administração de dispositivos

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/dispositivos` | Cadastrar dispositivo |
| GET | `/api/admin/dispositivos` | Listar dispositivos |
| PATCH | `/api/admin/dispositivos/{id}/revogar` | Revogar dispositivo |
| PATCH | `/api/admin/dispositivos/{id}/ativar` | Reativar dispositivo |

## Administração de usuários

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/usuarios` | Cadastrar usuário |
| GET | `/api/admin/usuarios` | Listar usuários |
| PUT | `/api/admin/usuarios/{id}` | Atualizar usuário |
| PATCH | `/api/admin/usuarios/{id}/desativar` | Desativar usuário |

## Webhooks futuros

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/webhooks/pix` | Receber confirmação Pix futura |
| POST | `/api/webhooks/pagamentos` | Receber confirmações de provedores futuros |
