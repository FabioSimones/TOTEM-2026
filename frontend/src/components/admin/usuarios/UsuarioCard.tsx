import { useRef, useState } from "react";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import type { PerfilUsuario, UsuarioAdminResponse } from "../../../types/usuario";
import { focarPrimeiroErro } from "../../../utils/validacaoFormulario";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { FieldError } from "../../ui/FieldError";

type CampoSenha = "novaSenha" | "confirmarSenha";
const ORDEM_CAMPOS_SENHA: readonly CampoSenha[] = ["novaSenha", "confirmarSenha"];

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
  const [errosSenha, setErrosSenha] = useState<Partial<Record<CampoSenha, string>>>({});

  const novaSenhaRef = useRef<HTMLInputElement>(null);
  const confirmarSenhaRef = useRef<HTMLInputElement>(null);

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
    setErrosSenha({});
    setAlterandoSenha(true);
  }

  function handleCancelarAlterarSenha() {
    setNovaSenha("");
    setConfirmarSenha("");
    setErrosSenha({});
    setAlterandoSenha(false);
  }

  function validarSenha(novaSenhaAtual: string, confirmarSenhaAtual: string): Partial<Record<CampoSenha, string>> {
    const proximosErros: Partial<Record<CampoSenha, string>> = {};

    if (!novaSenhaAtual.trim()) {
      proximosErros.novaSenha = "Informe a nova senha.";
    } else if (novaSenhaAtual.length < 8 || novaSenhaAtual.length > 100) {
      proximosErros.novaSenha = "A nova senha deve ter entre 8 e 100 caracteres.";
    }

    if (!proximosErros.novaSenha && confirmarSenhaAtual !== novaSenhaAtual) {
      proximosErros.confirmarSenha = "As senhas não coincidem.";
    }

    return proximosErros;
  }

  function revalidarSenhaSeNecessario(campo: CampoSenha, novaSenhaAtual: string, confirmarSenhaAtual: string) {
    if (!errosSenha[campo]) {
      return;
    }
    const proximosErros = validarSenha(novaSenhaAtual, confirmarSenhaAtual);
    setErrosSenha((atual) => ({ ...atual, [campo]: proximosErros[campo] }));
  }

  function handleConfirmarAlterarSenha() {
    const proximosErros = validarSenha(novaSenha, confirmarSenha);
    setErrosSenha(proximosErros);

    if (Object.keys(proximosErros).length > 0) {
      focarPrimeiroErro(ORDEM_CAMPOS_SENHA, proximosErros, {
        novaSenha: novaSenhaRef,
        confirmarSenha: confirmarSenhaRef,
      });
      return;
    }

    if (!window.confirm(`Alterar a senha do usuário ${usuario.nome}?`)) {
      return;
    }

    onAlterarSenha(usuario.id, novaSenha);
    setNovaSenha("");
    setConfirmarSenha("");
    setErrosSenha({});
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

      {/* TASK-119.1: bloco de dados próprio, não a `dl.pedido-pendente-card__detalhes` compartilhada
          com Caixa/Cozinha — aquela grid de 2-3 colunas (`auto-fit, minmax(8rem, 1fr)`) foi
          desenhada para valores curtos ("Criado em", "Tipo de consumo") e sem `min-width: 0`/
          `overflow-wrap`, então um e-mail ou perfil longo extrapolava a coluna e sobrepunha a
          vizinha. Aqui cada campo ocupa sua própria linha, largura cheia. */}
      <dl className="usuario-card__detalhes">
        <div className="usuario-card__campo">
          <dt className="usuario-card__rotulo">E-mail</dt>
          <dd className="usuario-card__valor">{usuario.email}</dd>
        </div>
        <div className="usuario-card__campo">
          <dt className="usuario-card__rotulo">Perfil</dt>
          <dd className="usuario-card__valor">{ROTULO_PERFIL[usuario.perfil]}</dd>
        </div>
        <div className="usuario-card__campo">
          <dt className="usuario-card__rotulo">Restaurante</dt>
          <dd className="usuario-card__valor">{nomeRestaurante ?? "—"}</dd>
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
          <Button type="button" variant="secondary" loading={executando} onClick={handleDesativar}>
            Desativar
          </Button>
        ) : (
          <Button type="button" variant="secondary" loading={executando} onClick={handleAtivar}>
            Ativar
          </Button>
        )}

        {!alterandoSenha && (
          <Button type="button" variant="secondary" disabled={executando} onClick={handleAbrirAlterarSenha}>
            Alterar senha
          </Button>
        )}
      </div>

      {alterandoSenha && (
        <div className="pedido-pendente-card__cancelamento">
          <label className="pedido-pendente-card__observacao" htmlFor={`novaSenha-${usuario.id}`}>
            Nova senha
            <input
              id={`novaSenha-${usuario.id}`}
              ref={novaSenhaRef}
              type="password"
              value={novaSenha}
              onChange={(event) => {
                setNovaSenha(event.target.value);
                revalidarSenhaSeNecessario("novaSenha", event.target.value, confirmarSenha);
              }}
              placeholder="Mínimo 8 caracteres"
              disabled={executando}
              autoComplete="new-password"
              aria-invalid={Boolean(errosSenha.novaSenha)}
              aria-describedby={errosSenha.novaSenha ? `novaSenha-${usuario.id}-error` : undefined}
            />
          </label>
          <FieldError id={`novaSenha-${usuario.id}-error`} message={errosSenha.novaSenha} />

          <label className="pedido-pendente-card__observacao" htmlFor={`confirmarSenha-${usuario.id}`}>
            Confirmar nova senha
            <input
              id={`confirmarSenha-${usuario.id}`}
              ref={confirmarSenhaRef}
              type="password"
              value={confirmarSenha}
              onChange={(event) => {
                setConfirmarSenha(event.target.value);
                revalidarSenhaSeNecessario("confirmarSenha", novaSenha, event.target.value);
              }}
              placeholder="Repita a nova senha"
              disabled={executando}
              autoComplete="new-password"
              aria-invalid={Boolean(errosSenha.confirmarSenha)}
              aria-describedby={errosSenha.confirmarSenha ? `confirmarSenha-${usuario.id}-error` : undefined}
            />
          </label>
          <FieldError id={`confirmarSenha-${usuario.id}-error`} message={errosSenha.confirmarSenha} />

          <Button type="button" loading={executando} onClick={handleConfirmarAlterarSenha}>
            Confirmar nova senha
          </Button>

          <Button type="button" variant="secondary" disabled={executando} onClick={handleCancelarAlterarSenha}>
            Cancelar
          </Button>
        </div>
      )}
    </article>
  );
}
