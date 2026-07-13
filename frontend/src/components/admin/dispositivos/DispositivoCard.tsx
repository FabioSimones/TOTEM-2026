import { useState } from "react";
import type { DispositivoAdminResponse } from "../../../types/dispositivo";
import { formatarDataHora } from "../../../utils/dateTime";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";

interface DispositivoCardProps {
  dispositivo: DispositivoAdminResponse;
  executando: boolean;
  erro: string | null;
  onEditar: (dispositivo: DispositivoAdminResponse) => void;
  onRevogar: (id: number) => void;
  onReativar: (id: number) => void;
  onRegenerarCodigo: (id: number) => void;
}

const ROTULO_TIPO: Record<DispositivoAdminResponse["tipoDispositivo"], string> = {
  TOTEM: "Totem",
  CAIXA: "Caixa",
  COZINHA: "Cozinha",
  ADMINISTRACAO: "Administração",
};

const ROTULO_STATUS_OPERACIONAL: Record<DispositivoAdminResponse["statusOperacional"], string> = {
  USADO_RECENTEMENTE: "Usado recentemente",
  ATIVO: "Ativo",
  NUNCA_USADO: "Nunca usado",
  REVOGADO: "Revogado",
};

const MODIFICADOR_STATUS_OPERACIONAL: Record<DispositivoAdminResponse["statusOperacional"], string> = {
  USADO_RECENTEMENTE: "dispositivo-card__status--usado-recentemente",
  ATIVO: "dispositivo-card__status--ativo",
  NUNCA_USADO: "dispositivo-card__status--nunca-usado",
  REVOGADO: "dispositivo-card__status--revogado",
};

export function DispositivoCard({ dispositivo, executando, erro, onEditar, onRevogar, onReativar, onRegenerarCodigo }: DispositivoCardProps) {
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState<string | null>(null);

  async function handleCopiar() {
    if (!dispositivo.codigoAtivacao) {
      return;
    }
    setErroCopia(null);
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard indisponível");
      }
      await navigator.clipboard.writeText(dispositivo.codigoAtivacao);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErroCopia("Não foi possível copiar automaticamente. Selecione o código acima e copie manualmente.");
    }
  }

  function handleClicarAcao() {
    if (dispositivo.ativo) {
      if (!window.confirm(`Revogar o dispositivo ${dispositivo.nome}? Ele deixará de conseguir autenticar.`)) {
        return;
      }
      onRevogar(dispositivo.id);
    } else {
      if (!window.confirm(`Reativar o dispositivo ${dispositivo.nome}?`)) {
        return;
      }
      onReativar(dispositivo.id);
    }
  }

  function handleRegenerarCodigo() {
    if (!window.confirm(
      `Regenerar o código de ${dispositivo.nome}? As renovações anteriores serão revogadas.`,
    )) {
      return;
    }
    onRegenerarCodigo(dispositivo.id);
  }

  return (
    <article className="pedido-pendente-card">
      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">{dispositivo.nome}</h3>
        <span className={"dispositivo-card__status " + MODIFICADOR_STATUS_OPERACIONAL[dispositivo.statusOperacional]}>
          {ROTULO_STATUS_OPERACIONAL[dispositivo.statusOperacional]}
        </span>
      </div>

      <dl className="pedido-pendente-card__detalhes">
        <div>
          <dt>Tipo</dt>
          <dd>{ROTULO_TIPO[dispositivo.tipoDispositivo]}</dd>
        </div>
        <div>
          <dt>Código de identificação</dt>
          <dd>{dispositivo.codigoIdentificacao}</dd>
        </div>
        <div>
          <dt>Restaurante</dt>
          <dd>{dispositivo.restauranteId}</dd>
        </div>
        <div>
          <dt>Ativado pelo dispositivo</dt>
          <dd>{dispositivo.ativado ? "Sim" : "Não"}</dd>
        </div>
        {dispositivo.ativadoEm && (
          <div>
            <dt>Ativado em</dt>
            <dd>{formatarDataHora(dispositivo.ativadoEm)}</dd>
          </div>
        )}
        <div>
          <dt>Último acesso</dt>
          <dd>{dispositivo.ultimoAcesso ? formatarDataHora(dispositivo.ultimoAcesso) : "Nunca acessou"}</dd>
        </div>
        <div>
          <dt>Criado em</dt>
          <dd>{formatarDataHora(dispositivo.criadoEm)}</dd>
        </div>
      </dl>

      {dispositivo.codigoAtivacao && (
        <div className="dispositivo-card__codigo-ativacao">
          <span className="dispositivo-card__codigo-ativacao-rotulo">Código de ativação</span>
          <code className="dispositivo-card__codigo-ativacao-valor">{dispositivo.codigoAtivacao}</code>
          <button type="button" className="dispositivo-card__copiar" onClick={() => void handleCopiar()}>
            {copiado ? "Copiado!" : "Copiar"}
          </button>
        </div>
      )}
      <ErrorMessage message={erroCopia} />

      <ErrorMessage message={erro} />

      <div className="dispositivo-form__acoes">
        <Button
          type="button"
          className="pedido-pendente-card__acao"
          onClick={() => onEditar(dispositivo)}
          disabled={executando}
        >
          Editar
        </Button>

        <button
          type="button"
          className="restaurante-card__acao-secundaria"
          disabled={executando}
          onClick={handleClicarAcao}
        >
          {executando ? "Aguarde..." : dispositivo.ativo ? "Revogar" : "Reativar"}
        </button>

        <button
          type="button"
          className="restaurante-card__acao-secundaria"
          disabled={executando}
          onClick={handleRegenerarCodigo}
        >
          Regenerar código
        </button>
      </div>
    </article>
  );
}
