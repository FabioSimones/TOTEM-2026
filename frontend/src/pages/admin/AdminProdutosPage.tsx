import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { ProdutoCard } from "../../components/admin/produtos/ProdutoCard";
import { ProdutoForm } from "../../components/admin/produtos/ProdutoForm";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { listarCategorias } from "../../services/adminCategoriaService";
import {
  alterarDestaqueProduto,
  alterarDisponibilidadeProduto,
  atualizarProduto,
  criarProduto,
  listarProdutos,
} from "../../services/adminProdutoService";
import { listarRestaurantes } from "../../services/adminRestauranteService";
import { clearSession, getAccessToken, getStoredUsuario } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { CategoriaAdminResponse } from "../../types/categoria";
import type { AtualizarProdutoRequest, CriarProdutoRequest, ProdutoAdminResponse } from "../../types/produto";
import type { RestauranteAdminResponse } from "../../types/restaurante";

export function AdminProdutosPage() {
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState<RestauranteAdminResponse[]>([]);
  const [categorias, setCategorias] = useState<CategoriaAdminResponse[]>([]);
  const [erroApoio, setErroApoio] = useState<string | null>(null);

  const [produtos, setProdutos] = useState<ProdutoAdminResponse[]>([]);
  const [filtroRestauranteId, setFiltroRestauranteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const [produtoEmEdicao, setProdutoEmEdicao] = useState<ProdutoAdminResponse | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const [acoesEmAndamento, setAcoesEmAndamento] = useState<Set<number>>(new Set());
  const [errosAcao, setErrosAcao] = useState<Record<number, string | null>>({});

  const carregarApoio = useCallback(async () => {
    setErroApoio(null);
    try {
      const [restaurantesResponse, categoriasResponse] = await Promise.all([
        listarRestaurantes(),
        listarCategorias(),
      ]);
      setRestaurantes(restaurantesResponse);
      setCategorias(categoriasResponse);
    } catch {
      // Best-effort: sem restaurantes/categorias o formulário de criação fica
      // indisponível, mas a listagem/edição/ações de produtos segue normalmente.
      setErroApoio("Não foi possível carregar restaurantes/categorias.");
    }
  }, []);

  const carregarProdutos = useCallback(async (restauranteId: number | null) => {
    setLoading(true);
    setErro(null);
    setSemAutorizacao(false);
    setMensagemSucesso(null);

    try {
      const response = await listarProdutos({ restauranteId: restauranteId ?? undefined });
      setProdutos(response);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setSemAutorizacao(true);
        if (error.status === 401) {
          // Token inválido/expirado: não serve para mais nada, força novo login.
          clearSession();
          setErro("Sessão expirada. Faça login novamente.");
        } else {
          // 403: token válido, mas sem permissão — sessão continua válida para outras áreas.
          setErro("Você não tem permissão para acessar produtos.");
        }
      } else {
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os produtos. Tente novamente.",
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
    void carregarApoio();
    void carregarProdutos(null);
  }, [navigate, carregarApoio, carregarProdutos]);

  function handleFiltrar(restauranteId: number | null) {
    setFiltroRestauranteId(restauranteId);
    void carregarProdutos(restauranteId);
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
      clearSession();
      setSemAutorizacao(true);
      setErro("Sessão expirada. Faça login novamente.");
    } else if (error instanceof ApiError && error.status === 403) {
      setErrosAcao((atual) => ({ ...atual, [id]: "Você não tem permissão para executar esta ação." }));
    } else if (error instanceof ApiError && error.status === 404) {
      setErrosAcao((atual) => ({ ...atual, [id]: "Produto não encontrado." }));
    } else if (error instanceof ApiError && error.status === 400) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message || mensagemPadrao }));
    } else if (error instanceof ApiError) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message }));
    } else {
      setErrosAcao((atual) => ({ ...atual, [id]: mensagemPadrao }));
    }
  }, []);

  const handleCriar = useCallback(
    async (request: CriarProdutoRequest) => {
      setErroSalvar(null);
      setSalvando(true);

      try {
        const response = await criarProduto(request);
        await carregarProdutos(filtroRestauranteId);
        setMensagemSucesso(`Produto "${response.nome}" cadastrado.`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Faça login novamente.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroSalvar("Você não tem permissão para cadastrar produtos.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroSalvar("Restaurante ou categoria não encontrados.");
        } else if (error instanceof ApiError && error.status === 400) {
          setErroSalvar(
            error.message || "Dados inválidos. O nome pode já estar em uso ou a categoria pertence a outro restaurante.",
          );
        } else if (error instanceof ApiError) {
          setErroSalvar(error.message);
        } else {
          setErroSalvar("Não foi possível cadastrar o produto. Tente novamente.");
        }
      } finally {
        setSalvando(false);
      }
    },
    [carregarProdutos, filtroRestauranteId],
  );

  const handleAtualizar = useCallback(
    async (id: number, request: AtualizarProdutoRequest) => {
      setErroSalvar(null);
      setSalvando(true);

      try {
        const response = await atualizarProduto(id, request);
        await carregarProdutos(filtroRestauranteId);
        setProdutoEmEdicao(null);
        setMensagemSucesso(`Produto "${response.nome}" atualizado.`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Faça login novamente.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroSalvar("Você não tem permissão para editar produtos.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroSalvar("Produto ou categoria não encontrados.");
        } else if (error instanceof ApiError && error.status === 400) {
          setErroSalvar(
            error.message || "Dados inválidos. O nome pode já estar em uso ou a categoria pertence a outro restaurante.",
          );
        } else if (error instanceof ApiError) {
          setErroSalvar(error.message);
        } else {
          setErroSalvar("Não foi possível atualizar o produto. Tente novamente.");
        }
      } finally {
        setSalvando(false);
      }
    },
    [carregarProdutos, filtroRestauranteId],
  );

  const handleAlternarDisponibilidade = useCallback(
    async (id: number, disponivel: boolean) => {
      setErrosAcao((atual) => ({ ...atual, [id]: null }));
      marcarAcaoEmAndamento(id, true);

      try {
        const response = await alterarDisponibilidadeProduto(id, { disponivel });
        await carregarProdutos(filtroRestauranteId);
        setMensagemSucesso(
          `Produto "${response.nome}" agora está ${response.disponivel ? "disponível" : "indisponível"}.`,
        );
      } catch (error) {
        tratarErroAcao(id, error, "Não foi possível alterar a disponibilidade. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(id, false);
      }
    },
    [carregarProdutos, filtroRestauranteId, marcarAcaoEmAndamento, tratarErroAcao],
  );

  const handleAlternarDestaque = useCallback(
    async (id: number, destaque: boolean) => {
      setErrosAcao((atual) => ({ ...atual, [id]: null }));
      marcarAcaoEmAndamento(id, true);

      try {
        const response = await alterarDestaqueProduto(id, { destaque });
        await carregarProdutos(filtroRestauranteId);
        setMensagemSucesso(
          `Destaque do produto "${response.nome}" ${response.destaque ? "ativado" : "removido"}.`,
        );
      } catch (error) {
        tratarErroAcao(id, error, "Não foi possível alterar o destaque. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(id, false);
      }
    },
    [carregarProdutos, filtroRestauranteId, marcarAcaoEmAndamento, tratarErroAcao],
  );

  function handleEditar(produto: ProdutoAdminResponse) {
    setErroSalvar(null);
    setProdutoEmEdicao(produto);
  }

  function handleCancelarEdicao() {
    setErroSalvar(null);
    setProdutoEmEdicao(null);
  }

  return (
    <AppLayout title="Produtos" description="Cadastro e gestão dos produtos do cardápio, por restaurante e categoria.">
      <div className="caixa-toolbar">
        <Button type="button" onClick={() => void carregarProdutos(filtroRestauranteId)} loading={loading}>
          Atualizar lista
        </Button>
      </div>

      {restaurantes.length > 0 && (
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
      )}

      {erroApoio && <ErrorMessage message={erroApoio} />}

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
            <Button type="button" onClick={() => void carregarProdutos(filtroRestauranteId)}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {!semAutorizacao && (
        <>
          <ProdutoForm
            produtoEmEdicao={produtoEmEdicao}
            restaurantes={restaurantes}
            categorias={categorias}
            restauranteSelecionadoPadrao={filtroRestauranteId}
            onCriar={handleCriar}
            onAtualizar={handleAtualizar}
            onCancelarEdicao={handleCancelarEdicao}
            salvando={salvando}
            erro={erroSalvar}
          />

          {loading && <p className="totem-estado">Carregando produtos...</p>}

          {!loading && !erro && produtos.length === 0 && (
            <p className="totem-estado">Nenhum produto cadastrado.</p>
          )}

          {!loading && !erro && produtos.length > 0 && (
            <div className="caixa-lista">
              {produtos.map((produto) => (
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
                  restaurantes={restaurantes}
                  categorias={categorias}
                  executando={acoesEmAndamento.has(produto.id)}
                  erro={errosAcao[produto.id] ?? null}
                  onEditar={handleEditar}
                  onAlternarDisponibilidade={handleAlternarDisponibilidade}
                  onAlternarDestaque={handleAlternarDestaque}
                />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
