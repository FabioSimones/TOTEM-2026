import { useState } from "react";
import type { DispositivoAdminResponse } from "../../../types/dispositivo";
import { formatDateTimeBRL } from "../../../utils/formatters";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";

interface DispositivoCardProps {
  dispositivo: DispositivoAdminResponse;
  executando: boolean;
  erro: string | null;
  onRevogar: (id: number) => void;
  onReativar: (id: number) => void;
}

const ROTULO_TIPO: Record<DispositivoAdminResponse["tipoDispositivo"], string> = {
  TOTEM: "Totem",
  CAIXA: "Caixa",
  COZINHA: "Cozinha",
  ADMINISTRACAO: "Administração",
};

export function DispositivoCard({ dispositivo, executando, erro, onRevogar, onReativar }: DispositivoCardProps) {
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState<string | null>(null);

  async function handleCopiar() {
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

  return (
    <article className="pedido-pendente-card">
      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">{dispositivo.nome}</h3>
        <span
          className={
            "dispositivo-card__status" +
            (dispositivo.ativo ? " dispositivo-card__status--ativo" : " dispositivo-card__status--revogado")
          }
        >
          {dispositivo.ativo ? "Ativo" : "Revogado"}
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
            <dd>{formatDateTimeBRL(dispositivo.ativadoEm)}</dd>
          </div>
        )}
        {dispositivo.ultimoAcesso && (
          <div>
            <dt>Último acesso</dt>
            <dd>{formatDateTimeBRL(dispositivo.ultimoAcesso)}</dd>
          </div>
        )}
        <div>
          <dt>Criado em</dt>
          <dd>{formatDateTimeBRL(dispositivo.criadoEm)}</dd>
        </div>
      </dl>

      <div className="dispositivo-card__codigo-ativacao">
        <span className="dispositivo-card__codigo-ativacao-rotulo">Código de ativação</span>
        <code className="dispositivo-card__codigo-ativacao-valor">{dispositivo.codigoAtivacao}</code>
        <button type="button" className="dispositivo-card__copiar" onClick={() => void handleCopiar()}>
          {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <ErrorMessage message={erroCopia} />

      <ErrorMessage message={erro} />

      <Button type="button" className="pedido-pendente-card__acao" loading={executando} onClick={handleClicarAcao}>
        {dispositivo.ativo ? "Revogar" : "Reativar"}
      </Button>
    </article>
  );
}
