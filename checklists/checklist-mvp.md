# Checklist do MVP

> Para passos detalhados de validação do ciclo operacional completo (Totem → Caixa → Cozinha → Caixa → Retirada), ver [`docs/checklists/fluxo-operacional-mvp.md`](../docs/checklists/fluxo-operacional-mvp.md).
> Para passos detalhados de validação do painel administrativo (`/admin`), ver [`docs/checklists/admin-mvp.md`](../docs/checklists/admin-mvp.md).

## Administrativo

- [ ] Login administrativo funcionando
- [ ] Cadastro de restaurante funcionando
- [ ] Cadastro de categoria funcionando
- [ ] Cadastro de produto funcionando
- [ ] Produto pode ser marcado como indisponível
- [ ] Produto pode ser marcado como destaque
- [ ] Alteração administrativa gera auditoria básica

## Totem

- [ ] Tela inicial funcionando
- [ ] Escolha de consumo funcionando
- [ ] Cardápio carregando produtos disponíveis
- [ ] Carrinho funcionando
- [ ] Pedido sendo criado
- [ ] Pagamento simulado funcionando
- [ ] Comprovante/senha sendo exibido

## Caixa

- [ ] Pedido em dinheiro aparece como pendente
- [ ] Caixa confirma pagamento
- [ ] Caixa cancela pedido pendente
- [ ] Pedido confirmado é liberado para cozinha

## Cozinha

- [ ] Cozinha lista pedidos liberados
- [ ] Cozinha altera status para EM_PREPARO
- [ ] Cozinha altera status para PRONTO
- [ ] Cozinha altera status para RETIRADO

## Segurança

- [ ] Endpoints administrativos protegidos
- [ ] Senha criptografada com BCrypt
- [ ] JWT funcionando
- [ ] Dispositivo revogado bloqueado
- [ ] Totem sem acesso ao admin
- [ ] Cozinha sem acesso ao caixa
- [ ] Caixa sem acesso ao admin

## Apresentação

- [ ] Massa de dados demo criada
- [ ] Roteiro de demonstração criado
- [ ] Ambiente demo funcionando
- [ ] Fluxo completo testado
