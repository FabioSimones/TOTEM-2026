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
