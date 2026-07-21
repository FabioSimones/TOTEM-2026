import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RestauranteCard } from "../../components/admin/restaurantes/RestauranteCard";
import { RestauranteForm } from "../../components/admin/restaurantes/RestauranteForm";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { Modal } from "../../components/ui/Modal";
import {
  ativarRestaurante,
  atualizarRestaurante,
  criarRestaurante,
  desativarRestaurante,
  listarRestaurantes,
} from "../../services/adminRestauranteService";
import { useAuth } from "../../auth/useAuth";
import { ApiError } from "../../types/api";
import type {
  AtualizarRestauranteRequest,
  CriarRestauranteRequest,
  RestauranteAdminResponse,
} from "../../types/restaurante";
import { extrairErrosCampoApi } from "../../utils/apiFieldErrors";

const CAMPOS_RESTAURANTE = ["nome", "cnpj", "endereco"] as const;

export function AdminRestaurantesPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [restaurantes, setRestaurantes] = useState<RestauranteAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [restauranteEmEdicao, setRestauranteEmEdicao] = useState<RestauranteAdminResponse | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [errosCampoApi, setErrosCampoApi] = useState<Partial<Record<(typeof CAMPOS_RESTAURANTE)[number], string>>>({});

  const [acoesEmAndamento, setAcoesEmAndamento] = useState<Set<number>>(new Set());
  const [errosAcao, setErrosAcao] = useState<Record<number, string | null>>({});

  const carregarRestaurantes = useCallback(async () => {
    setLoading(true);
    setErro(null);
    setSemAutorizacao(false);
    setMensagemSucesso(null);

    try {
      const response = await listarRestaurantes();
      setRestaurantes(response);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setSemAutorizacao(true);
        if (error.status === 401) {
          // Token inválido/expirado: não serve para mais nada, força novo login.
          void logout();
          setErro("Sessão expirada. Faça login novamente.");
        } else {
          // 403: token válido, mas sem permissão (só SUPER_ADMIN acessa restaurantes)
          // — a sessão continua válida para outras áreas, então não é apagada.
          setErro("Você não tem permissão para acessar restaurantes.");
        }
      } else {
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os restaurantes. Tente novamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void carregarRestaurantes();
  }, [carregarRestaurantes]);

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
      void logout();
      setSemAutorizacao(true);
      setErro("Sessão expirada. Faça login novamente.");
    } else if (error instanceof ApiError && error.status === 403) {
      setErrosAcao((atual) => ({ ...atual, [id]: "Você não tem permissão para executar esta ação." }));
    } else if (error instanceof ApiError && error.status === 404) {
      setErrosAcao((atual) => ({ ...atual, [id]: "Restaurante não encontrado." }));
    } else if (error instanceof ApiError && error.status === 400) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message || mensagemPadrao }));
    } else if (error instanceof ApiError) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message }));
    } else {
      setErrosAcao((atual) => ({ ...atual, [id]: mensagemPadrao }));
    }
  }, [logout]);

  const handleCriar = useCallback(
    async (request: CriarRestauranteRequest) => {
      setErroSalvar(null);
      setErrosCampoApi({});
      setSalvando(true);

      try {
        const response = await criarRestaurante(request);
        await carregarRestaurantes();
        setModalAberto(false);
        setMensagemSucesso(`Restaurante "${response.nome}" cadastrado (ID ${response.id}).`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          void logout();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Faça login novamente.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroSalvar("Você não tem permissão para cadastrar restaurantes.");
        } else if (error instanceof ApiError && error.status === 400) {
          // TASK-115: se a API rejeitou por validação de campo (@Valid), o erro já aparece inline
          // no campo — a mensagem genérica só aparece se nenhum campo reconhecido foi retornado.
          const camposApi = extrairErrosCampoApi(error, CAMPOS_RESTAURANTE);
          if (Object.keys(camposApi).length > 0) {
            setErrosCampoApi(camposApi);
          } else {
            setErroSalvar(error.message || "Dados inválidos. O CNPJ pode já estar cadastrado.");
          }
        } else if (error instanceof ApiError) {
          setErroSalvar(error.message);
        } else {
          setErroSalvar("Não foi possível cadastrar o restaurante. Tente novamente.");
        }
      } finally {
        setSalvando(false);
      }
    },
    [carregarRestaurantes, logout],
  );

  const handleAtualizar = useCallback(
    async (id: number, request: AtualizarRestauranteRequest) => {
      setErroSalvar(null);
      setErrosCampoApi({});
      setSalvando(true);

      try {
        const response = await atualizarRestaurante(id, request);
        await carregarRestaurantes();
        setRestauranteEmEdicao(null);
        setModalAberto(false);
        setMensagemSucesso(`Restaurante "${response.nome}" atualizado.`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          void logout();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Faça login novamente.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroSalvar("Você não tem permissão para editar restaurantes.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroSalvar("Restaurante não encontrado.");
        } else if (error instanceof ApiError && error.status === 400) {
          const camposApi = extrairErrosCampoApi(error, CAMPOS_RESTAURANTE);
          if (Object.keys(camposApi).length > 0) {
            setErrosCampoApi(camposApi);
          } else {
            setErroSalvar(error.message || "Dados inválidos. O CNPJ pode já pertencer a outro restaurante.");
          }
        } else if (error instanceof ApiError) {
          setErroSalvar(error.message);
        } else {
          setErroSalvar("Não foi possível atualizar o restaurante. Tente novamente.");
        }
      } finally {
        setSalvando(false);
      }
    },
    [carregarRestaurantes, logout],
  );

  const handleAtivar = useCallback(
    async (id: number) => {
      setErrosAcao((atual) => ({ ...atual, [id]: null }));
      marcarAcaoEmAndamento(id, true);

      try {
        const response = await ativarRestaurante(id);
        await carregarRestaurantes();
        setMensagemSucesso(`Restaurante "${response.nome}" ativado.`);
      } catch (error) {
        tratarErroAcao(id, error, "Não foi possível ativar o restaurante. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(id, false);
      }
    },
    [carregarRestaurantes, marcarAcaoEmAndamento, tratarErroAcao],
  );

  const handleDesativar = useCallback(
    async (id: number) => {
      setErrosAcao((atual) => ({ ...atual, [id]: null }));
      marcarAcaoEmAndamento(id, true);

      try {
        const response = await desativarRestaurante(id);
        await carregarRestaurantes();
        setMensagemSucesso(`Restaurante "${response.nome}" desativado.`);
      } catch (error) {
        tratarErroAcao(id, error, "Não foi possível desativar o restaurante. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(id, false);
      }
    },
    [carregarRestaurantes, marcarAcaoEmAndamento, tratarErroAcao],
  );

  function handleNovo() {
    setErroSalvar(null);
    setErrosCampoApi({});
    setRestauranteEmEdicao(null);
    setModalAberto(true);
  }

  function handleEditar(restaurante: RestauranteAdminResponse) {
    setErroSalvar(null);
    setErrosCampoApi({});
    setRestauranteEmEdicao(restaurante);
    setModalAberto(true);
  }

  function handleFecharModal() {
    setModalAberto(false);
    setErroSalvar(null);
    setErrosCampoApi({});
    setRestauranteEmEdicao(null);
  }

  return (
    <>
      <div className="caixa-toolbar">
        <Button type="button" onClick={handleNovo}>
          Novo restaurante
        </Button>
        <Button type="button" onClick={() => void carregarRestaurantes()} loading={loading}>
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
            <Button type="button" onClick={() => navigate("/login")}>
              Ir para login
            </Button>
          ) : (
            <Button type="button" onClick={() => void carregarRestaurantes()}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {!semAutorizacao && (
        <>
          <Modal
            aberto={modalAberto}
            titulo={restauranteEmEdicao ? `Editar restaurante — ${restauranteEmEdicao.nome}` : "Cadastrar restaurante"}
            onFechar={handleFecharModal}
          >
            <RestauranteForm
              restauranteEmEdicao={restauranteEmEdicao}
              onCriar={handleCriar}
              onAtualizar={handleAtualizar}
              onCancelarEdicao={handleFecharModal}
              salvando={salvando}
              erro={erroSalvar}
              errosCampoApi={errosCampoApi}
            />
          </Modal>

          {loading && <p className="totem-estado">Carregando restaurantes...</p>}

          {!loading && !erro && restaurantes.length === 0 && (
            <p className="totem-estado">Nenhum restaurante cadastrado.</p>
          )}

          {!loading && !erro && restaurantes.length > 0 && (
            <div className="caixa-lista">
              {restaurantes.map((restaurante) => (
                <RestauranteCard
                  key={restaurante.id}
                  restaurante={restaurante}
                  executando={acoesEmAndamento.has(restaurante.id)}
                  erro={errosAcao[restaurante.id] ?? null}
                  onEditar={handleEditar}
                  onAtivar={handleAtivar}
                  onDesativar={handleDesativar}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
