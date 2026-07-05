# Checklist de Code Review

## Geral

- [ ] A alteração respeita a task?
- [ ] Não implementou fora do escopo?
- [ ] Código está claro?
- [ ] Nomes estão compreensíveis?
- [ ] Existem validações necessárias?
- [ ] Erros são tratados corretamente?

## Backend

- [ ] Controller não possui regra de negócio
- [ ] Service concentra regra de negócio
- [ ] Repository só acessa banco
- [ ] DTO é usado em entrada e saída
- [ ] Entity não é exposta diretamente
- [ ] Bean Validation foi usado quando necessário
- [ ] Erros seguem padrão global

## Banco

- [ ] Migration criada quando necessário
- [ ] Relacionamentos corretos
- [ ] Campos obrigatórios definidos
- [ ] Índices avaliados
- [ ] Não alterou migration antiga aplicada

## Segurança

- [ ] Endpoint protegido corretamente
- [ ] Permissão adequada
- [ ] Não expõe dado sensível
- [ ] Não confia em dados críticos do frontend
- [ ] Auditoria registrada quando necessário

## Testes

- [ ] Fluxo principal testado
- [ ] Cenário de erro testado
- [ ] Regressão avaliada
