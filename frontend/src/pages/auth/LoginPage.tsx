import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthSplitLayout } from "../../components/auth/AuthSplitLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { useAuth } from "../../auth/useAuth";
import { PerfilNaoConfiguradoError, resolveHomeRoute } from "../../auth/routeResolver";
import { ApiError } from "../../types/api";

/** Evita open redirect: só aceita um caminho interno começando com "/" (nunca "//host" nem URL absoluta). */
function destinoSeguro(candidato: unknown): string | null {
  return typeof candidato === "string" && candidato.startsWith("/") && !candidato.startsWith("//")
    ? candidato
    : null;
}

/**
 * Página central de login para usuários humanos (SUPER_ADMIN, ADMIN_RESTAURANTE, operadores) —
 * substitui a antiga `pages/admin/AdminLoginPage.tsx`. A rota antiga `/admin/login` passa a
 * redirecionar para `/login` (ver AppRoutes) durante o período de transição.
 *
 * Ativação de dispositivo e identificação de operador permanecem fluxos técnicos separados,
 * fora desta página (auditoria, seção 9) — aqui só se resolve a identidade do usuário humano.
 *
 * TASK-117: redesign visual (`AuthSplitLayout`) — a lógica de autenticação abaixo não mudou.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [orientacaoDispositivo, setOrientacaoDispositivo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setOrientacaoDispositivo(null);

    const emailInformado = email.trim();
    if (!emailInformado || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      const usuario = await login({ email: emailInformado, senha });
      const resultado = resolveHomeRoute(usuario);

      if (resultado.kind === "device-required") {
        // Perfil válido, mas sem dispositivo compatível ativado neste navegador — não libera a
        // interface operacional só com o token de usuário (regra crítica da tarefa, seção 2).
        setOrientacaoDispositivo(resultado.mensagem);
        return;
      }

      const origem = destinoSeguro((location.state as { from?: string } | null)?.from);
      navigate(origem ?? resultado.path, { replace: true });
    } catch (error) {
      if (error instanceof PerfilNaoConfiguradoError) {
        await logout();
        setErro("Este usuário não possui um destino configurado no sistema. Contate um administrador.");
        return;
      }
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
    <AuthSplitLayout>
      <div className="auth-form-header">
        <p className="auth-form-header__eyebrow">Bem-vindo de volta</p>
        <h1 className="auth-form-header__title">Acesse sua conta</h1>
        <p className="auth-form-header__description">Entre com suas credenciais para acessar o sistema.</p>
      </div>

      <form onSubmit={handleSubmit} className="admin-login-form">
        <Input
          id="email"
          label="E-mail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="usuario@totem.local"
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

        {orientacaoDispositivo && (
          <div className="totem-estado">
            <p>{orientacaoDispositivo}</p>
            <Button type="button" onClick={() => navigate("/ativar-dispositivo")}>
              Ir para ativação de dispositivo
            </Button>
          </div>
        )}

        <Button type="submit" loading={loading} fullWidth>
          Entrar
        </Button>
      </form>

      <div className="auth-form-footer">
        <Link to="/ativar-dispositivo" className="auth-form-footer__link">
          Ativar um dispositivo
        </Link>
        <p className="auth-form-footer__hint">
          Acesso destinado a administradores e operadores autorizados. Operadores de Caixa e
          Cozinha ainda precisam se identificar no respectivo terminal.
        </p>
      </div>
    </AuthSplitLayout>
  );
}
