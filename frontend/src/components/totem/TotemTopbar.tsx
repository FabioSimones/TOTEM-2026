import type { RefObject } from "react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { TotemCartIcon, TotemClearIcon, TotemMenuIcon, TotemSearchIcon } from "./TotemIcons";

interface TotemTopbarProps {
  titulo: string;
  descricao?: string | null;
  busca: string;
  onChangeBusca: (valor: string) => void;
  totalItensCarrinho: number;
  onAbrirCarrinho: () => void;
  onOpenMobileMenu: () => void;
  mobileMenuOpen: boolean;
  navId: string;
  hamburguerRef: RefObject<HTMLButtonElement | null>;
}

/**
 * TASK-120: cabeçalho da tela de autoatendimento — título contextual da categoria/busca, busca de
 * produto, alternância de tema (reaproveita `ThemeToggle` sem duplicar lógica) e o botão do
 * carrinho com contador real de itens.
 */
export function TotemTopbar({
  titulo,
  descricao,
  busca,
  onChangeBusca,
  totalItensCarrinho,
  onAbrirCarrinho,
  onOpenMobileMenu,
  mobileMenuOpen,
  navId,
  hamburguerRef,
}: TotemTopbarProps) {
  const temItensNoCarrinho = totalItensCarrinho > 0;
  const rotuloCarrinho = temItensNoCarrinho
    ? `Abrir carrinho, ${totalItensCarrinho} ${totalItensCarrinho === 1 ? "item" : "itens"}`
    : "Abrir carrinho";

  return (
    <header className="totem-topbar">
      <div className="totem-topbar__esquerda">
        <button
          ref={hamburguerRef}
          type="button"
          className="totem-topbar__menu-botao"
          onClick={onOpenMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls={navId}
          aria-label={mobileMenuOpen ? "Fechar menu de categorias" : "Abrir menu de categorias"}
        >
          <TotemMenuIcon />
        </button>

        <div className="totem-topbar__titulos">
          <h1>{titulo}</h1>
          {descricao && <p className="totem-topbar__descricao">{descricao}</p>}
        </div>
      </div>

      <div className="totem-topbar__direita">
        <div className="totem-busca">
          <TotemSearchIcon className="totem-busca__icone" />
          <input
            type="search"
            className="totem-busca__input"
            placeholder="Buscar produto..."
            aria-label="Buscar produto"
            value={busca}
            onChange={(event) => onChangeBusca(event.target.value)}
          />
          {busca !== "" && (
            <button
              type="button"
              className="totem-busca__limpar"
              aria-label="Limpar busca"
              onClick={() => onChangeBusca("")}
            >
              <TotemClearIcon />
            </button>
          )}
        </div>

        <ThemeToggle />

        <button
          type="button"
          className="totem-topbar__carrinho"
          onClick={onAbrirCarrinho}
          aria-label={rotuloCarrinho}
          aria-haspopup="dialog"
        >
          <TotemCartIcon />
          {temItensNoCarrinho && (
            <span className="totem-topbar__carrinho-badge" aria-hidden="true">
              {totalItensCarrinho}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
