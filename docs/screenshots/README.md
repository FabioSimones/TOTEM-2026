# Plano de capturas de tela — Totem Fast Food

Este documento registra o estado real de cada captura de tela do projeto — o que já existe, a origem (automática ou manual), e o que ainda falta.

## Convenções

- Formato: PNG, sem compressão agressiva.
- Nomenclatura: kebab-case, sem acento, sem espaço.
- Sempre dado fictício de demonstração — nunca dado real de restaurante/cliente.
- Nenhum token, e-mail real, código de ativação real ou informação sensível visível (inspecionado manualmente antes de manter cada imagem).
- Tema escuro (`dark`, padrão da aplicação) como referência principal; o tema claro entra como par de comparação onde fizer sentido.

## Inventário completo

| Arquivo | Tela | Tema | Resolução | Origem | Status | Uso recomendado |
|---|---|---|---|---|---|---|
| `dashboard-admin-dark.png` | `/admin` — Dashboard | Escuro | 2491×791 | Captura manual (usuário) | ✅ Aprovada | README (capa) + LinkedIn |
| `admin-restaurantes.png` | `/admin/restaurantes` — lista + modal de edição | Escuro | 2511×793 | Captura manual (usuário) | ✅ Aprovada | Galeria README |
| `admin-dispositivos.png` | `/admin/dispositivos` — 3 cards (Caixa/Cozinha/Totem) | Escuro | 2496×850 | Captura manual (usuário), recortada | ✅ Aprovada* | Documentação interna |
| `admin-categorias.png` | `/admin/categorias` — lista + modal de cadastro vazio | Escuro | 2510×822 | Captura manual (usuário), recortada | ✅ Aprovada | Galeria README |
| `admin-produtos.png` | `/admin/produtos` — 6 cards com imagens reais | Escuro | 2495×837 | Captura manual (usuário), recortada | ✅ Aprovada* | README + LinkedIn |
| `admin-pedidos.png` | `/admin/pedidos` — 5 cards, consulta administrativa | Escuro | 2514×828 | Captura manual (usuário), recortada | ✅ Aprovada | README + LinkedIn |
| `login-dark.png` | `/login` | Escuro | 2880×1800 | Captura automática (script) | ✅ Aprovada | README + LinkedIn |
| `login-light.png` | `/login`, mesmo layout | Claro | 2880×1800 | Captura automática (script) | ✅ Aprovada | Galeria README (comparação de tema) |
| `ativacao-dispositivo.png` | `/ativar-dispositivo` | Claro (herdado) | 2880×1800 | Captura automática (script) | ✅ Aprovada | Documentação interna |

\* **Observação sobre marca-d'água**: `admin-dispositivos.png` e `admin-produtos.png` foram capturadas numa cópia do Windows sem licença ativada, que sobrepõe "Ativar o Windows" no canto inferior direito da tela inteira (overlay do sistema operacional, não da aplicação). Em ambas, esse overlay ocupa **a mesma faixa vertical** de um elemento real da interface (o botão "Regenerar código" do terceiro card em Dispositivos; a linha "Remover destaque" em Produtos) — não existe um recorte que remova 100% da marca-d'água sem cortar esse conteúdo real. Priorizei preservar o conteúdo da aplicação: as duas imagens ficaram com um resíduo pequeno e pouco legível da marca-d'água no canto inferior direito. Recomendo uma nova captura futura numa máquina sem esse aviso para uma versão totalmente limpa dessas duas telas.

**Achado de privacidade avaliado**: `admin-pedidos.png` mostra nomes de cliente ("Fábio", "Jhonathan", "Amanda") em pedidos de demonstração. Um dos nomes coincide com o nome do autor do projeto — confirmado com o usuário que são dados fictícios de teste, aprovado para publicação sem alteração.

## Ainda pendentes — dependem de sessão de dispositivo/operador

Não há, até o momento, um código de ativação de demonstração disponível para gerar uma sessão de Totem, Caixa ou Cozinha:

- `totem-cardapio.png`, `totem-produto-modal.png`, `totem-carrinho.png`, `mobile-totem.png`.
- `caixa-pedidos.png` (painel operacional do Caixa — diferente de `admin-pedidos.png`, que é a consulta administrativa somente leitura).
- `cozinha-fila.png`.
- `mobile-admin.png`, sidebar administrativa recolhida, tema claro numa tela administrativa.
- `github-actions.png` — só com acesso seguro ao workflow, sem abas/perfil pessoal visível; o badge de CI no README já cobre essa necessidade sem captura manual.
- `arquitetura-sistema.png` — opcional, gerada a partir do diagrama Mermaid já existente no README (não é uma captura de tela).

## Como produzir as capturas pendentes automaticamente

```bash
cd frontend

# Telas públicas (sempre funcionam, sem credenciais):
node scripts/capturar-screenshots.mjs

# Telas administrativas — defina as credenciais só na sessão do seu terminal,
# nunca no repositório:
export SCREENSHOT_ADMIN_EMAIL="seu-usuario-admin@..."
export SCREENSHOT_ADMIN_PASSWORD="sua-senha"
node scripts/capturar-screenshots.mjs
```

O script nunca inicia backend/frontend — falha com mensagem clara se não encontrar os serviços já em execução (`SCREENSHOT_BASE_URL`, default `http://localhost:5173`). Totem/Caixa/Cozinha (sessão de dispositivo/operador) ainda não têm suporte no script — precisam de um código de ativação de demonstração.

## Como as capturas são usadas

As imagens aprovadas entram neste diretório; o README raiz referencia as mais representativas na seção "Capturas de tela" e `docs/portfolio/linkedin-project.md` define a sequência para o carrossel do LinkedIn.
