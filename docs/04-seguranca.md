# Segurança e Controle de Acesso

## Princípio principal

A API não deve ficar aberta para qualquer pessoa ou equipamento da rede.

Toda requisição relevante deve responder:

1. Quem está acessando?
2. É usuário ou dispositivo?
3. Qual restaurante está vinculado?
4. Qual perfil ou tipo de dispositivo possui?
5. Essa entidade tem permissão para executar essa ação?

## Modelo recomendado

Não usar apenas IP como segurança.

Modelo recomendado:

```text
IP permitido
+ Token válido
+ Usuário ou dispositivo cadastrado
+ Permissão por função
+ Auditoria
```

## Usuários humanos

Perfis:

- SUPER_ADMIN
- ADMIN_RESTAURANTE
- OPERADOR_CAIXA
- OPERADOR_COZINHA

## Dispositivos

Tipos:

- TOTEM
- CAIXA
- COZINHA
- ADMINISTRACAO

## Sessão longa para dispositivos

Não criar sessão infinita.

Estratégia:

1. Dispositivo é cadastrado pelo administrador
2. Dispositivo recebe credencial própria
3. API emite access token de curta duração
4. API emite refresh token de longa duração
5. Dispositivo renova a sessão automaticamente
6. Administrador pode revogar o dispositivo

## Regras de segurança

- Senhas devem ser armazenadas com BCrypt
- JWT deve conter perfil ou tipo de dispositivo
- Refresh token deve ser revogável
- Dispositivo revogado não pode continuar acessando
- Endpoints administrativos exigem perfil administrativo
- Totem não pode acessar endpoints de admin
- Caixa não pode alterar cardápio
- Cozinha não pode confirmar pagamento
- Toda ação sensível deve gerar auditoria

## Bootstrap do primeiro SUPER_ADMIN (TASK-096)

**Risco identificado (TASK-095, classificado P0)**: as migrations `V4`/`V5` criavam um `SUPER_ADMIN` (`admin@totem.local`) com uma senha fixa (`Admin@2026!`) documentada em texto claro no próprio repositório versionado (migrations, README, checklists). Qualquer pessoa com acesso ao repositório conhecia a senha do usuário mais privilegiado do sistema — inaceitável para qualquer ambiente que não seja desenvolvimento local isolado.

**Correção aplicada**:
- A migration `V7` desativa (`ativo = false`) esse usuário em qualquer instalação onde a senha nunca tenha sido trocada (o `UPDATE` só afeta a linha se o hash ainda for exatamente o gravado pela V5 — se a senha já foi trocada pelo painel, nada acontece).
- O primeiro `SUPER_ADMIN` de um ambiente passa a ser criado por `SuperAdminBootstrapRunner` (`backend/src/main/java/com/totem/fastfood/bootstrap/`), um `ApplicationRunner` condicional (`app.bootstrap.super-admin.enabled`, default `false`) que só executa algo se explicitamente ligado **e** com e-mail/senha informados via variável de ambiente (`SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`).
- **Não existe valor padrão de senha em nenhum lugar do código** — ligar o bootstrap sem informar as duas variáveis falha o startup de propósito (`IllegalStateException`), para nunca mascarar um deploy mal configurado.
- O bootstrap nunca cria um segundo `SUPER_ADMIN` enquanto já existir um ativo (`existsByPerfilAndAtivoTrue`).

**Em produção**: `SUPER_ADMIN_BOOTSTRAP_ENABLED` deve ficar em `false` (ou nem ser definido) depois do primeiro `SUPER_ADMIN` criado — reabilitar por engano só é inofensivo porque o runner detecta o admin ativo existente e não faz nada, mas a prática recomendada é desligar assim que o primeiro acesso for garantido.

**Em desenvolvimento/teste**: nenhuma senha fixa é recomendada nem documentada como valor a usar — ver `README.md` seção "Primeiro acesso administrativo" para o passo a passo de habilitar o bootstrap localmente com uma senha escolhida pelo próprio desenvolvedor.

## JWT secret sem fallback inseguro (TASK-097)

