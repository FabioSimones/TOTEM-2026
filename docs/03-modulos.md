# Módulos do Sistema

## 1. Totem do Cliente

Interface utilizada pelo cliente final.

Funcionalidades:

- Tela inicial de boas-vindas
- Escolha entre comer no local ou levar
- Listagem de categorias
- Listagem de produtos
- Detalhe do produto
- Seleção de adicionais
- Remoção de ingredientes, se aplicável
- Carrinho
- Identificação do cliente
- Escolha de forma de pagamento
- Exibição do status do pedido
- Exibição da senha ou comprovante

Permissões:

- Ver cardápio
- Criar pedido
- Iniciar pagamento
- Consultar status do próprio pedido

Restrições:

- Não altera produtos
- Não confirma pagamento em dinheiro
- Não cancela pedidos de outros módulos
- Não acessa dados administrativos

## 2. Backend Java

Responsável por centralizar as regras de negócio.

Responsabilidades:

- Gerenciar produtos e categorias
- Criar pedidos
- Calcular total do pedido
- Registrar pagamentos
- Controlar status do pedido
- Controlar status do pagamento
- Enviar pedidos pagos para a cozinha
- Receber confirmação de pagamento
- Validar autenticação
- Validar autorização
- Controlar dispositivos autorizados
- Registrar auditoria
- Disponibilizar APIs

## 3. Painel do Caixa

Utilizado por funcionários para controlar pagamentos pendentes.

Funcionalidades:

- Ver pedidos aguardando pagamento
- Confirmar pagamento em dinheiro
- Confirmar pagamento manual externo
- Cancelar pedido não pago
- Reimprimir comprovante
- Consultar histórico de pedidos

## 4. Painel da Cozinha

Utilizado pela equipe de produção.

Funcionalidades:

- Ver pedidos pagos
- Ver itens do pedido
- Ver adicionais e observações
- Alterar status para EM_PREPARO
- Alterar status para PRONTO
- Organizar fila de preparo

Regra importante:

A cozinha só deve receber pedidos com pagamento confirmado.

## 5. Painel Administrativo

Utilizado para gestão do cardápio, usuários, dispositivos e configurações.

Funcionalidades:

- Cadastrar categorias
- Cadastrar produtos
- Editar produtos
- Remover ou desativar produtos
- Definir preços
- Controlar disponibilidade
- Definir produtos em destaque
- Alterar ordem de exibição
- Criar usuários
- Definir perfis
- Cadastrar dispositivos
- Revogar dispositivos
- Consultar auditoria
