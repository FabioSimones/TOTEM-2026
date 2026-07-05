# Skill: Segurança JWT

Use esta skill para autenticação e autorização.

## Regras

- Senhas devem usar BCrypt.
- Login retorna access token e refresh token.
- Endpoints administrativos exigem perfil.
- Dispositivos devem ter token próprio.
- Dispositivo revogado não pode acessar a API.
- Não usar apenas IP como segurança.
- Não deixar endpoints sensíveis públicos.
- Refresh token deve ser revogável.
- Totem não pode acessar endpoints administrativos.
- Cozinha não pode confirmar pagamento.
- Caixa não pode alterar cardápio.

## Perfis

- SUPER_ADMIN
- ADMIN_RESTAURANTE
- OPERADOR_CAIXA
- OPERADOR_COZINHA

## Tipos de dispositivo

- TOTEM
- CAIXA
- COZINHA
- ADMINISTRACAO
