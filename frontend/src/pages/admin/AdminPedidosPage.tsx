import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PedidoAdminCard } from "../../components/admin/pedidos/PedidoAdminCard";
import { PedidoAdminDetalhe } from "../../components/admin/pedidos/PedidoAdminDetalhe";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { buscarPedido, listarPedidos } from "../../services/adminPedidoService";
import { listarRestaurantes } from "../../services/adminRestauranteService";
import { useAuth } from "../../auth/useAuth";
import { ApiError } from "../../types/api";
import type { PedidoAdminDetalheResponse, PedidoAdminResumoResponse } from "../../types/pedidoAdmin";
import type { RestauranteAdminResponse } from "../../types/restaurante";
import type { StatusPedido } from "../../types/totem";
import { getRestauranteIdEscopo, isAdminRestaurante } from "../../utils/adminScope";
import { getPedidoStatusLabel } from "../../utils/pedidoStatus";

const TAMANHO_PAGINA = 20;

const STATUS_FILTRAVEIS: StatusPedido[] = [
  "CRIADO",
  "AGUARDANDO_PAGAMENTO_DINHEIRO",
  "PAGO",
  "ENVIADO_PARA_COZINHA",
  "EM_PREPARO",
  "PRONTO",
  "RETIRADO",
  "CANCELADO",
  "EXPIRADO",
];

