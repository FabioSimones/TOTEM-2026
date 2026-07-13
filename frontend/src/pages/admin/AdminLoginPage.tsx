import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { login } from "../../services/authService";
import { saveUserSession } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    const emailInformado = email.trim();
    if (!emailInformado || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email: emailInformado, senha });
      saveUserSession(response);
      navigate("/admin", { replace: true });
    } catch (error) {
      setErro(
        error instanceof ApiError
          ? error.message
          : "Não foi possível entrar. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout
      title="Login Administrativo"
      description="Autenticação de usuários humanos (SUPER_ADMIN, ADMIN_RESTAURANTE, operadores) para acessar o painel administrativo."
    >
      <form onSubmit={handleSubmit} className="admin-login-form">
        <Input
          id="email"
          label="E-mail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@totem.local"
          disabled={loading}
          autoFocus
          autoComplete="email"
        />

        <Input
          id="senha"
          label="Senha"
          type="password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          placeholder="Sua senha"
          disabled={loading}
          autoComplete="current-password"
        />

        <ErrorMessage message={erro} />

        <Button type="submit" loading={loading}>
          Entrar
        </Button>
      </form>
    </AppLayout>
  );
}
