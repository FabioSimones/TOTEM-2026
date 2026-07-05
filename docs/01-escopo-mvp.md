# Escopo do MVP

## Objetivo do MVP

Validar o fluxo completo do sistema sem depender de hardware externo complexo, como maquininha, TEF, impressora térmica ou Pix real.

O MVP deve ser apresentável para cliente e deve provar que o produto funciona ponta a ponta.

## Stack do MVP

- Backend: Java 21 + Spring Boot + Spring Security + JWT + BCrypt
- Banco de dados: PostgreSQL com versionamento por Flyway
- Frontend: React + TypeScript
- Interface do Totem: PWA em React (tela cheia, touch-friendly)
- Pagamento: FakePaymentProvider (simulado)

## Incluído no MVP

- CRUD completo de Restaurante (protegido por SUPER_ADMIN)
- Usuário SUPER_ADMIN inicial criado via seed/migration (Flyway)
- Login administrativo com JWT
- Cadastro de categorias
- Cadastro de produtos
- Produtos em destaque ou recomendados
- Controle de disponibilidade dos produtos
- Listagem do cardápio no totem
- Carrinho
- Criação do pedido
- Pagamento simulado (Pix simulado, cartão simulado)
- Dinheiro com confirmação no caixa
- Cadastro de dispositivos com código de ativação
- Token de acesso para dispositivos (com refresh token revogável)
- Painel do caixa
- Painel da cozinha
- Atualização de status do pedido
- Comprovante simples de pedido
- Auditoria básica para alterações relevantes

## Fora do MVP

- Pix real
- Webhook real de pagamento
- Integração com maquininha
- TEF
- SmartPOS
- Impressora térmica
- Nota fiscal
- Relatórios avançados
- Controle de estoque
- Promoções complexas
- Multiunidade avançada
- Microserviços
- mTLS
- 2FA

## Critério de sucesso do MVP

O cliente deve conseguir assistir uma demonstração com o seguinte fluxo:

1. SUPER_ADMIN faz login
2. Administrador cadastra restaurante
3. Administrador cadastra categoria e produto
4. Totem exibe cardápio atualizado
5. Cliente cria pedido no totem
6. Cliente escolhe forma de pagamento
7. Caixa confirma pagamento quando necessário
8. Cozinha recebe pedido liberado
9. Cozinha altera status
10. Cliente visualiza senha/comprovante