**Risco identificado (TASK-095, classificado P0)**: `application.yml` tinha `secret: ${JWT_SECRET:uma-chave-local-de-desenvolvimento-com-tamanho-suficiente-para-hmac-sha256}` — se a variável de ambiente `JWT_SECRET` não fosse definida (erro humano plausível em qualquer deploy), a aplicação subia normalmente assinando **todos** os tokens (usuário, dispositivo e operador — `JwtService` usa a mesma chave HMAC para os três) com um valor fixo, publicamente conhecido neste repositório desde o primeiro commit. Não era uma chave "fraca" — era uma chave já comprometida por definição, disponível para qualquer um que lesse o código-fonte.

**Correção aplicada**:
- `application.yml` não tem mais fallback: `secret: ${JWT_SECRET:}`. Sem a variável definida, a propriedade chega vazia ao `JwtService`.
- `JwtSecretValidator` (`backend/src/main/java/com/totem/fastfood/security/`, novo) roda no construtor de `JwtService` — **antes** de qualquer token ser assinado — e falha o startup (`IllegalStateException`) se o secret estiver:
  - ausente ou em branco (mensagem: `"JWT_SECRET must be configured for this environment."`, seguida de instrução de como configurar);
  - menor que 32 caracteres;
  - igual ao valor antigo do fallback (rejeitado nominalmente, para o caso de alguém copiar o valor antigo de um ambiente já comprometido para uma variável de ambiente por engano).
- `JwtService` continua assinando USER/DEVICE/OPERADOR com a mesma chave (não houve mudança de claims, algoritmo ou expiração — fora do escopo desta task) — só a origem/validação do segredo mudou.
- `backend/src/test/resources/application.yml` já definia um secret próprio, fixo e claramente rotulado como fictício (`chave-fake-de-teste-nao-usar-em-producao-...`), isolado do `application.yml` principal — passa na nova validação sem qualquer ajuste (tamanho e conteúdo já eram adequados).

**Em produção**: `JWT_SECRET` é obrigatório, sem exceção — gerar um valor aleatório (ex.: `openssl rand -base64 48`) e nunca commitá-lo; guardar em variável de ambiente do servidor ou secret manager.

**Em desenvolvimento local**: também obrigatório (decisão consciente — não foi criado um profile `dev` com secret próprio, para não introduzir uma segunda categoria de "ambiente com fallback" e repetir o mesmo risco por outro caminho). Ver `README.md` seção "Variáveis de ambiente obrigatórias" para o passo a passo.

**Em teste**: nada muda — `mvn test` continua determinístico, usando o secret fictício já isolado em `backend/src/test/resources/application.yml`.

## CORS externalizado por ambiente (TASK-098)

**Risco identificado (TASK-095, classificado P0)**: `SecurityConfig.corsConfigurationSource()` tinha as origens permitidas hardcoded em Java (`http://localhost:5173`/`5174`) — funcionava só em desenvolvimento local; qualquer domínio de produção exigiria alterar e recompilar código, misturando configuração operacional com o próprio código-fonte.

**Correção aplicada**:
- `application.yml` não tem mais origens hardcoded: `allowed-origins: ${CORS_ALLOWED_ORIGINS:}` (`app.security.cors.allowed-origins`, lista separada por vírgula).
- `CorsOriginsValidator` (`backend/src/main/java/com/totem/fastfood/config/`, novo) roda dentro de `SecurityConfig.corsConfigurationSource()` — antes de montar o `CorsConfiguration` — e falha o startup (`IllegalStateException`) se a configuração estiver:
  - ausente ou em branco (mensagem: `"CORS_ALLOWED_ORIGINS must be configured for this environment."`);
  - contendo apenas espaços/vírgulas em branco;
  - contendo `"*"` (mesmo misturado com origens válidas);
  - contendo uma origem sem `http://`/`https://` explícito.
