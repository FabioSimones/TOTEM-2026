import { useState } from "react";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import type { PerfilUsuario, UsuarioAdminResponse } from "../../../types/usuario";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";

const ROTULO_PERFIL: Record<PerfilUsuario, string> = {
  SUPER_ADMIN: "Super administrador",
  ADMIN_RESTAURANTE: "Administrador do restaurante",
  OPERADOR_CAIXA: "Operador de caixa",
  OPERADOR_COZINHA: "Operador de cozinha",
};

interface UsuarioCardProps {
  usuario: UsuarioAdminResponse;
  restaurantes: RestauranteAdminResponse[];
  executando: boolean;
  erro: string | null;
  onEditar: (usuario: UsuarioAdminResponse) => void;
  onAtivar: (id: number) => void;
  onDesativar: (id: number) => void;
  onAlterarSenha: (id: number, novaSenha: string) => void;
}

export function UsuarioCard({
  usuario,
  restaurantes,
  executando,
  erro,
  onEditar,
  onAtivar,
  onDesativar,
  onAlterarSenha,
}: UsuarioCardProps) {
  const nomeRestaurante =
    usuario.restauranteId != null
      ? restaurantes.find((r) => r.id === usuario.restauranteId)?.nome ?? `#${usuario.restauranteId}`
      : null;

  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroValidacaoSenha, setErroValidacaoSenha] = useState<string | null>(null);

  function handleAtivar() {
    if (!window.confirm(`Ativar o usuário ${usuario.nome}?`)) {
      return;
    }
    onAtivar(usuario.id);
  }

  function handleDesativar() {
    if (!window.confirm(`Desativar o usuário ${usuario.nome}?`)) {
      return;
    }
    onDesativar(usuario.id);
  }

  function handleAbrirAlterarSenha() {
    setNovaSenha("");
    setConfirmarSenha("");
    setErroValidacaoSenha(null);
    setAlterandoSenha(true);
  }

  function handleCancelarAlterarSenha() {
    setNovaSenha("");
    setConfirmarSenha("");
    setErroValidacaoSenha(null);
    setAlterandoSenha(false);
  }

  function handleConfirmarAlterarSenha() {
    if (novaSenha.trim().length < 8) {
      setErroValidacaoSenha("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroValidacaoSenha("As senhas não coincidem.");
      return;
    }
    if (!window.confirm(`Alterar a senha do usuário ${usuario.nome}?`)) {
      return;
    }

    setErroValidacaoSenha(null);
    onAlterarSenha(usuario.id, novaSenha);
    setNovaSenha("");
    setConfirmarSenha("");
    setAlterandoSenha(false);
  }

  return (
    <article className="pedido-pendente-card">
      <div className="pedido-pendente-card__cabecalho">
        <h3 className="pedido-pendente-card__numero">{usuario.nome}</h3>
        <span
          className={
            "dispositivo-card__status" +
            (usuario.ativo ? " dispositivo-card__status--ativo" : " dispositivo-card__status--revogado")
          }
        >
          {usuario.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>

      <dl className="pedido-pendente-card__detalhes">
        <div>
          <dt>Email</dt>
          <dd>{usuario.email}</dd>
        </div>
        <div>
          <dt>Perfil</dt>
          <dd>{ROTULO_PERFIL[usuario.perfil]}</dd>
        </div>
        <div>
          <dt>Restaurante</dt>
          <dd>{nomeRestaurante ?? "—"}</dd>
        </div>
      </dl>

      <ErrorMessage message={erro} />

      <div className="dispositivo-form__acoes">
        <Button
          type="button"
          className="pedido-pendente-card__acao"
          onClick={() => onEditar(usuario)}
          disabled={executando}
        >
          Editar
        </Button>

        {usuario.ativo ? (
          <button
            type="button"
            className="restaurante-card__acao-secundaria"
            disabled={executando}
            onClick={handleDesativar}
          >
            {executando ? "Aguarde..." : "Desativar"}
          </button>
        ) : (
          <button
            type="button"
            className="restaurante-card__acao-secundaria"
            disabled={executando}
            onClick={handleAtivar}
          >
            {executando ? "Aguarde..." : "Ativar"}
          </button>
        )}

        {!alterandoSenha && (
          <button
            type="button"
            className="restaurante-card__acao-secundaria"
            disabled={executando}
            onClick={handleAbrirAlterarSenha}
          >
            Alterar senha
          </button>
        )}
      </div>

      {alterandoSenha && (
        <div className="pedido-pendente-card__cancelamento">
          <label className="pedido-pendente-card__observacao">
            Nova senha
            <input
              type="password"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              disabled={executando}
              autoComplete="new-password"
            />
          </label>

          <label className="pedido-pendente-card__observacao">
            Confirmar nova senha
            <input
              type="password"
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              placeholder="Repita a nova senha"
              disabled={executando}
              autoComplete="new-password"
            />
          </label>

          <ErrorMessage message={erroValidacaoSenha} />

          <button
            type="button"
            className="pedido-pendente-card__cancelar"
            disabled={executando}
            onClick={handleConfirmarAlterarSenha}
          >
            {executando ? "Aguarde..." : "Confirmar nova senha"}
          </button>

          <button
            type="button"
            className="pedido-pendente-card__cancelar"
            disabled={executando}
            onClick={handleCancelarAlterarSenha}
          >
            Cancelar
          </button>
        </div>
      )}
    </article>
  );
}
