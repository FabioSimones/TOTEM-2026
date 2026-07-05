# Decisões Técnicas

## Backend

Decisão: Java 21 + Spring Boot

Motivo: stack robusta, profissional e adequada para APIs REST.

## Banco de dados

Decisão: PostgreSQL

Motivo: banco gratuito, confiável e adequado para produto real.

## Segurança

Decisão: Spring Security + JWT + BCrypt

Motivo: proteger API, controlar usuários, controlar dispositivos e evitar sessões inseguras.

## Frontend

Decisão: React + TypeScript

Motivo: adequado para PWA, telas touch-friendly, painéis administrativos e operacionais. Decisão definitiva para o MVP.

## Totem

Decisão: PWA em React

Motivo: elimina dependência de Android nativo ou modo kiosk no início. Permite validar o MVP em qualquer dispositivo com navegador.

## Restaurante

Decisão: CRUD completo no MVP, protegido por perfil SUPER_ADMIN

Motivo: o restaurante é a entidade raiz do sistema. Gerenciá-lo via interface administrativa (e não apenas por seed/migration) permite apresentar o produto como solução completa e permite configurar múltiplos restaurantes no futuro.

## Primeiro acesso administrativo

Decisão: usuário SUPER_ADMIN criado via seed/migration (Flyway)

Motivo: permite o primeiro login sem depender de um endpoint público de cadastro. Evita a necessidade de deixar rotas abertas antes de configurar segurança. O SUPER_ADMIN poderá criar outros usuários e restaurantes após autenticar.

## Pagamento

Decisão: começar com FakePaymentProvider

Motivo: permite validar fluxo completo antes de integrar Pix real, TEF, SmartPOS ou maquininha.

## Impressão

Decisão: fora do MVP

Motivo: impressora térmica adiciona dependência de hardware e deve entrar somente após validar o fluxo principal.

## Nota fiscal

Decisão: fora do MVP

Motivo: envolve obrigações fiscais, integração com sistemas governamentais e complexidade legal.

## Arquitetura

Decisão: monólito modular

Motivo: simples para construir, testar, apresentar e evoluir. Microserviços não são necessários no MVP.
