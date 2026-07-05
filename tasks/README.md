# Tasks do Projeto

Esta pasta organiza o cronograma de desenvolvimento do Sistema de Totem de Autoatendimento para Fast Food.

## Como executar

Execute uma task por vez.

Nunca peça para a IA fazer o sistema inteiro.

## Ordem sugerida

1. Fase 1 - Planejamento (CONCLUÍDA)
2. Fase 2 - Backend base (Spring Boot, PostgreSQL, Flyway, Swagger, tratamento de erros)
3. Fase 3 - Modelagem do banco e CRUD de Restaurante (Enums, Entidades, CRUD Restaurante, seed SUPER_ADMIN)
4. Fase 4 - Segurança (Spring Security, JWT, BCrypt, perfis, proteção de endpoints)
5. Fase 5 - Dispositivos (cadastro, código de ativação, token, revogação) — DEVE VIR ANTES dos endpoints de Totem, Caixa e Cozinha
6. Fase 6 - Cardápio (categorias, produtos, disponibilidade, destaque)
7. Fase 7 - Pedidos (criar pedido, calcular total, histórico de status)
8. Fase 8 - Pagamentos (FakePaymentProvider, Pix simulado, cartão simulado, dinheiro)
9. Fase 9 - Caixa (confirmar dinheiro, cancelar pedido)
10. Fase 10 - Cozinha (fila de preparo, atualizar status)
11. Fase 11 - Frontend Totem (React + TypeScript, PWA)
12. Fase 12 - Admin (painel administrativo React)
13. Fase 13 - Testes (fluxo completo, segurança, regras de negócio)
14. Fase 14 - Apresentação (roteiro de demo, ambiente, validação ponta a ponta)

## Regra principal

Uma task deve ser pequena, objetiva e validável.
