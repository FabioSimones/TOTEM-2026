# Arquitetura Recomendada

## Visão geral

A arquitetura deve ser modular, com separação clara entre apresentação, API, regras de negócio, persistência, segurança e integrações.

Para o MVP, a comunicação será via REST API.

WebSocket pode ser adotado futuramente para atualização em tempo real nos painéis de caixa e cozinha.

## Componentes

```text
Cliente
  ↓
Totem / Tablet / PWA
  ↓
Backend Java / Spring Boot
  ↓
Banco de Dados PostgreSQL
  ↓
Painel do Caixa / Painel da Cozinha / Painel Administrativo
```

## Camadas

```text
Apresentação
- Totem
- Caixa
- Cozinha
- Admin

API REST
- Controllers
- Contratos HTTP

Negócio
- Services
- Validações
- Regras

Persistência
- Repositories
- Entities
- Mappers

Segurança
- JWT
- Perfis
- Dispositivos
- Auditoria

Integrações
- FakePaymentProvider
- Pix futuro
- TEF futuro
- SmartPOS futuro
- Impressão futura
```

## Backend

Stack recomendada:

- Java 21
- Spring Boot
- Spring Web
- Spring Data JPA
- Bean Validation
- Spring Security
- Flyway
- Swagger/OpenAPI
- PostgreSQL

## Frontend

Recomendação para MVP:

- React + TypeScript ou Angular + TypeScript
- PWA
- Tela cheia para Totem
- Layout touch friendly
- Painéis web para caixa, cozinha e administração

## Decisão importante

Começar simples e funcional. Evitar microserviços, integrações reais de pagamento, impressão e complexidades de infraestrutura no MVP.
