# Modelagem do Banco de Dados

## Entidades principais

## Restaurante

Representa o estabelecimento que utilizará o sistema.

Decisão: entidade gerenciada via CRUD administrativo, protegido por SUPER_ADMIN. Não é apenas seed/migration.

O usuário SUPER_ADMIN inicial é criado via migration (Flyway) para permitir o primeiro acesso. A partir dele, o administrador cadastra o restaurante pela interface.

Campos:

- id
- nome
- cnpj
- endereco
- ativo
- criadoEm
- atualizadoEm

## Categoria

Agrupa produtos do cardápio.

Campos:

- id
- restauranteId
- nome
- descricao
- ordemExibicao
- ativa

## Produto

Representa um item vendido no cardápio.

Campos:

- id
- restauranteId
- nome
- descricao
- preco
- imagemUrl
- disponivel
- destaque
- recomendado
- ordemExibicao
- categoriaId
- criadoEm
- atualizadoEm

## Pedido

Representa o pedido realizado pelo cliente.

Campos:

- id
- restauranteId
- numeroPedido
- clienteNome
- tipoConsumo
- statusPedido
- valorTotal
- dispositivoOrigemId
- criadoEm
- atualizadoEm

## ItemPedido

Representa cada produto dentro de um pedido.

Campos:

- id
- pedidoId
- produtoId
- nomeProduto
- quantidade
- precoUnitario
- subtotal
- observacao

## Pagamento

Representa o pagamento vinculado ao pedido.

Campos:

- id
- pedidoId
- formaPagamento
- statusPagamento
- valor
- paymentProvider
- externalPaymentId
- qrCodePix
- criadoEm
- pagoEm
- canceladoEm

## Usuario

Representa um usuário humano autorizado.

Campos:

- id
- restauranteId
- nome
- email
- senhaHash
- perfil
- ativo
- criadoEm
- atualizadoEm

## Dispositivo

Representa um equipamento autorizado a acessar a API.

Campos:

- id
- restauranteId
- nome
- codigoIdentificacao
- tipoDispositivo
- ativo
- ultimoAcesso
- criadoEm
- atualizadoEm

## RefreshToken

Representa um token de renovação de sessão.

Campos:

- id
- usuarioId
- dispositivoId
- tokenHash
- expiraEm
- revogado
- criadoEm
- revogadoEm

## HistoricoStatusPedido

Registra a evolução do pedido.

Campos:

- id
- pedidoId
- statusAnterior
- statusNovo
- dataAlteracao
- alteradoPorUsuarioId
- alteradoPorDispositivoId
- observacao

## Auditoria

Registra ações relevantes no sistema.

Campos:

- id
- restauranteId
- usuarioId
- dispositivoId
- acao
- entidadeAfetada
- entidadeId
- dataHora
- ipOrigem
- detalhes
