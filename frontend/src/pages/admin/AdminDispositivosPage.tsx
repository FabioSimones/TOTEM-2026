import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { DispositivoCard } from "../../components/admin/dispositivos/DispositivoCard";
import { DispositivoForm } from "../../components/admin/dispositivos/DispositivoForm";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import {
  criarDispositivo,
  listarDispositivos,
  reativarDispositivo,
  revogarDispositivo,
} from "../../services/adminDispositivoService";
import { clearSession, getAccessToken, getStoredUsuario } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { CriarDispositivoRequest, DispositivoAdminResponse } from "../../types/dispositivo";

export function AdminDispositivosPage() {
  const navigate = useNavigate();
  const [dispositivos, setDispositivos] = useState<DispositivoAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const [criando, setCriando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);

  const [acoesEmAndamento, setAcoesEmAndamento] = useState<Set<number>>(new Set());
  const [errosAcao, setErrosAcao] = useState<Record<number, string | null>>({});

  const carregarDispositivos = useCallback(async () => {
    setLoading(true);
    setErro(null);
    setSemAutorizacao(false);
    setMensagemSucesso(null);

    try {
      const response = await listarDispositivos();
      setDispositivos(response);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setSemAutorizacao(true);
        if (error.status === 401) {
          // Token inválido/expirado: não serve para mais nada, força novo login.
          clearSession();
          setErro("Sessão expirada. Faça login novamente.");
        } else {
          // 403: token válido, mas sem permissão (perfil não é SUPER_ADMIN/ADMIN_RESTAURANTE)
          // — a sessão continua válida para outras áreas, então não é apagada.
          setErro("Você não tem permissão para acessar dispositivos.");
        }
      } else {
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os dispositivos. Tente novamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAccessToken() || !getStoredUsuario()) {
      navigate("/admin/login", { replace: true });
      return;
    }
    void carregarDispositivos();
  }, [navigate, carregarDispositivos]);

  const marcarAcaoEmAndamento = useCallback((id: number, emAndamento: boolean) => {
    setAcoesEmAndamento((atual) => {
      const proximo = new Set(atual);
      if (emAndamento) {
        proximo.add(id);
      } else {
        proximo.delete(id);
      }
      return proximo;
    });
  }, []);

  const tratarErroAcao = useCallback((id: number, error: unknown, mensagemPadrao: string) => {
    if (error instanceof ApiError && error.status === 401) {
      clearSession();
      setSemAutorizacao(true);
      setErro("Sessão expirada. Faça login novamente.");
    } else if (error instanceof ApiError && error.status === 403) {
      setErrosAcao((atual) => ({ ...atual, [id]: "Você não tem permissão para executar esta ação." }));
    } else if (error instanceof ApiError && error.status === 404) {
      setErrosAcao((atual) => ({ ...atual, [id]: "Dispositivo não encontrado." }));
    } else if (error instanceof ApiError && error.status === 400) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message || mensagemPadrao }));
    } else if (error instanceof ApiError) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message }));
    } else {
      setErrosAcao((atual) => ({ ...atual, [id]: mensagemPadrao }));
    }
  }, []);

  const handleCriarDispositivo = useCallback(
    async (request: CriarDispositivoRequest) => {
      setErroCriacao(null);
      setCriando(true);

      try {
        const response = await criarDispositivo(request);
        await carregarDispositivos();
        setMensagemSucesso(
          `Dispositivo "${response.nome}" cadastrado. Código de ativação: ${response.codigoAtivacao}`,
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Faça login novamente.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroCriacao("Você não tem permissão para cadastrar dispositivos.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroCriacao("Restaurante não encontrado. Confira o ID informado.");
        } else if (error instanceof ApiError && error.status === 400) {
          setErroCriacao(
            error.message || "Dados inválidos. O código de identificação pode já estar em uso.",
          );
        } else if (error instanceof ApiError) {
          setErroCriacao(error.message);
        } else {
          setErroCriacao("Não foi possível cadastrar o dispositivo. Tente novamente.");
        }
      } finally {
        setCriando(false);
      }
    },
    [carregarDispositivos],
  );

  const handleRevogar = useCallback(
    async (id: number) => {
      setErrosAcao((atual) => ({ ...atual, [id]: null }));
      marcarAcaoEmAndamento(id, true);

      try {
        const response = await revogarDispositivo(id);
        await carregarDispositivos();
        setMensagemSucesso(`Dispositivo "${response.nome}" revogado.`);
      } catch (error) {
        tratarErroAcao(id, error, "Não foi possível revogar o dispositivo. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(id, false);
      }
    },
    [carregarDispositivos, marcarAcaoEmAndamento, tratarErroAcao],
  );

  const handleReativar = useCallback(
    async (id: number) => {
      setErrosAcao((atual) => ({ ...atual, [id]: null }));
      marcarAcaoEmAndamento(id, true);

      try {
        const response = await reativarDispositivo(id);
        await carregarDispositivos();
        setMensagemSucesso(`Dispositivo "${response.nome}" reativado.`);
      } catch (error) {
        tratarErroAcao(id, error, "Não foi possível reativar o dispositivo. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(id, false);
      }
    },
    [carregarDispositivos, marcarAcaoEmAndamento, tratarErroAcao],
  );

  return (
    <AppLayout
      title="Dispositivos"
      description="Cadastro e gestão de dispositivos Totem, Caixa, Cozinha e Administração."
    >
      <div className="caixa-toolbar">
        <Button type="button" onClick={() => void carregarDispositivos()} loading={loading}>
          Atualizar lista
        </Button>
      </div>

      {!erro && mensagemSucesso && (
        <p className="ui-success-message" role="status">
          {mensagemSucesso}
        </p>
      )}

      {erro && (
        <div className="totem-estado totem-estado--erro">
          <ErrorMessage message={erro} />
          {semAutorizacao ? (
            <Button type="button" onClick={() => navigate("/admin/login")}>
              Ir para login
            </Button>
          ) : (
            <Button type="button" onClick={() => void carregarDispositivos()}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {!semAutorizacao && (
        <>
          <DispositivoForm onCriar={handleCriarDispositivo} criando={criando} erro={erroCriacao} />

          {loading && <p className="totem-estado">Carregando dispositivos...</p>}

          {!loading && !erro && dispositivos.length === 0 && (
            <p className="totem-estado">Nenhum dispositivo cadastrado.</p>
          )}

          {!loading && !erro && dispositivos.length > 0 && (
            <div className="caixa-lista">
              {dispositivos.map((dispositivo) => (
                <DispositivoCard
                  key={dispositivo.id}
                  dispositivo={dispositivo}
                  executando={acoesEmAndamento.has(dispositivo.id)}
                  erro={errosAcao[dispositivo.id] ?? null}
                  onRevogar={handleRevogar}
                  onReativar={handleReativar}
                />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
