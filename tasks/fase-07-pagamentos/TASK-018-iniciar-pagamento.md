# TASK-018 - Iniciar pagamento do pedido

## Objetivo

Criar endpoint para iniciar pagamento Pix/cartão/dinheiro no MVP.

## Contexto

Esta task faz parte do desenvolvimento incremental do Sistema de Totem de Autoatendimento para Fast Food. Ela deve ser executada de forma isolada para evitar que a IA implemente funcionalidades fora de ordem.

## Escopo

- Implementar apenas o necessário para cumprir o objetivo da task.
- Respeitar a documentação da pasta `/docs`.
- Usar as skills correspondentes da pasta `/skills`.
- Manter a solução simples e adequada ao MVP.

## Fora do escopo

Não enviar pedido à cozinha antes de confirmar pagamento.

## Arquivos esperados

A IA deve identificar os arquivos necessários antes de alterar. Se precisar criar arquivos, deve justificar.

## Regras de negócio

- Respeitar regras descritas em `docs/06-regras-negocio.md`.
- Não criar comportamento que envie pedido não pago para cozinha.
- Não confiar em preço enviado pelo frontend.
- Não liberar acesso indevido por perfil ou dispositivo.

## Critérios de aceite

- [ ] A task foi implementada apenas dentro do escopo.
- [ ] A solução respeita a arquitetura documentada.
- [ ] As regras de negócio aplicáveis foram respeitadas.
- [ ] Foi informado como testar manualmente.
- [ ] Nenhuma funcionalidade futura foi implementada sem necessidade.

## Prompt para IA

```text
Você é um desenvolvedor sênior fullstack.

Execute a TASK-018 - Iniciar pagamento do pedido.

Leia antes:
- README.md
- docs/00-visao-geral.md
- docs/01-escopo-mvp.md
- docs/06-regras-negocio.md
- Este arquivo de task

Instruções:
1. Não implemente nada fora do escopo.
2. Antes de alterar, explique o plano.
3. Depois de alterar, liste arquivos modificados.
4. Informe como testar.
5. Informe pendências ou riscos.
```
