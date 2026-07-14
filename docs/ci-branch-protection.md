# CI e Branch Protection — Totem Fast Food

Criado na TASK-100. Documenta a configuração recomendada de proteção da branch `main` no GitHub, aproveitando o pipeline já existente em `.github/workflows/ci.yml` (TASK-084). A configuração de branch protection em si é feita manualmente pela interface do GitHub — este documento não configura nada via API, apenas registra o passo a passo e a política recomendada.

## 1. Objetivo

Impedir que código quebrado (backend ou frontend) chegue à branch `main` sem passar pelos jobs de CI, e reduzir o risco de merges diretos sem revisão em um projeto com histórico de bugs encontrados só por validação manual (ver `docs/status-mvp.md`, TASK-064, TASK-085) — incluindo um bug real de CSS que só a homologação visual automatizada (TASK-102) encontrou.

## 2. Workflow atual

- Arquivo: `.github/workflows/ci.yml`
- Nome do workflow: `CI`
- Triggers: `pull_request` (qualquer branch de origem) e `push` para `main`
- Owner/repo (confirmado via `git remote -v`): `FabioSimones/TOTEM-2026`

### Jobs obrigatórios

| Nome exibido no GitHub | Comando | O que valida |
|---|---|---|
| `Backend (H2)` | `mvn -B test` | Suíte completa de testes unitários/integração contra H2 em memória |
| `Backend (PostgreSQL/Testcontainers)` | `mvn -B verify -Ppostgres-it` | Suíte de integração contra PostgreSQL real via Testcontainers (Docker nativo no runner `ubuntu-latest`) |
| `Frontend (build + lint)` | `npm ci && npm test && npm run build && npm run lint` | Testes unitários (Vitest), compilação TypeScript e lint do frontend |

Esses três nomes (exatamente como aparecem na aba "Checks" de um Pull Request) são os que devem ser marcados como obrigatórios no passo 4 abaixo.

### Job recomendado, mas ainda não obrigatório

| Nome exibido no GitHub | Comando | O que valida |
|---|---|---|
| `Frontend E2E (Playwright)` | `npx playwright install --with-deps chromium && npm run e2e` | Homologação visual headless (login Admin, `OperadorPainel`, Totem/Caixa/Cozinha) — API mockada via `page.route`, sem backend real |

Adicionado na TASK-103, com `needs: frontend` (só roda depois que o job `Frontend (build + lint)` já passou). **Recomendação**: acompanhar alguns runs no GitHub Actions antes de marcá-lo como obrigatório no passo 4 — é a primeira vez que Playwright roda no runner `ubuntu-latest` deste projeto (diferente do ambiente local onde foi validado), então vale confirmar estabilidade (sem flakiness de timing/browser) antes de deixar um PR legítimo bloqueado por ele. Depois de confirmado estável, adicionar `Frontend E2E (Playwright)` à lista de `Required checks` do passo 4 abaixo, junto dos outros três.

## 3. Checklist manual no GitHub

Caminho: **Settings → Branches → Branch protection rules → Add rule**

1. **Branch name pattern**: `main`
2. **Require a pull request before merging**: habilitado
3. **Require approvals**: `1`, se houver mais de uma pessoa revisando o repositório; pode ficar `0` enquanto o projeto tiver um único mantenedor, revisado quando entrar mais gente
4. **Require status checks to pass before merging**: habilitado
   - **Require branches to be up to date before merging**: habilitado
   - **Required checks** (buscar pelo nome exibido do job, exatamente como na tabela acima):
     - `Backend (H2)`
     - `Backend (PostgreSQL/Testcontainers)`
     - `Frontend (build + lint)`
5. **Require conversation resolution before merging**: habilitado
6. **Do not allow bypassing the above settings**: opcional — habilitar conforme a maturidade do projeto (recomendado assim que houver mais de um colaborador com permissão de admin)
7. **Restrict who can push to matching branches**: opcional — só relevante com múltiplos colaboradores
8. **Allow force pushes**: desabilitado
9. **Allow deletions**: desabilitado

> Os três checks só aparecem como opção de "required" depois que o workflow rodou pelo menos uma vez no repositório (em qualquer PR ou push) — se a lista vier vazia na primeira tentativa, abra um PR de teste, deixe o CI rodar, e volte a esta tela.

## 4. Política de merge recomendada

- Nenhum merge direto (`push`) em `main` — sempre via Pull Request.
- PR só pode ser mesclado com os três checks verdes.
- PR com CI vermelho: investigar a causa antes de qualquer nova tentativa — não usar `--no-verify`, não fazer force-push para "esconder" o commit que falhou, não reduzir cobertura de teste para fazer o pipeline passar artificialmente.
- Se o CI falhar por motivo não relacionado à mudança do PR (ex.: instabilidade de infraestrutura do runner), documentar isso no PR antes de re-rodar o job — não assumir "flaky" sem evidência.

## 5. Quando o CI falhar

1. Abrir o job que falhou e ler o primeiro stacktrace real (não confiar só na anotação genérica "Process completed with exit code 1" — ver TASK-099.1/TASK-100.1 para um exemplo de investigação onde a causa real só apareceu reproduzindo localmente).
2. Reproduzir localmente com o mesmo comando do job (`mvn test`, `mvn verify -Ppostgres-it`, `npm run build`, `npm run lint`, `npm run e2e`). Para `Frontend E2E (Playwright)`, baixar primeiro o artifact `playwright-report` do run que falhou (só é publicado em falha) — contém o relatório HTML e os traces/screenshots de `frontend/test-results/`, geralmente mais rápido que tentar reproduzir cegamente.
3. Se o comportamento divergir entre o ambiente local (Windows, neste projeto) e o runner (`ubuntu-latest`, Linux), considerar diferenças de SO antes de suspeitar de variável de ambiente ausente — foi a causa raiz real da falha corrigida na TASK-099.1.
4. Corrigir a causa raiz, nunca o sintoma (não desabilitar teste, não marcar como `@Disabled` sem justificativa registrada em `docs/status-mvp.md`).

## 6. Artefatos de build e commits

- `backend/target/` e logs de execução local (`backend/*.log`) não devem ser versionados — cobertos pelo `.gitignore` da raiz desde a TASK-100.1.
- Antes de commitar, rodar `git status` e conferir se algum arquivo gerado por build (`.class`, `target/`, `dist/`, `node_modules/`) aparece na lista — se aparecer, é sinal de que o `.gitignore` não está cobrindo o caminho.
- Nunca commitar segredos: `JWT_SECRET`, credenciais de banco, `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` reais. O `.gitignore` já ignora `.env` (mantendo `.env.example` versionado como template) — variáveis de ambiente reais ficam só na configuração do CI/ambiente de deploy, nunca em arquivo commitado.

## 7. Relação com `.gitignore`

O `.gitignore` da raiz (criado na TASK-100.1) cobre `target/`, `**/target/`, `build/`, `dist/`, `*.log`, `node_modules/` e `.env` (com exceção de `.env.example`). Branch protection reduz o risco de código quebrado chegar a `main`; o `.gitignore` reduz o risco de artefato de build ou segredo chegar ao histórico do Git — são camadas complementares, não substitutas uma da outra.
