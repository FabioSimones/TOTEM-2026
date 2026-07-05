# Roadmap de Desenvolvimento

## Fase 1 - Planejamento e estrutura (CONCLUÍDA)

- Definir entidades
- Definir regras de negócio
- Criar estrutura de documentação
- Criar tasks
- Criar skills
- Criar agents

## Fase 2 - Backend base

- Criar projeto Spring Boot com Java 21
- Configurar banco PostgreSQL
- Configurar Flyway para versionamento do banco
- Configurar Swagger/OpenAPI
- Criar tratamento global de erros

## Fase 3 - Modelagem do banco e CRUD de Restaurante

- Criar enums do sistema (StatusPedido, StatusPagamento, etc.)
- Criar entidades base (Restaurante, Categoria, Produto, Usuario, Dispositivo)
- Criar entidades de pedido e pagamento (Pedido, ItemPedido, Pagamento, HistoricoStatusPedido, Auditoria, RefreshToken)
- Criar CRUD administrativo de Restaurante (protegido por SUPER_ADMIN)
- Criar migration de seed com usuário SUPER_ADMIN inicial

## Fase 4 - Segurança

- Configurar Spring Security
- Implementar login de usuário com JWT e BCrypt
- Implementar refresh token para usuários
- Criar perfis de usuário (SUPER_ADMIN, ADMIN_RESTAURANTE, OPERADOR_CAIXA, OPERADOR_COZINHA)
- Proteger endpoints administrativos por perfil
- Aplicar proteção SUPER_ADMIN ao CRUD de Restaurante

## Fase 5 - Dispositivos

- Implementar cadastro de dispositivos pelo administrador
- Gerar código de ativação para cada dispositivo
- Implementar endpoint de ativação do dispositivo
- Emitir access token e refresh token para dispositivos
- Implementar renovação automática de sessão do dispositivo
- Implementar revogação de dispositivo
- Criar permissões por tipo (DEVICE_TOTEM, DEVICE_CAIXA, DEVICE_COZINHA)

Atenção: esta fase deve ser concluída antes de qualquer endpoint que exija DEVICE_TOTEM, DEVICE_CAIXA ou DEVICE_COZINHA.

## Fase 6 - Cardápio

- Criar CRUD de categorias
- Criar CRUD de produtos
- Controlar disponibilidade de produtos
- Definir produtos em destaque e recomendados
- Listar cardápio filtrado para o totem

## Fase 7 - Pedidos

- Criar pedido com itens
- Calcular valor total no backend
- Gerar número do pedido
- Registrar histórico de status
- Consultar pedido pelo totem

## Fase 8 - Pagamentos simulados

- Criar entidade Pagamento
- Implementar FakePaymentProvider
- Simular Pix (confirmação automática)
- Simular cartão (confirmação automática)
- Criar fluxo de pagamento em dinheiro (aguarda caixa)

## Fase 9 - Painel do caixa

- Listar pedidos pendentes de confirmação
- Confirmar pagamento em dinheiro
- Cancelar pedido não pago

## Fase 10 - Painel da cozinha

- Listar pedidos pagos
- Mudar status para EM_PREPARO
- Mudar status para PRONTO
- Finalizar retirada (RETIRADO)

## Fase 11 - Frontend do Totem (React + TypeScript / PWA)

- Criar projeto React + TypeScript
- Configurar PWA (modo tela cheia, touch-friendly)
- Criar tela de boas-vindas
- Criar listagem de cardápio
- Criar carrinho
- Criar fluxo de pagamento
- Criar tela de confirmação e acompanhamento de pedido
- Criar timeout de inatividade

## Fase 12 - Painel Administrativo (React + TypeScript)

- Criar interface para CRUD de Restaurante
- Criar interface para CRUD de categorias e produtos
- Criar interface para gestão de usuários
- Criar interface para gestão de dispositivos
- Criar visualização de auditoria

## Fase 13 - Testes

- Testes do fluxo completo do MVP
- Testes de endpoints com Postman ou similares
- Validação de regras de negócio críticas
- Verificação de segurança por perfil e por dispositivo

## Fase 14 - Apresentação

- Preparar roteiro de demonstração
- Configurar ambiente de demo
- Executar demonstração ponta a ponta
