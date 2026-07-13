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
