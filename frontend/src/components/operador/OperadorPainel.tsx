import { useState, type FormEvent } from "react";
import { loginOperador } from "../../services/authService";
import { saveOperadorSession } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { OperadorLoginResponse } from "../../types/auth";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Input } from "../ui/Input";

interface OperadorPainelProps {
  /** TASK-119.2: título da tela (`<h1>` — único título renderizado nesse estado da página). */
  titulo: string;
  /** Explicação curta abaixo do título. Opcional, mas usado pelas duas páginas que consomem isto. */
  descricao?: string;
  onIdentificado: (response: OperadorLoginResponse) => void;
}

/**
 * Identificação de operador humano dentro de um dispositivo CAIXA/COZINHA já ativo (TASK-092).
 * Desde a TASK-111, Caixa/Cozinha só renderizam o formulário (sem o restante do conteúdo) enquanto
 * não houver operador identificado — a ação de login é obrigatória para ver dados operacionais,
 * não apenas para fins de auditoria. TASK-119: a exibição do operador já identificado (nome,
 * perfil, "Trocar operador") passou para `OperationalTopbar`. TASK-119.2: este componente passou a
 * ser o próprio conteúdo central do `OperationalLayout` nesse estado (título + card + formulário,
 * classes `.operational-login*`) — a topbar já está montada ao redor dele, então não repete
 * "Trocar dispositivo" (removido daqui; é responsabilidade exclusiva da topbar agora).
 */
export function OperadorPainel({ titulo, descricao, onIdentificado }: OperadorPainelProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !senha) {
      setErro("Informe email e senha.");
      return;
    }

    setErro(null);
    setLoading(true);
    try {
      const response = await loginOperador(email.trim(), senha);
      saveOperadorSession(response);
      setEmail("");
      setSenha("");
      onIdentificado(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setErro("Email ou senha inválidos.");
      } else if (error instanceof ApiError && error.status === 403) {
        setErro(error.message || "Este usuário não pode operar este terminal.");
      } else {
        setErro(
          error instanceof ApiError ? error.message : "Não foi possível identificar o operador. Tente novamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="operational-login">
      <div className="operational-login__card">
        <h1 className="operational-login__titulo">{titulo}</h1>
        {descricao && <p className="operational-login__descricao">{descricao}</p>}

        <form onSubmit={(event) => void handleSubmit(event)} className="operational-login__form">
          <Input
            id="operadorEmail"
            label="Email do operador"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="operador@restaurante.com"
            disabled={loading}
            autoComplete="username"
            autoFocus
          />
          <Input
            id="operadorSenha"
            label="Senha"
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
          <ErrorMessage message={erro} />
          <Button type="submit" loading={loading} fullWidth>
            Identificar operador
          </Button>
        </form>
      </div>
    </div>
  );
}
