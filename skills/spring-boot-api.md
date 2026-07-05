# Skill: Spring Boot API

Use esta skill para desenvolver endpoints REST no backend do sistema de totem.

## Regras

- Usar Java 21.
- Usar Spring Boot.
- Separar controller, service, repository, entity, dto e mapper.
- Não expor entity diretamente no controller.
- Validar entrada com Bean Validation.
- Toda regra de negócio deve ficar no service.
- Todo erro deve usar tratamento global.
- Não implementar regra de negócio no controller.
- Não criar endpoint sem critério de aceite.
- Não misturar regra de pagamento com controller.

## Fluxo de execução

1. Ler a task atual.
2. Ler documentos em `/docs`.
3. Identificar entidades, DTOs e services afetados.
4. Criar alteração pequena e rastreável.
5. Atualizar ou criar testes quando aplicável.
6. Documentar como validar.

## Padrão esperado

Controller recebe request e chama service.

Service aplica regra de negócio.

Repository acessa banco.

DTO transporta dados.

Entity representa tabela.
