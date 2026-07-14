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
