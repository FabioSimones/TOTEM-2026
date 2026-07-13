import { useState, type FormEvent } from "react";
import { loginOperador } from "../../services/authService";
import { clearOperadorSession, saveOperadorSession } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { OperadorAutenticadoResponse, OperadorLoginResponse } from "../../types/auth";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Input } from "../ui/Input";

interface OperadorPainelProps {
  operador: OperadorAutenticadoResponse | null;
  onIdentificado: (response: OperadorLoginResponse) => void;
  onTrocar: () => void;
}

/**
 * Identificação de operador humano dentro de um dispositivo CAIXA/COZINHA já ativo (TASK-092) —
 * puramente aditivo: a tela continua funcionando normalmente sem operador identificado (aviso
 * abaixo), só passa a registrar quem agiu quando alguém se identifica.
 */
export function OperadorPainel({ operador, onIdentificado, onTrocar }: OperadorPainelProps) {
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

  function handleTrocar() {
    clearOperadorSession();
    onTrocar();
  }

  if (operador) {
    return (
      <div className="operador-painel">
        <span className="operador-painel__nome">Operador: {operador.nome}</span>
        <button type="button" className="operador-painel__trocar" onClick={handleTrocar}>
          Trocar operador
        </button>
      </div>
    );
  }

  return (
    <div className="operador-painel operador-painel--identificacao">
      <p className="totem-estado">
        Operador não identificado. As ações serão registradas apenas pelo dispositivo.
      </p>
      <form onSubmit={(event) => void handleSubmit(event)} className="operador-painel__form">
        <Input
          id="operadorEmail"
          label="Email do operador"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="operador@restaurante.com"
          disabled={loading}
          autoComplete="username"
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
        <Button type="submit" loading={loading}>
          Identificar operador
        </Button>
      </form>
    </div>
  );
}
