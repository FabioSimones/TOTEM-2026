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