export function AdminPedidosPage() {
  const navigate = useNavigate();
  const { user: usuario, logout } = useAuth();
  const adminRestaurante = isAdminRestaurante(usuario);
  const restauranteIdEscopo = getRestauranteIdEscopo(usuario);

  const [restaurantes, setRestaurantes] = useState<RestauranteAdminResponse[]>([]);
  const [filtroRestauranteId, setFiltroRestauranteId] = useState<number | null>(restauranteIdEscopo);
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | null>(null);

  const [pedidos, setPedidos] = useState<PedidoAdminResumoResponse[]>([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);
  const [primeiraPagina, setPrimeiraPagina] = useState(true);
  const [ultimaPagina, setUltimaPagina] = useState(true);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);

  const [pedidoDetalhe, setPedidoDetalhe] = useState<PedidoAdminDetalheResponse | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null);

  const carregarRestaurantes = useCallback(async () => {
    if (adminRestaurante) {
      // GET /api/admin/restaurantes é SUPER_ADMIN apenas — ADMIN_RESTAURANTE nunca usa seletor.
      return;
    }
    try {
      const response = await listarRestaurantes();
      setRestaurantes(response);
    } catch {
      // Best-effort: sem a lista, o filtro por restaurante fica indisponível, mas a
      // listagem de pedidos (sem filtro de restaurante) continua funcionando normalmente.
    }
  }, [adminRestaurante]);

  const carregarPedidos = useCallback(
    async (
      restauranteId: number | null,
      statusPedido: StatusPedido | null,
      paginaAlvo: number,
      corrigindoPagina = false,
    ) => {
      setLoading(true);
      setErro(null);
      setSemAutorizacao(false);
      setPedidoDetalhe(null);

      try {
        const response = await listarPedidos({
          restauranteId: restauranteId ?? undefined,
          statusPedido: statusPedido ?? undefined,
          page: paginaAlvo,
          size: TAMANHO_PAGINA,
        });

        // Página fora do intervalo válido (ex.: dados diminuíram entre o carregamento e um
        // "Atualizar lista" concorrente): busca automaticamente a última página válida em vez de
        // prender o usuário numa lista vazia sem forma de voltar pela UI (pendência da TASK-072/073).
        if (response.content.length === 0 && response.totalElements > 0 && paginaAlvo > 0 && !corrigindoPagina) {
          const paginaValida = Math.max(0, response.totalPages - 1);
          await carregarPedidos(restauranteId, statusPedido, paginaValida, true);
          return;
        }

        setPedidos(response.content);
        setPagina(response.page);
        setTotalPaginas(response.totalPages);
        setTotalElementos(response.totalElements);
        setPrimeiraPagina(response.first);
        setUltimaPagina(response.last);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setSemAutorizacao(true);
          if (error.status === 401) {
            void logout();
            setErro("Sessão expirada. Faça login novamente.");
          } else {
            setErro("Você não tem permissão para acessar pedidos.");
          }
        } else {
          setErro(
            error instanceof ApiError ? error.message : "Não foi possível carregar os pedidos. Tente novamente.",
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [logout],
  );

  useEffect(() => {
    void carregarRestaurantes();
    void carregarPedidos(restauranteIdEscopo, null, 0);
  }, [carregarRestaurantes, carregarPedidos, restauranteIdEscopo]);

  function handleFiltrarRestaurante(restauranteId: number | null) {
    setFiltroRestauranteId(restauranteId);
    void carregarPedidos(restauranteId, filtroStatus, 0);
  }

  function handleFiltrarStatus(statusPedido: StatusPedido | null) {
    setFiltroStatus(statusPedido);
    void carregarPedidos(filtroRestauranteId, statusPedido, 0);
  }

  function handlePaginaAnterior() {
    void carregarPedidos(filtroRestauranteId, filtroStatus, pagina - 1);
  }

  function handleProximaPagina() {
    void carregarPedidos(filtroRestauranteId, filtroStatus, pagina + 1);
  }

  async function handleVerDetalhes(pedidoId: number) {
    setErroDetalhe(null);
    setCarregandoDetalhe(true);
    try {
      const detalhe = await buscarPedido(pedidoId);
      setPedidoDetalhe(detalhe);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        void logout();
        setErro("Sessão expirada. Faça login novamente.");
        setSemAutorizacao(true);
      } else if (error instanceof ApiError && error.status === 403) {
        setErroDetalhe("Você não tem permissão para acessar este pedido.");
      } else if (error instanceof ApiError && error.status === 404) {
        setErroDetalhe("Pedido não encontrado.");
      } else {
        setErroDetalhe(
          error instanceof ApiError ? error.message : "Não foi possível carregar os detalhes do pedido.",
        );
      }
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  return (
    <>
      <div className="caixa-toolbar">
        <Button type="button" onClick={() => void carregarPedidos(filtroRestauranteId, filtroStatus, pagina)} loading={loading}>
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
                onClick={() => handleFiltrarRestaurante(null)}
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
                  onClick={() => handleFiltrarRestaurante(restaurante.id)}
                >
                  {restaurante.nome}
                </button>
              ))}
            </div>
          </div>
        )
      )}

      <div className="dispositivo-form__tipo admin-filtro-restaurante">
        <span className="dispositivo-form__tipo-rotulo">Filtrar por status</span>
        <div className="dispositivo-form__tipo-opcoes">
          <button
            type="button"
            className={"dispositivo-form__tipo-botao" + (filtroStatus === null ? " dispositivo-form__tipo-botao--ativo" : "")}
            aria-pressed={filtroStatus === null}
            onClick={() => handleFiltrarStatus(null)}
          >
            Todos
          </button>
          {STATUS_FILTRAVEIS.map((status) => (
            <button
              key={status}
              type="button"
              className={
                "dispositivo-form__tipo-botao" + (filtroStatus === status ? " dispositivo-form__tipo-botao--ativo" : "")
              }
              aria-pressed={filtroStatus === status}
              onClick={() => handleFiltrarStatus(status)}
            >
              {getPedidoStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <div className="totem-estado totem-estado--erro">
          <ErrorMessage message={erro} />
          {semAutorizacao ? (
            <Button type="button" onClick={() => navigate("/login")}>
              Ir para login
            </Button>
          ) : (
            <Button type="button" onClick={() => void carregarPedidos(filtroRestauranteId, filtroStatus, pagina)}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {!semAutorizacao && !erro && (
        <>
          {pedidoDetalhe && (
            <PedidoAdminDetalhe pedido={pedidoDetalhe} onFechar={() => setPedidoDetalhe(null)} />
          )}

          {carregandoDetalhe && <p className="totem-estado">Carregando detalhes do pedido...</p>}
          <ErrorMessage message={erroDetalhe} />

          {loading && <p className="totem-estado">Carregando pedidos...</p>}

          {!loading && pedidos.length === 0 && <p className="totem-estado">Nenhum pedido encontrado.</p>}

          {!loading && pedidos.length > 0 && !pedidoDetalhe && (
            <>
              <div className="caixa-lista">
                {pedidos.map((pedido) => (
                  <PedidoAdminCard
                    key={pedido.pedidoId}
                    pedido={pedido}
                    mostrarRestaurante={!adminRestaurante}
                    onVerDetalhes={handleVerDetalhes}
                  />
                ))}
              </div>

              <div className="admin-pedidos-paginacao">
                <span className="admin-pedidos-paginacao__resumo">
                  Página {pagina + 1} de {Math.max(totalPaginas, 1)} — Total: {totalElementos} pedidos
                </span>
                <div className="admin-pedidos-paginacao__acoes">
                  <Button type="button" onClick={handlePaginaAnterior} disabled={primeiraPagina || loading}>
                    Anterior
                  </Button>
                  <Button type="button" onClick={handleProximaPagina} disabled={ultimaPagina || loading}>
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
