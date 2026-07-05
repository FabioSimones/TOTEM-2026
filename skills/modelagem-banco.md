# Skill: Modelagem de Banco

Use esta skill para criar entidades JPA e migrations Flyway.

## Regras

- Toda tabela deve ter id.
- Usar `created_at` e `updated_at` quando fizer sentido.
- Relacionamentos devem ser claros.
- Não criar coluna sem regra de negócio.
- Toda alteração estrutural deve ter migration Flyway.
- Não alterar migration antiga já aplicada; criar nova migration.
- Criar constraints para garantir integridade.
- Criar índices quando houver busca frequente.

## Entidades principais

- Restaurante
- Categoria
- Produto
- Pedido
- ItemPedido
- Pagamento
- Usuario
- Dispositivo
- RefreshToken
- HistoricoStatusPedido
- Auditoria
