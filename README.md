# Sistema de Totem de Autoatendimento para Fast Food

[![CI](https://github.com/FabioSimones/TOTEM-2026/actions/workflows/ci.yml/badge.svg)](https://github.com/FabioSimones/TOTEM-2026/actions/workflows/ci.yml)

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

O repositório tem um pipeline de CI (`.github/workflows/ci.yml`, GitHub Actions) que roda em todo `pull_request` e `push` para `main`, com quatro jobs:

- `backend-h2` — `cd backend && mvn test` (suíte rápida, sem Docker).
- `backend-postgres-it` — `cd backend && mvn verify -Ppostgres-it` (suíte contra PostgreSQL real via Testcontainers; exige Docker, disponível nos runners Ubuntu do GitHub Actions).
- `frontend` — `cd frontend && npm ci && npm test && npm run build && npm run lint`.
- `frontend-e2e` (TASK-103, `needs: frontend`) — `cd frontend && npx playwright install --with-deps chromium && npm run e2e` (homologação visual headless com Playwright, API mockada — não sobe backend). Em falha, publica o relatório/traces como artifact do GitHub Actions.

Os três primeiros rodam em paralelo; `frontend-e2e` só inicia depois que `frontend` passa. Localmente, os mesmos comandos continuam separados (não existe um único "make ci"):

```bash
cd backend && mvn test                    # suíte H2, sem Docker
cd backend && mvn verify -Ppostgres-it    # suíte PostgreSQL real, exige Docker rodando
cd frontend && npm test && npm run build && npm run lint
cd frontend && npm run e2e                # E2E Playwright (requer os browsers instalados, ver frontend/README.md)
```

Detalhes de cada suíte de teste em `docs/testes-backend-mvp.md`.

## Verificar saúde da aplicação (TASK-099)

Com o backend no ar, dois endpoints públicos confirmam disponibilidade:

```bash
curl http://localhost:8080/api/health        # health legado, mantido por compatibilidade
curl http://localhost:8080/actuator/health    # health operacional padrão (Spring Boot Actuator)
curl http://localhost:8080/actuator/info      # nome/descrição da aplicação, sem dado sensível
```

Nenhum outro endpoint do Actuator (`/actuator/env`, `/actuator/metrics`, `/actuator/beans`, etc.) fica exposto publicamente — ver `docs/04-seguranca.md` seção "Observabilidade mínima" e `docs/08-endpoints.md` seção "Observabilidade".

## Variáveis de ambiente obrigatórias (backend)

Desde a TASK-097, o backend **não sobe** sem `JWT_SECRET` configurado — não há mais fallback de desenvolvimento no `application.yml` (o valor antigo era fixo e publicamente conhecido neste repositório, risco P0 da TASK-095). Antes da primeira execução (`mvn spring-boot:run` ou os testes de contexto), defina:

```bash
export JWT_SECRET="gere um valor aleatório de pelo menos 32 caracteres, nunca commitado"
```

- Mínimo de 32 caracteres (validado no startup — `JwtSecretValidator`).
- Nunca usar o valor antigo `uma-chave-local-de-desenvolvimento-com-tamanho-suficiente-para-hmac-sha256` (removido, rejeitado explicitamente se reaparecer).
- Sem a variável (ou com um valor curto/o antigo), a aplicação falha no startup com uma mensagem clara em vez de subir com um segredo inseguro.
- Em ambiente de teste (`mvn test`), um secret próprio e claramente rotulado já está definido em `backend/src/test/resources/application.yml` — não precisa (nem deve) reaproveitar o valor de produção ali.
- Nunca commitar o valor real usado em produção — gerar localmente (ex.: `openssl rand -base64 48`) e guardar fora do repositório (variável de ambiente do servidor, secret manager, etc.).

Desde a TASK-098, o backend também **não sobe** sem `CORS_ALLOWED_ORIGINS` configurado — as origens deixaram de ser fixas em `SecurityConfig.java`:

```bash
export CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

- Lista separada por vírgula, cada origem com protocolo explícito (`http://`/`https://`) e porta quando houver.
- Em desenvolvimento local: `http://localhost:5173,http://localhost:5174` (as duas portas que o Vite usa).
- Em produção: a origem exata do domínio do frontend, ex. `https://seu-dominio.com` — **nunca** um domínio de exemplo commitado como se fosse real, e **nunca** `*`.
- `*` é sempre rejeitado no startup (`CorsOriginsValidator`), mesmo que alguém tente configurar assim.
- Sem a variável (ou com um valor vazio/`*`), a aplicação falha no startup com mensagem clara.
- Em ambiente de teste, `backend/src/test/resources/application.yml` já define as mesmas duas origens de desenvolvimento — só para satisfazer o bean, não é usado para testar comportamento de CORS de fato (isso é feito por `CorsConfigurationIntegrationTest`).

Ver `docs/04-seguranca.md` para o detalhamento completo.

## Primeiro acesso administrativo (SUPER_ADMIN)

Desde a TASK-096, o sistema **não** cria mais um `SUPER_ADMIN` com senha fixa por migration — o antigo seed (`admin@totem.local`/senha documentada) foi desativado para qualquer instalação onde a senha nunca tenha sido trocada (ver `docs/04-seguranca.md`). Para ter um `SUPER_ADMIN` ativo (ambiente local novo, ou um ambiente onde o seed antigo foi desativado), defina estas variáveis de ambiente **antes** de subir o backend pela primeira vez:

```bash
export SUPER_ADMIN_BOOTSTRAP_ENABLED=true
export SUPER_ADMIN_EMAIL=admin@totem.local
export SUPER_ADMIN_PASSWORD="escolha uma senha sua aqui"
```

Na próxima subida (`mvn spring-boot:run`), o `SuperAdminBootstrapRunner` cria o usuário com a senha informada (BCrypt) — só executa se ainda não houver nenhum `SUPER_ADMIN` ativo. Sem essas variáveis, o bootstrap fica desligado por padrão e nenhuma credencial é criada — não há senha padrão de produção em lugar nenhum do código.

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
