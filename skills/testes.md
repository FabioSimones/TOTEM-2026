# Skill: Testes e Qualidade

Use esta skill para validar o produto.

## Regras

- Criar testes para regra de negócio crítica.
- Testar fluxo ponta a ponta do MVP.
- Testar cenários de erro.
- Testar permissão por perfil.
- Testar permissão por dispositivo.
- Não considerar pronto sem checklist.

## Fluxos obrigatórios

1. Produto indisponível não aparece no totem.
2. Pedido sem item não pode ser criado.
3. Pedido com dinheiro fica pendente no caixa.
4. Pedido não pago não aparece na cozinha.
5. Caixa confirma pagamento e pedido aparece na cozinha.
6. Cozinha muda status para EM_PREPARO.
7. Cozinha muda status para PRONTO.
8. Dispositivo revogado não acessa API.
