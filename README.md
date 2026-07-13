# Sistema de Totem de Autoatendimento para Fast Food

Este repositório de documentação foi estruturado para orientar o desenvolvimento do sistema de totem de autoatendimento para fast food usando IA, especialmente Claude Code e Codex.

A proposta é trabalhar com:

- Documentação técnica em `/docs`
- Cronograma de execução em `/tasks`
- Skills reutilizáveis em `/skills`
- Agents especializados em `/agents`
- Prompts prontos em `/prompts`
- Checklists de validação em `/checklists`
- Templates para novas tarefas em `/templates`

## Objetivo do produto

Criar uma solução funcional de autoatendimento para fast food, permitindo que o cliente realize pedidos pelo totem e que o restaurante controle pagamento, preparo, retirada, cardápio, usuários e dispositivos.

## Stack recomendada

- Backend: Java 21 + Spring Boot
- Banco: PostgreSQL
- Segurança: Spring Security + JWT + BCrypt + Refresh Token
- Frontend: React ou Angular com TypeScript
- Interface do Totem: Web/PWA em tela cheia
- Banco versionado com Flyway
- Documentação de API com Swagger/OpenAPI
- Pagamento inicial: FakePaymentProvider
- Pagamento futuro: Pix, TEF, SmartPOS ou gateway externo

## Como usar com IA

Nunca peça para a IA criar o sistema inteiro de uma vez.

Use este formato:

```text
Leia o arquivo da task atual.
Leia apenas as skills necessárias.
Execute somente o escopo descrito.
Não implemente nada fora da task.
Antes de alterar, explique o plano.
Depois de alterar, liste arquivos modificados e validações realizadas.
```

## CI e validações

O repositório tem um pipeline de CI (`.github/workflows/ci.yml`, GitHub Actions) que roda em todo `pull_request` e `push` para `main`, com três jobs paralelos:

- `backend-h2` — `cd backend && mvn test` (suíte rápida, sem Docker).
- `backend-postgres-it` — `cd backend && mvn verify -Ppostgres-it` (suíte contra PostgreSQL real via Testcontainers; exige Docker, disponível nos runners Ubuntu do GitHub Actions).
- `frontend` — `cd frontend && npm ci && npm run build && npm run lint`.

Localmente, os mesmos comandos continuam separados (não existe um único "make ci"):

```bash
cd backend && mvn test                    # suíte H2, sem Docker
cd backend && mvn verify -Ppostgres-it    # suíte PostgreSQL real, exige Docker rodando
cd frontend && npm run build && npm run lint
```

Detalhes de cada suíte de teste em `docs/testes-backend-mvp.md`.

## Ordem recomendada

1. Fase 1 - Planejamento
2. Fase 2 - Backend base
3. Fase 3 - Modelagem do banco
4. Fase 4 - Segurança
5. Fase 5 - Cardápio
6. Fase 6 - Pedidos
7. Fase 7 - Pagamentos
8. Fase 8 - Caixa
9. Fase 9 - Cozinha
10. Fase 10 - Frontend Totem
11. Fase 11 - Painel Admin
12. Fase 12 - Dispositivos
13. Fase 13 - Testes
14. Fase 14 - Apresentação ao cliente
