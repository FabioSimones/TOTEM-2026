# TASK-025 - Ativação de dispositivo

## ATENÇÃO: Prioridade de execução

Esta task deve ser executada ANTES de qualquer endpoint que exija as permissões DEVICE_TOTEM, DEVICE_CAIXA ou DEVICE_COZINHA.

No planejamento atual (tasks/README.md), esta task corresponde à Fase 5 do cronograma — logo após a Fase 4 (Segurança) e antes da Fase 6 (Cardápio com endpoints do totem).

A ordem correta é:
- Fase 4 (Segurança): login de usuário com JWT
- Fase 5 (Dispositivos): esta task — ativação e token de dispositivo
- Fase 6 em diante: endpoints do totem, caixa e cozinha (que dependem de token de dispositivo)

Se esta task for executada fora de ordem, os endpoints do totem não poderão ser testados com autenticação real.

---

## Objetivo

Criar cadastro, código de ativação e token de dispositivo.

## Contexto

Esta task faz parte do desenvolvimento incremental do Sistema de Totem de Autoatendimento para Fast Food. Ela deve ser executada de forma isolada para evitar que a IA implemente funcionalidades fora de ordem.

## Escopo

- Implementar apenas o necessário para cumprir o objetivo da task.
- Respeitar a documentação da pasta `/docs`.
- Usar as skills correspondentes da pasta `/skills`.
- Manter a solução simples e adequada ao MVP.

## Fora do escopo

Não criar sessão infinita.

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

Execute a TASK-025 - Ativação de dispositivo.

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
