import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { ativarDispositivo } from "../services/authService";
import { setAccessToken, setStoredDispositivo } from "../services/tokenStorage";
import { ApiError } from "../types/api";
import type { TipoDispositivo } from "../types/auth";

const ROTA_POR_TIPO_DISPOSITIVO: Record<TipoDispositivo, string> = {
  TOTEM: "/totem",
  CAIXA: "/caixa",
  COZINHA: "/cozinha",
  ADMINISTRACAO: "/admin",
};

export function AtivarDispositivoPage() {
  const navigate = useNavigate();
  const [codigoAtivacao, setCodigoAtivacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    const codigo = codigoAtivacao.trim();
    if (!codigo) {
      setErro("Informe o código de ativação.");
      return;
    }

    setLoading(true);
    try {
      const response = await ativarDispositivo(codigo);

      setAccessToken(response.accessToken);
      setStoredDispositivo(response.dispositivo);
      setSucesso(true);

      const destino = ROTA_POR_TIPO_DISPOSITIVO[response.dispositivo.tipoDispositivo] ?? "/";
      window.setTimeout(() => navigate(destino, { replace: true }), 800);
    } catch (error) {
      setErro(
        error instanceof ApiError
          ? error.message
          : "Não foi possível ativar o dispositivo. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout
      title="Ativar Dispositivo"
      description="Informe o código de ativação gerado pelo administrador ao cadastrar este dispositivo (Totem, Caixa ou Cozinha)."
    >
      <form onSubmit={handleSubmit} className="ativar-dispositivo-form">
        <Input
          id="codigoAtivacao"
          label="Código de ativação"
          value={codigoAtivacao}
          onChange={(event) => setCodigoAtivacao(event.target.value)}
          placeholder="Ex.: 8f2c1a9b3d4e5f60"
          disabled={loading || sucesso}
          autoFocus
        />

        <ErrorMessage message={erro} />

        {sucesso && (
          <p className="ui-success-message" role="status">
            Dispositivo ativado com sucesso! Redirecionando...
          </p>
        )}

        <Button type="submit" loading={loading} disabled={sucesso}>
          Ativar dispositivo
        </Button>
      </form>
    </AppLayout>
  );
}
