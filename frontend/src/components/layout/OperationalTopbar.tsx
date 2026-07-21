import { ThemeToggle } from "../ui/ThemeToggle";
import { CaixaIcon, CozinhaIcon, DispositivoIcon, TrocarDispositivoIcon, TrocarOperadorIcon } from "./OperationalIcons";
import type { DispositivoAutenticadoResponse, OperadorAutenticadoResponse, PerfilUsuario } from "../../types/auth";
import { rotuloTipoDispositivo } from "../../utils/tipoDispositivo";

const ROTULO_PERFIL: Record<PerfilUsuario, string> = {
  SUPER_ADMIN: "Superadministrador",
  ADMIN_RESTAURANTE: "Administrador do restaurante",
  OPERADOR_CAIXA: "Operador de caixa",
  OPERADOR_COZINHA: "Operador de cozinha",
};

const ICONE_MODULO = {
  Caixa: CaixaIcon,
  Cozinha: CozinhaIcon,
} as const;

interface OperationalTopbarProps {
  modulo: "Caixa" | "Cozinha";
  dispositivo: DispositivoAutenticadoResponse;
  /**
   * TASK-119.2: `null` no intervalo entre "dispositivo pronto" e "operador identificado" — a
   * topbar já monta nesse estado (ver `OperationalLayout`), só omite o bloco de identidade e a
   * ação "Trocar operador" enquanto não há quem exibir/trocar.
   */
  operador: OperadorAutenticadoResponse | null;
  /** Só relevante com `operador` presente — omitido (e o botão correspondente some) quando `null`. */
  onTrocarOperador?: () => void;
  onTrocarDispositivo: () => void;
}

/**
 * TASK-119: topbar compartilhada entre Caixa e Cozinha — reaproveita o vocabulário visual criado
 * na TASK-118 (`AdminTopbar`: avatar textual, ações com `aria-label` explícito + texto ocultável em
 * mobile) sem reaproveitar o componente em si (contexto diferente: dispositivo+operador, não
 * usuário administrativo) e sem a `AdminSidebar`. Mantém sempre visíveis: módulo, dispositivo,
 * operador (quando presente) e as ações de sessão aplicáveis — nunca escondidas atrás de um menu.
 * TASK-119.2: passou a montar também no intervalo "dispositivo pronto, operador ausente" — antes
 * esse estado ainda usava a casca antiga (`AppLayout`/`ModuleHeader`), quebrando a experiência
 * visual logo após ativar o equipamento.
 */
export function OperationalTopbar({
  modulo,
  dispositivo,
  operador,
  onTrocarOperador,
  onTrocarDispositivo,
}: OperationalTopbarProps) {
  const IconeModulo = ICONE_MODULO[modulo];
  const inicial = operador ? operador.nome.trim().charAt(0).toUpperCase() || "?" : "";

  return (
    <header className="operational-topbar">
      <div className="operational-topbar__brand">
        <IconeModulo />
        <div className="operational-topbar__brand-text">
          <span className="operational-topbar__modulo">{modulo}</span>
          <span className="operational-topbar__marca">TotemFood</span>
        </div>
      </div>

      <div className="operational-topbar__dispositivo" title={`${dispositivo.nome} · ${rotuloTipoDispositivo(dispositivo.tipoDispositivo)}`}>
        <DispositivoIcon />
        <span className="operational-topbar__dispositivo-texto">
          <span className="operational-topbar__dispositivo-nome">{dispositivo.nome}</span>
          <span className="operational-topbar__dispositivo-tipo">{rotuloTipoDispositivo(dispositivo.tipoDispositivo)}</span>
        </span>
      </div>

      <div className="operational-topbar__right">
        <ThemeToggle />

        {operador && (
          <div className="operational-topbar__operador">
            <span className="operational-topbar__avatar" aria-hidden="true">
              {inicial}
            </span>
            <span className="operational-topbar__operador-info">
              <span className="operational-topbar__operador-nome">{operador.nome}</span>
              <span className="operational-topbar__operador-perfil">{ROTULO_PERFIL[operador.perfil]}</span>
            </span>
          </div>
        )}

        {operador && onTrocarOperador && (
          <button
            type="button"
            className="operational-topbar__acao"
            onClick={onTrocarOperador}
            aria-label="Trocar operador"
          >
            <TrocarOperadorIcon />
            <span aria-hidden="true">Trocar operador</span>
          </button>
        )}

        <button
          type="button"
          className="operational-topbar__acao"
          onClick={onTrocarDispositivo}
          aria-label="Trocar dispositivo"
        >
          <TrocarDispositivoIcon />
          <span aria-hidden="true">Trocar dispositivo</span>
        </button>
      </div>
    </header>
  );
}
