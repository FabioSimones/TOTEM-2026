import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { CategoriaCardapioSection } from "../../components/totem/CategoriaCardapioSection";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { buscarCardapio } from "../../services/totemService";
import { clearSession, getAccessToken } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { CardapioTotemResponse } from "../../types/totem";

export function TotemHomePage() {
  const navigate = useNavigate();
  const [cardapio, setCardapio] = useState<CardapioTotemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);

  const carregarCardapio = useCallback(async () => {
    setLoading(true);
    setErro(null);
    setSemAutorizacao(false);

    try {
      const response = await buscarCardapio();
      setCardapio(response);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setSemAutorizacao(true);
        if (error.status === 401) {
          // Token inválido/expirado: não serve para mais nada, força nova ativação.
          clearSession();
          setErro("Sessão expirada. Ative o dispositivo novamente para continuar.");
        } else {
          // 403: token válido, mas sem permissão de TOTEM — pode ser legítimo
          // para outro módulo, então a sessão não é apagada.
          setErro("Este dispositivo não tem permissão para acessar o cardápio do Totem.");
        }
      } else {
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar o cardápio. Tente novamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/ativar-dispositivo", { replace: true });
      return;
    }
    void carregarCardapio();
  }, [navigate, carregarCardapio]);

  const categorias = cardapio?.categorias ?? [];

  return (
    <AppLayout title="Cardápio" description="Selecione uma categoria para ver os produtos disponíveis.">
      {loading && <p className="totem-estado">Carregando cardápio...</p>}

      {!loading && erro && (
        <div className="totem-estado totem-estado--erro">
          <ErrorMessage message={erro} />
          {semAutorizacao ? (
            <Button type="button" onClick={() => navigate("/ativar-dispositivo")}>
              Ir para ativação de dispositivo
            </Button>
          ) : (
            <Button type="button" onClick={() => void carregarCardapio()}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {!loading && !erro && categorias.length === 0 && (
        <p className="totem-estado">Nenhum produto disponível no momento.</p>
      )}

      {!loading &&
        !erro &&
        categorias.map((categoria) => <CategoriaCardapioSection key={categoria.id} categoria={categoria} />)}
    </AppLayout>
  );
}
