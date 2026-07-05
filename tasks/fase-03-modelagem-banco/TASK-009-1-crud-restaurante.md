# TASK-009-1 - Criar CRUD administrativo de Restaurante

## Objetivo

Implementar o CRUD completo de Restaurante com Entity, Repository, Service, Controller e DTOs.
Criar a migration de seed com o usuário SUPER_ADMIN inicial.

## Contexto

Esta task faz parte do desenvolvimento incremental do Sistema de Totem de Autoatendimento para Fast Food.

O Restaurante é a entidade raiz do sistema. Toda categoria, produto, usuário e dispositivo pertence a um restaurante. Por isso, o CRUD de Restaurante deve existir antes das demais funcionalidades de negócio.

O Spring Security ainda não estará configurado nesta task. Os endpoints serão criados sem proteção de perfil por enquanto. A proteção por SUPER_ADMIN será aplicada na Fase 4 (Segurança), quando o Spring Security estiver ativo.

Decisão oficial registrada em: `docs/14-decisoes-tecnicas.md`

## Escopo

- Criar a entidade `Restaurante` mapeada para o banco PostgreSQL via JPA.
- Criar a migration Flyway para a tabela `restaurantes`.
- Criar o `RestauranteRepository` usando Spring Data JPA.
- Criar os DTOs de entrada e saída (ex: `CriarRestauranteRequest`, `AtualizarRestauranteRequest`, `RestauranteResponse`).
- Criar o `RestauranteService` com as operações: criar, listar, buscar por ID, atualizar, ativar e desativar.
- Criar o `RestauranteController` com os endpoints documentados em `docs/08-endpoints.md`.
- Criar o `RestauranteMapper` para conversão entre Entity e DTO.
- Criar a migration Flyway de seed com um usuário SUPER_ADMIN inicial (email, senha em BCrypt, perfil SUPER_ADMIN, ativo=true).

## Endpoints a implementar

| Método | Rota | Objetivo |
|---|---|---|
| POST | `/api/admin/restaurantes` | Cadastrar restaurante |
| GET | `/api/admin/restaurantes` | Listar restaurantes |
| GET | `/api/admin/restaurantes/{id}` | Buscar restaurante por ID |
| PUT | `/api/admin/restaurantes/{id}` | Atualizar dados do restaurante |
| PATCH | `/api/admin/restaurantes/{id}/ativar` | Ativar restaurante |
| PATCH | `/api/admin/restaurantes/{id}/desativar` | Desativar restaurante |

## Fora do escopo

- Não implementar Spring Security nesta task.
- Não implementar autenticação ou JWT nesta task.
- Não implementar CRUD de categorias.
- Não implementar CRUD de produtos.
- Não implementar CRUD de usuários além do seed.
- Não implementar pedidos.
- Não implementar pagamento.
- Não implementar dispositivos.
- Não criar frontend.

## Arquivos esperados

A IA deve criar ou ajustar:

- `entity/Restaurante.java`
- `repository/RestauranteRepository.java`
- `dto/restaurante/CriarRestauranteRequest.java`
- `dto/restaurante/AtualizarRestauranteRequest.java`
- `dto/restaurante/RestauranteResponse.java`
- `service/RestauranteService.java`
- `controller/admin/RestauranteController.java`
- `mapper/RestauranteMapper.java`
- `resources/db/migration/V3__criar_tabela_restaurantes.sql`
- `resources/db/migration/V4__seed_super_admin.sql`

Os nomes de versão das migrations devem respeitar a sequência já criada nas tasks anteriores.

## Regras de negócio

- CNPJ deve ser armazenado sem formatação (apenas dígitos).
- Restaurante desativado não deve aparecer no cardápio do totem.
- Não é permitido criar dois restaurantes com o mesmo CNPJ.
- O backend deve calcular `criadoEm` e `atualizadoEm` automaticamente.
- A entidade não deve ser exposta diretamente na resposta HTTP — usar DTO.
- Toda regra de negócio deve ficar no service, não no controller.
- A senha do SUPER_ADMIN no seed deve ser armazenada com BCrypt (mesmo que o Spring Security ainda não esteja ativo, a senha já deve estar criptografada para evitar retrabalho).

## Critérios de aceite

- [ ] A migration da tabela `restaurantes` executa sem erro.
- [ ] A migration de seed do SUPER_ADMIN executa sem erro.
- [ ] O endpoint POST `/api/admin/restaurantes` cria um restaurante e retorna 201.
- [ ] O endpoint GET `/api/admin/restaurantes` retorna lista de restaurantes.
- [ ] O endpoint GET `/api/admin/restaurantes/{id}` retorna 404 para ID inexistente.
- [ ] O endpoint PUT `/api/admin/restaurantes/{id}` atualiza os dados.
- [ ] O endpoint PATCH `/api/admin/restaurantes/{id}/ativar` ativa o restaurante.
- [ ] O endpoint PATCH `/api/admin/restaurantes/{id}/desativar` desativa o restaurante.
- [ ] Nenhuma entity é exposta diretamente na resposta HTTP.
- [ ] Nenhuma funcionalidade fora do escopo foi implementada.
- [ ] Foi informado como testar manualmente (ex: via Swagger ou Postman).

## Prompt para IA

```text
Assuma o papel descrito em agents/backend-senior.md.

Execute a TASK-009-1 - Criar CRUD administrativo de Restaurante.

Leia antes de qualquer implementação:
- docs/02-arquitetura.md
- docs/05-modelagem-banco.md
- docs/08-endpoints.md
- docs/14-decisoes-tecnicas.md
- skills/spring-boot-api.md
- skills/modelagem-banco.md
- tasks/fase-03-modelagem-banco/TASK-009-1-crud-restaurante.md

Instruções:
1. Não implemente nada fora do escopo desta task.
2. Antes de criar qualquer arquivo, explique o plano.
3. Crie as migrations Flyway com a versão correta na sequência.
4. Crie a senha do SUPER_ADMIN já com BCrypt mesmo sem Spring Security ativo.
5. Não exponha a entidade Restaurante diretamente no controller — use DTOs.
6. Toda regra de negócio deve ficar no service.
7. Depois de criar os arquivos, liste todos os arquivos criados ou modificados.
8. Informe como testar via Swagger ou Postman.
9. Informe pendências ou riscos para a próxima task.
```
