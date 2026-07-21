# Material de portfólio — LinkedIn

Rascunho de divulgação do projeto Totem Fast Food. Revisar antes de publicar — nada aqui deve ser postado sem leitura humana prévia.

## 1. Resumo de uma linha

Sistema full stack de autoatendimento e operação para fast food (Totem, Caixa, Cozinha e Painel Administrativo), construído com Java/Spring Boot e React/TypeScript, usando IA como copiloto de engenharia sob supervisão humana constante.

## 2. Descrição curta (seção "Projetos" do LinkedIn)

Sistema de autoatendimento para restaurantes fast food: o cliente monta e paga o próprio pedido em um totem, enquanto Caixa, Cozinha e um Painel Administrativo operam o fluxo completo (pagamento, preparo, retirada, cardápio, dispositivos e usuários) em tempo real. Backend em Java 21 + Spring Boot com PostgreSQL, autenticação JWT com três camadas de sessão (usuário, dispositivo e operador) e auditoria completa. Frontend em React 19 + TypeScript, com Design System próprio (temas claro/escuro) e cobertura de testes automatizados (unitários e end-to-end, incluindo cenários contra o backend real). Desenvolvido com apoio de IA através de um processo estruturado de tasks, agentes especializados e revisão contínua — não geração automática sem supervisão.

## 3. Publicação completa (post do LinkedIn)

Nas últimas semanas, desenvolvi um sistema completo de autoatendimento para fast food — o tipo de problema que qualquer pessoa que já esperou numa fila de caixa reconhece na hora.

O sistema tem quatro frentes trabalhando sobre o mesmo backend:

- **Totem**: o cliente monta o próprio pedido, escolhe forma de pagamento e acompanha o status, sem depender de um atendente.
- **Caixa**: confirma pagamentos em dinheiro, envia pedidos pagos para a cozinha e controla a retirada.
- **Cozinha**: recebe só o que já foi pago, organiza a fila de preparo e avança o status.
- **Painel Administrativo**: gestão de restaurantes, cardápio, dispositivos, usuários e um dashboard operacional.

Tecnicamente, os pontos que mais me exigiram foram:

- Modelar autenticação para três tipos de sessão coexistindo (usuário administrativo, dispositivo físico ativado e operador humano identificado dentro do dispositivo) sem deixar nenhuma vazar para a outra.
- Garantir que toda ação sensível (pagamento, avanço de status, cancelamento) fica auditada com "quem" (operador) e "onde" (dispositivo) — não só "quando".
- Construir um Design System próprio (React + CSS, sem framework de UI) com temas claro/escuro, acessibilidade (contraste, foco visível, `prefers-reduced-motion`, alvos de toque) e responsividade validados por teste automatizado, não só "visualmente parece certo".
- Diagnosticar falhas reais de CI/CD (GitHub Actions) direto do log do pipeline, separando bug de produção de teste desatualizado — sem adivinhar pela imagem do erro.

Sobre o uso de IA: usei Claude Code como ferramenta de apoio, não como "gerador do sistema". O processo foi deliberadamente fatiado em tasks pequenas e validáveis, cada uma com um papel definido (agente de backend, de frontend, de segurança, de QA) e um escopo explícito — a IA implementa, mas cada mudança passou por revisão, execução real de testes e validação minha antes de seguir para a próxima etapa. Decisões de arquitetura, modelagem de dados, prioridades de segurança e o que entra ou não no MVP foram sempre minhas.

O resultado: um MVP funcional, com suíte de testes automatizados cobrindo backend e frontend (incluindo testes end-to-end contra um backend real, não só mocks) e um pipeline de integração contínua rodando a cada push.

Repositório público: [link do GitHub]

## 4. Versão curta da publicação

Construí um sistema full stack de autoatendimento para fast food (Totem, Caixa, Cozinha e Admin) em Java/Spring Boot + React/TypeScript, com autenticação em três camadas (usuário, dispositivo, operador), auditoria completa e testes automatizados de ponta a ponta. Usei IA como copiloto de engenharia — desenvolvimento fatiado em tasks pequenas, com revisão e validação humana em cada etapa. Repositório público: [link do GitHub]

## 5. Desafios técnicos

- Separar fisicamente três namespaces de sessão (`localStorage` de usuário, dispositivo e operador) para que ativar um novo dispositivo nunca apague por acidente a sessão administrativa do mesmo navegador, e vice-versa.
- Fazer o `JWT_SECRET`/`CORS_ALLOWED_ORIGINS` falharem o startup da aplicação (fail-fast) em vez de caírem silenciosamente num valor de desenvolvimento inseguro — um risco real encontrado e corrigido durante o próprio desenvolvimento.
- Corrigir um bug estrutural de CSS (sidebar cuja área visual "terminava" antes do fim de páginas longas) causado por um único elemento acumular três responsabilidades de layout ao mesmo tempo — só reproduzido com conteúdo real, não em telas curtas de teste manual.
- Diagnosticar, a partir do log real de um pipeline do GitHub Actions, que sete falhas de teste eram testes desatualizados (não bugs de produção) — e corrigir só o que precisava, sem enfraquecer nenhuma verificação.

## 6. Aprendizados