- Métodos (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`/`OPTIONS`) e headers (`Authorization`, `Content-Type`, `X-Operador-Token`) permanecem exatamente os mesmos — só a origem passou a ser configurável.
- `backend/src/test/resources/application.yml` ganhou `allowed-origins: http://localhost:5173,http://localhost:5174` (as mesmas duas de desenvolvimento) — necessário porque, diferente do bootstrap de SUPER_ADMIN (TASK-096, opcional), o bean de CORS é sempre instanciado pelo Spring Security, então as 13 classes `@SpringBootTest` do projeto exigiam essa propriedade.
- Novo `CorsConfigurationIntegrationTest` (MockMvc, contexto Spring completo): confirma que um preflight `OPTIONS /api/auth/login` com `Origin: http://localhost:5173` retorna `Access-Control-Allow-Origin` correto; que `X-Operador-Token` continua aceito no preflight de uma ação de Caixa; e que uma origem não configurada (`http://malicioso.local`) **não** recebe `Access-Control-Allow-Origin` — a primeira cobertura automatizada de CORS do projeto (antes só validado manualmente via `curl`, TASK-085/093/094).

**Em produção**: `CORS_ALLOWED_ORIGINS` deve conter exatamente a(s) origem(ns) do frontend real (protocolo + domínio + porta) — nunca `*`, nunca um domínio de exemplo commitado como se fosse o real.

**Em desenvolvimento local**: também obrigatório, mesma decisão da TASK-097 (exigir sempre, sem profile `dev` separado). Ver `README.md` seção "Variáveis de ambiente obrigatórias".

**Em teste**: `mvn test` continua determinístico — origens fixas em `backend/src/test/resources/application.yml`, usadas só para satisfazer o bean (nenhum teste de negócio depende delas), com cobertura de comportamento de CORS isolada em `CorsConfigurationIntegrationTest`.

## Observabilidade mínima (TASK-099)

**Objetivo**: dar visibilidade operacional mínima (health/info padronizados + logs dos fluxos sensíveis) sem expor nada que ajude um atacante a mapear a aplicação.

**Actuator exposto**: só dois endpoints ficam públicos, ambos liberados explicitamente em `SecurityConfig.ENDPOINTS_PUBLICOS`:
- `GET /actuator/health` — `{"status":"UP"}` (`management.endpoint.health.show-details: never`, então nunca inclui detalhes de componentes internos como status do datasource).
- `GET /actuator/info` — só as propriedades estáticas `info.app.name`/`info.app.description` definidas em `application.yml` (nome/descrição da aplicação); nenhum secret, URL interna, usuário de banco, configuração de JWT/CORS ou variável de ambiente é exposta.

**Actuator não exposto**: `management.endpoints.web.exposure.include` está restrito a `health,info` — qualquer outro endpoint (`/actuator/env`, `/actuator/beans`, `/actuator/configprops`, `/actuator/metrics`, `/actuator/loggers`, `/actuator/threaddump`, `/actuator/heapdump`, etc.) não tem exposição habilitada e por isso **nem existe como rota** no Spring MVC. Como esses paths não estão na lista de públicos, uma requisição sem token para eles recebe `401` (não autenticado) antes mesmo de o Spring MVC decidir 404 — nunca `200` com dado exposto.

**`/api/health` legado**: continua público e sem mudanças (`HealthController`, TASK anterior à observabilidade) — mantido por compatibilidade, resposta estática simples (`{"status":"UP","service":"totem-fast-food"}`), sem dependência de banco/beans. `/actuator/health` é o health operacional padrão recomendado para monitoramento externo daqui em diante; `/api/health` continua existindo, sem plano de remoção nesta task.

**Política de logs**: fluxos sensíveis (login admin, login operacional de operador, ativação/refresh de dispositivo, confirmar pagamento dinheiro, enviar à cozinha, marcar preparo/pronto, retirar, cancelar, bootstrap de SUPER_ADMIN) logam em `INFO`/`WARN` via SLF4J, sempre com IDs técnicos (`usuarioId`, `dispositivoId`, `restauranteId`, `pedidoId`, status anterior/novo) — **nunca** token JWT, refresh token, `operadorToken`, senha ou payload completo de login. Falhas de autenticação (`GlobalExceptionHandler.handleAuthentication`) logam em `DEBUG` só a mensagem genérica ("Email ou senha inválidos"), nunca qual credencial especificamente falhou.
