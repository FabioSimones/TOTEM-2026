import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CategoriaCard } from "../../components/admin/categorias/CategoriaCard";
import { CategoriaForm } from "../../components/admin/categorias/CategoriaForm";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { Modal } from "../../components/ui/Modal";
import {
  atualizarCategoria,
  criarCategoria,
  inativarCategoria,
  listarCategorias,
} from "../../services/adminCategoriaService";
import { listarRestaurantes } from "../../services/adminRestauranteService";
import { useAuth } from "../../auth/useAuth";
import { ApiError } from "../../types/api";
import type { AtualizarCategoriaRequest, CategoriaAdminResponse, CriarCategoriaRequest } from "../../types/categoria";
import type { RestauranteAdminResponse } from "../../types/restaurante";
import { getRestauranteIdEscopo, isAdminRestaurante } from "../../utils/adminScope";
import { extrairErrosCampoApi } from "../../utils/apiFieldErrors";

const CAMPOS_CATEGORIA = ["restauranteId", "nome", "ordemExibicao"] as const;

export function AdminCategoriasPage() {
  const navigate = useNavigate();
  const { user: usuario, logout } = useAuth();
  const adminRestaurante = isAdminRestaurante(usuario);
  const restauranteIdEscopo = getRestauranteIdEscopo(usuario);

  const [restaurantes, setRestaurantes] = useState<RestauranteAdminResponse[]>([]);
  const [erroRestaurantes, setErroRestaurantes] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<CategoriaAdminResponse[]>([]);
  const [filtroRestauranteId, setFiltroRestauranteId] = useState<number | null>(restauranteIdEscopo);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<CategoriaAdminResponse | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [errosCampoApi, setErrosCampoApi] = useState<Partial<Record<(typeof CAMPOS_CATEGORIA)[number], string>>>({});

  const [acoesEmAndamento, setAcoesEmAndamento] = useState<Set<number>>(new Set());
  const [errosAcao, setErrosAcao] = useState<Record<number, string | null>>({});

  const carregarRestaurantes = useCallback(async () => {
    if (adminRestaurante) {
      // GET /api/admin/restaurantes é SUPER_ADMIN apenas — ADMIN_RESTAURANTE sempre recebe 403.
      // Nem chamamos: o formulário usa restauranteFixo (ver abaixo) em vez de uma lista.
      return;
    }
    setErroRestaurantes(null);
    try {
      const response = await listarRestaurantes();
      setRestaurantes(response);
    } catch {
      // Best-effort: sem lista de restaurantes o formulário de criação fica
      // indisponível, mas a listagem/edição/inativação de categorias segue normalmente.
      setErroRestaurantes("Não foi possível carregar a lista de restaurantes.");
    }
  }, [adminRestaurante]);

  const carregarCategorias = useCallback(async (restauranteId: number | null) => {
    setLoading(true);
    setErro(null);
    setSemAutorizacao(false);
    setMensagemSucesso(null);

    try {
      const response = await listarCategorias(restauranteId ?? undefined);
      setCategorias(response);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setSemAutorizacao(true);
        if (error.status === 401) {
          // Token inválido/expirado: não serve para mais nada, força novo login.
          void logout();
          setErro("Sessão expirada. Faça login novamente.");
        } else {
          // 403: token válido, mas sem permissão — sessão continua válida para outras áreas.
          setErro("Você não tem permissão para acessar categorias.");
        }
      } else {
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar as categorias. Tente novamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void carregarRestaurantes();
    void carregarCategorias(restauranteIdEscopo);
  }, [carregarRestaurantes, carregarCategorias, restauranteIdEscopo]);

  function handleFiltrar(restauranteId: number | null) {
    setFiltroRestauranteId(restauranteId);
    void carregarCategorias(restauranteId);
  }

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
      setErrosAcao((atual) => ({ ...atual, [id]: "Categoria não encontrada." }));
    } else if (error instanceof ApiError && error.status === 400) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message || mensagemPadrao }));
    } else if (error instanceof ApiError) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message }));
    } else {
      setErrosAcao((atual) => ({ ...atual, [id]: mensagemPadrao }));
    }
  }, [logout]);

  const handleCriar = useCallback(
    async (request: CriarCategoriaRequest) => {
      setErroSalvar(null);
      setErrosCampoApi({});
      setSalvando(true);

      try {
        const response = await criarCategoria(request);
        await carregarCategorias(filtroRestauranteId);
        setModalAberto(false);
        setMensagemSucesso(`Categoria "${response.nome}" cadastrada.`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          void logout();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Faça login novamente.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroSalvar("Você não tem permissão para cadastrar categorias.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroSalvar("Restaurante não encontrado.");
        } else if (error instanceof ApiError && error.status === 400) {
          const camposApi = extrairErrosCampoApi(error, CAMPOS_CATEGORIA);
          if (Object.keys(camposApi).length > 0) {
            setErrosCampoApi(camposApi);
          } else {
            setErroSalvar(error.message || "Dados inválidos. O nome pode já estar em uso neste restaurante.");
          }
        } else if (error instanceof ApiError) {
          setErroSalvar(error.message);
        } else {
          setErroSalvar("Não foi possível cadastrar a categoria. Tente novamente.");
        }
      } finally {
        setSalvando(false);
      }
    },
    [carregarCategorias, filtroRestauranteId, logout],
  );

  const handleAtualizar = useCallback(
    async (id: number, request: AtualizarCategoriaRequest) => {
      setErroSalvar(null);
      setErrosCampoApi({});
      setSalvando(true);

      try {
        const response = await atualizarCategoria(id, request);
        await carregarCategorias(filtroRestauranteId);
        setCategoriaEmEdicao(null);
        setModalAberto(false);
        setMensagemSucesso(`Categoria "${response.nome}" atualizada.`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          void logout();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Faça login novamente.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroSalvar("Você não tem permissão para editar categorias.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroSalvar("Categoria não encontrada.");
        } else if (error instanceof ApiError && error.status === 400) {
          const camposApi = extrairErrosCampoApi(error, CAMPOS_CATEGORIA);
          if (Object.keys(camposApi).length > 0) {
            setErrosCampoApi(camposApi);
          } else {
            setErroSalvar(error.message || "Dados inválidos. O nome pode já estar em uso neste restaurante.");
          }
        } else if (error instanceof ApiError) {
          setErroSalvar(error.message);
        } else {
          setErroSalvar("Não foi possível atualizar a categoria. Tente novamente.");
        }
      } finally {
        setSalvando(false);
      }
    },
    [carregarCategorias, filtroRestauranteId, logout],
  );

  const handleInativar = useCallback(
    async (id: number) => {
      setErrosAcao((atual) => ({ ...atual, [id]: null }));
      marcarAcaoEmAndamento(id, true);

      try {
        const response = await inativarCategoria(id);
        await carregarCategorias(filtroRestauranteId);
        setMensagemSucesso(`Categoria "${response.nome}" inativada.`);
      } catch (error) {
        tratarErroAcao(id, error, "Não foi possível inativar a categoria. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(id, false);
      }
    },
    [carregarCategorias, filtroRestauranteId, marcarAcaoEmAndamento, tratarErroAcao],
  );

  function handleNovo() {
    setErroSalvar(null);
    setErrosCampoApi({});
    setCategoriaEmEdicao(null);
    setModalAberto(true);
  }

  function handleEditar(categoria: CategoriaAdminResponse) {
    setErroSalvar(null);
    setErrosCampoApi({});
    setCategoriaEmEdicao(categoria);
    setModalAberto(true);
  }

  function handleFecharModal() {
    setModalAberto(false);
    setErroSalvar(null);
    setErrosCampoApi({});
    setCategoriaEmEdicao(null);
  }

  return (
    <>
      <div className="caixa-toolbar">
        <Button type="button" onClick={handleNovo}>
          Nova categoria
        </Button>
        <Button type="button" onClick={() => void carregarCategorias(filtroRestauranteId)} loading={loading}>
          Atualizar lista
        </Button>
      </div>

      {adminRestaurante ? (
        <p className="totem-estado admin-filtro-restaurante">
          Você está operando apenas no restaurante vinculado à sua conta.
        </p>
      ) : (
        restaurantes.length > 0 && (
          <div className="dispositivo-form__tipo admin-filtro-restaurante">
            <span className="dispositivo-form__tipo-rotulo">Filtrar por restaurante</span>
            <div className="dispositivo-form__tipo-opcoes">
              <button
                type="button"
                className={
                  "dispositivo-form__tipo-botao" + (filtroRestauranteId === null ? " dispositivo-form__tipo-botao--ativo" : "")
                }
                aria-pressed={filtroRestauranteId === null}
                onClick={() => handleFiltrar(null)}
              >
                Todos
              </button>
              {restaurantes.map((restaurante) => (
                <button
                  key={restaurante.id}
                  type="button"
                  className={
                    "dispositivo-form__tipo-botao" +
                    (filtroRestauranteId === restaurante.id ? " dispositivo-form__tipo-botao--ativo" : "")
                  }
                  aria-pressed={filtroRestauranteId === restaurante.id}
                  onClick={() => handleFiltrar(restaurante.id)}
                >
                  {restaurante.nome}
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {!adminRestaurante && erroRestaurantes && <ErrorMessage message={erroRestaurantes} />}

      {adminRestaurante && restauranteIdEscopo == null && (
        <ErrorMessage message="Seu usuário não possui restaurante vinculado. Contate um SUPER_ADMIN." />
      )}

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
            <Button type="button" onClick={() => void carregarCategorias(filtroRestauranteId)}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {!semAutorizacao && (!adminRestaurante || restauranteIdEscopo != null) && (
        <>
          <Modal
            aberto={modalAberto}
            titulo={categoriaEmEdicao ? `Editar categoria — ${categoriaEmEdicao.nome}` : "Cadastrar categoria"}
            onFechar={handleFecharModal}
          >
            <CategoriaForm
              categoriaEmEdicao={categoriaEmEdicao}
              restaurantes={restaurantes}
              restauranteSelecionadoPadrao={filtroRestauranteId}
              restauranteFixo={
                adminRestaurante && restauranteIdEscopo != null
                  ? { id: restauranteIdEscopo, rotulo: "Restaurante vinculado à sua conta" }
                  : null
              }
              onCriar={handleCriar}
              onAtualizar={handleAtualizar}
              onCancelarEdicao={handleFecharModal}
              salvando={salvando}
              erro={erroSalvar}
              errosCampoApi={errosCampoApi}
            />
          </Modal>

          {loading && <p className="totem-estado">Carregando categorias...</p>}

          {!loading && !erro && categorias.length === 0 && (
            <p className="totem-estado">Nenhuma categoria cadastrada.</p>
          )}

          {!loading && !erro && categorias.length > 0 && (
            <div className="caixa-lista">
              {categorias.map((categoria) => (
                <CategoriaCard
                  key={categoria.id}
                  categoria={categoria}
                  restaurantes={restaurantes}
                  executando={acoesEmAndamento.has(categoria.id)}
                  erro={errosAcao[categoria.id] ?? null}
                  onEditar={handleEditar}
                  onInativar={handleInativar}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