- Um processo estruturado (tasks pequenas, escopo explícito, diagnóstico antes de implementar) rende mais com IA do que pedir "construa o sistema inteiro" — o ganho real está em manter o controle humano sobre arquitetura e prioridade, delegando execução.
- Testar geometria/layout real (altura, sticky, overflow) em cenários de conteúdo longo revela bugs que nunca aparecem em uma tela de demonstração curta.
- Auditoria e segurança compensam ser tratadas como requisito desde o início (três camadas de sessão, fail-fast de configuração) — retrofitar isso depois é sempre mais caro.

## 7. Uso responsável de IA

A IA foi usada como ferramenta de apoio à engenharia, não como autora do produto. Cada tarefa seguiu um padrão: diagnóstico e investigação do código existente antes de qualquer alteração, escopo explícito do que podia e não podia ser tocado, implementação, execução real de testes (não simulada), e revisão do resultado antes de prosseguir. Decisões de produto, arquitetura, modelagem de dados, prioridade de segurança e critérios de aceite foram sempre humanos. A IA não teve acesso a ambientes de produção, não gerou credenciais, e todo código gerado foi lido e validado antes de ser aceito.

## 8. Tecnologias

Java 21 · Spring Boot 3.3.5 · Spring Security · JWT · PostgreSQL · Flyway · Maven · springdoc-openapi (Swagger) · Spring Boot Actuator · Testcontainers · React 19 · TypeScript · Vite · React Router · Vitest · Testing Library · Playwright · oxlint · GitHub Actions.

## 9. Sequência recomendada de imagens

**Status atual (TASK-124.2)**: 9 imagens disponíveis em `docs/screenshots/` — Dashboard, Restaurantes, Dispositivos, Categorias, Produtos, Pedidos (Admin), Login (dark/light) e Ativação de dispositivo. **Ainda faltam Totem, carrinho, Caixa e Cozinha** (dependem de uma sessão de dispositivo/operador, sem credenciais de demonstração disponíveis até agora — ver `docs/screenshots/README.md`). **Não publicar o post ainda** — a sequência abaixo mistura imagens já prontas (1, 5, 6) com imagens que ainda precisam ser produzidas (2, 3, 4); complete o carrossel antes de publicar, ou publique uma versão reduzida só com o painel administrativo se a prioridade for divulgar agora.

1. **`dashboard-admin-dark.png`** — capa. Painel administrativo centralizando indicadores e acesso aos módulos do restaurante. *Demonstra*: React, Design System, RBAC, layout administrativo, experiência responsiva.
2. *(pendente)* Tela inicial do Totem (cardápio, tema escuro) — primeira impressão do produto do ponto de vista do cliente.
3. *(pendente)* Modal de seleção de produto + carrinho — mostra a interação principal do cliente.
4. *(pendente)* Painel do Caixa/Cozinha — contexto operacional, fecha o ciclo do pedido.
5. **`admin-produtos.png`** — cardápio administrativo com imagens reais, preços e destaque. *Demonstra*: upload de imagem, gestão de catálogo, cards responsivos.
6. **`admin-pedidos.png`** — consulta administrativa de pedidos por status. *Demonstra*: rastreabilidade do fluxo operacional, filtros, paginação.
7. **`login-dark.png`** — acesso centralizado com painel institucional. *Demonstra*: autenticação, identidade visual da marca.
8. (Opcional) Diagrama de arquitetura do README, como imagem de fechamento técnico. *Demonstra*: modelo de 3 sessões, arquitetura REST.

## 10. Texto sugerido para cada imagem

1. "Painel administrativo centralizando indicadores e acesso aos módulos do restaurante."
2. "Tela inicial do Totem — o cliente escolhe categoria e monta o pedido sem depender de um atendente." *(pendente)*
3. "Seleção de produto e revisão do carrinho antes da confirmação do pedido." *(pendente)*
4. "Painel do Caixa — pagamentos em dinheiro confirmados manualmente, pedidos pagos seguem direto para a cozinha." *(pendente)*
5. "Cardápio administrativo com imagens, preços e destaque de cada produto."
6. "Consulta administrativa de pedidos, com status e valores rastreados de ponta a ponta."
7. "Acesso centralizado para administradores e operadores, com identidade visual própria."
8. "Arquitetura: quatro interfaces sobre uma única API REST, com PostgreSQL e autenticação em três camadas."

## 11. Hashtags moderadas

`#java` `#springboot` `#react` `#typescript` `#fullstack` `#desenvolvimentodesoftware`

(Evitar excesso de hashtags — 5 a 6 é suficiente; nada de tags genéricas de engajamento tipo #tech #inovacao #ia sem relação direta com o conteúdo técnico.)

## 12. Checklist antes de publicar

- [ ] Substituir `[link do GitHub]` pela URL real do repositório.
- [ ] Substituir `[ADICIONAR URL DO LINKEDIN]` (abaixo) pelo link do perfil, se for referenciá-lo em algum lugar do post.
- [ ] Confirmar que as imagens escolhidas não expõem token, e-mail real, URL interna ou qualquer dado sensível.
- [ ] Reler o post em voz alta — checar tom (profissional, sem exagero, sem prometer o que o projeto não entrega).
- [ ] Confirmar que nenhuma frase implica que a IA "fez o projeto sozinha" — o texto deve deixar claras as decisões e validações humanas.
- [ ] Conferir se o repositório está com o README atualizado antes do post ir ao ar (a primeira impressão de quem clicar é o README).
- [ ] Revisar ortografia e pontuação em português.

---

**Perfil do LinkedIn**: [ADICIONAR URL DO LINKEDIN]
