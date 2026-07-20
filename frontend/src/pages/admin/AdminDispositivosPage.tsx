import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { AdminVoltarLink } from "../../components/admin/AdminVoltarLink";
import { DispositivoCard } from "../../components/admin/dispositivos/DispositivoCard";
import { DispositivoForm } from "../../components/admin/dispositivos/DispositivoForm";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { Modal } from "../../components/ui/Modal";
import {
  atualizarDispositivo,
  criarDispositivo,
  listarDispositivos,
  regenerarCodigoDispositivo,
  reativarDispositivo,
  revogarDispositivo,
} from "../../services/adminDispositivoService";
import { listarRestaurantes } from "../../services/adminRestauranteService";
import { useAuth } from "../../auth/useAuth";
import { ApiError } from "../../types/api";
import type { TipoDispositivo } from "../../types/auth";
import type {
  AtualizarDispositivoRequest,
  CriarDispositivoRequest,
  DispositivoAdminResponse,
  StatusOperacionalDispositivo,
} from "../../types/dispositivo";
import type { RestauranteAdminResponse } from "../../types/restaurante";
import { getRestauranteIdEscopo, isAdminRestaurante } from "../../utils/adminScope";
import { extrairErrosCampoApi } from "../../utils/apiFieldErrors";

const CAMPOS_DISPOSITIVO = ["restauranteId", "nome", "codigoIdentificacao"] as const;

const OPCOES_FILTRO_TIPO: { valor: TipoDispositivo; rotulo: string }[] = [
  { valor: "TOTEM", rotulo: "Totem" },
  { valor: "CAIXA", rotulo: "Caixa" },
  { valor: "COZINHA", rotulo: "Cozinha" },
  { valor: "ADMINISTRACAO", rotulo: "Administração" },
];

const OPCOES_FILTRO_STATUS: { valor: StatusOperacionalDispositivo; rotulo: string }[] = [
  { valor: "USADO_RECENTEMENTE", rotulo: "Usado recentemente" },
  { valor: "ATIVO", rotulo: "Ativo" },
  { valor: "NUNCA_USADO", rotulo: "Nunca usado" },
  { valor: "REVOGADO", rotulo: "Revogado" },
];

export function AdminDispositivosPage() {
  const navigate = useNavigate();
  const { user: usuario, logout } = useAuth();
  const adminRestaurante = isAdminRestaurante(usuario);
  const restauranteIdEscopo = getRestauranteIdEscopo(usuario);

  const [restaurantes, setRestaurantes] = useState<RestauranteAdminResponse[]>([]);
  const [erroRestaurantes, setErroRestaurantes] = useState<string | null>(null);

  const [dispositivos, setDispositivos] = useState<DispositivoAdminResponse[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<TipoDispositivo | null>(null);
  const [filtroStatusOperacional, setFiltroStatusOperacional] = useState<StatusOperacionalDispositivo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [dispositivoEmEdicao, setDispositivoEmEdicao] = useState<DispositivoAdminResponse | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [errosCampoApi, setErrosCampoApi] = useState<Partial<Record<(typeof CAMPOS_DISPOSITIVO)[number], string>>>({});

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
      // indisponível, mas a listagem/revogação/reativação de dispositivos segue normalmente.
      setErroRestaurantes("Não foi possível carregar a lista de restaurantes.");
    }
  }, [adminRestaurante]);

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
          void logout();
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
  }, [logout]);

  useEffect(() => {
    void carregarRestaurantes();
    void carregarDispositivos();
  }, [carregarRestaurantes, carregarDispositivos]);

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
      setErrosAcao((atual) => ({ ...atual, [id]: "Dispositivo não encontrado." }));
    } else if (error instanceof ApiError && error.status === 400) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message || mensagemPadrao }));
    } else if (error instanceof ApiError) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message }));
    } else {
      setErrosAcao((atual) => ({ ...atual, [id]: mensagemPadrao }));
    }
  }, [logout]);

  const handleCriarDispositivo = useCallback(
    async (request: CriarDispositivoRequest) => {
      setErroSalvar(null);
      setErrosCampoApi({});
      setSalvando(true);

      try {
        const response = await criarDispositivo(request);
        await carregarDispositivos();
        setModalAberto(false);
        setMensagemSucesso(
          `Dispositivo "${response.nome}" cadastrado. Código de ativação: ${response.codigoAtivacao}`,
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          void logout();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Faça login novamente.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroSalvar("Você não tem permissão para cadastrar dispositivos.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroSalvar("Restaurante não encontrado. Atualize a lista de restaurantes e tente novamente.");
        } else if (error instanceof ApiError && error.status === 400) {
          const camposApi = extrairErrosCampoApi(error, CAMPOS_DISPOSITIVO);
          if (Object.keys(camposApi).length > 0) {
            setErrosCampoApi(camposApi);
          } else {
            setErroSalvar(error.message || "Dados inválidos. O código de identificação pode já estar em uso.");
          }
        } else if (error instanceof ApiError) {
          setErroSalvar(error.message);
        } else {
          setErroSalvar("Não foi possível cadastrar o dispositivo. Tente novamente.");
        }
      } finally {
        setSalvando(false);
      }
    },
    [carregarDispositivos, logout],
  );

  const handleAtualizarDispositivo = useCallback(
    async (id: number, request: AtualizarDispositivoRequest) => {
      setErroSalvar(null);
      setErrosCampoApi({});
      setSalvando(true);

      try {
        const response = await atualizarDispositivo(id, request);
        await carregarDispositivos();
        setDispositivoEmEdicao(null);
        setModalAberto(false);
        setMensagemSucesso(`Dispositivo "${response.nome}" atualizado.`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          void logout();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Faça login novamente.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroSalvar("Você não tem permissão para editar dispositivos.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroSalvar("Dispositivo não encontrado.");
        } else if (error instanceof ApiError && error.status === 400) {
          const camposApi = extrairErrosCampoApi(error, CAMPOS_DISPOSITIVO);
          if (Object.keys(camposApi).length > 0) {
            setErrosCampoApi(camposApi);
          } else {
            setErroSalvar(error.message || "Dados inválidos. O código de identificação pode já estar em uso.");
          }
        } else if (error instanceof ApiError) {
          setErroSalvar(error.message);
        } else {
          setErroSalvar("Não foi possível atualizar o dispositivo. Tente novamente.");
        }
      } finally {
        setSalvando(false);
      }
    },
    [carregarDispositivos, logout],
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

  const handleRegenerarCodigo = useCallback(
    async (id: number) => {
      setErrosAcao((atual) => ({ ...atual, [id]: null }));
      marcarAcaoEmAndamento(id, true);

      try {
        const response = await regenerarCodigoDispositivo(id);
        await carregarDispositivos();
        setMensagemSucesso(
          `Novo código de ativação de "${response.nome}": ${response.codigoAtivacao}. ` +
            "Renovações anteriores deste dispositivo foram revogadas.",
        );
      } catch (error) {
        tratarErroAcao(id, error, "Não foi possível regenerar o código. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(id, false);
      }
    },
    [carregarDispositivos, marcarAcaoEmAndamento, tratarErroAcao],
  );

  function handleNovo() {
    setErroSalvar(null);
    setErrosCampoApi({});
    setDispositivoEmEdicao(null);
    setModalAberto(true);
  }

  function handleEditar(dispositivo: DispositivoAdminResponse) {
    setErroSalvar(null);
    setErrosCampoApi({});
    setDispositivoEmEdicao(dispositivo);
    setModalAberto(true);
  }

  function handleFecharModal() {
    setModalAberto(false);
    setErroSalvar(null);
    setErrosCampoApi({});
    setDispositivoEmEdicao(null);
  }

  const dispositivosFiltrados = dispositivos.filter(
    (dispositivo) =>
      (filtroTipo === null || dispositivo.tipoDispositivo === filtroTipo) &&
      (filtroStatusOperacional === null || dispositivo.statusOperacional === filtroStatusOperacional),
  );

  return (
    <AppLayout
      title="Dispositivos"
      description="Cadastro e gestão de dispositivos Totem, Caixa, Cozinha e Administração."
    >
      <AdminVoltarLink />

      <div className="caixa-toolbar">
        <Button type="button" onClick={handleNovo}>
          Novo dispositivo
        </Button>
        <Button type="button" onClick={() => void carregarDispositivos()} loading={loading}>
          Atualizar lista
        </Button>
      </div>

      {adminRestaurante ? (
        <p className="totem-estado admin-filtro-restaurante">
          Você está operando apenas no restaurante vinculado à sua conta.
        </p>
      ) : (
        erroRestaurantes && <ErrorMessage message={erroRestaurantes} />
      )}

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
            <Button type="button" onClick={() => void carregarDispositivos()}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {!semAutorizacao && (!adminRestaurante || restauranteIdEscopo != null) && (
        <>
          <Modal
            aberto={modalAberto}
            titulo={dispositivoEmEdicao ? `Editar dispositivo — ${dispositivoEmEdicao.nome}` : "Cadastrar dispositivo"}
            onFechar={handleFecharModal}
          >
            <DispositivoForm
              dispositivoEmEdicao={dispositivoEmEdicao}
              restaurantes={restaurantes}
              restauranteFixo={
                adminRestaurante && restauranteIdEscopo != null
                  ? { id: restauranteIdEscopo, rotulo: "Restaurante vinculado à sua conta" }
                  : null
              }
              onCriar={handleCriarDispositivo}
              onAtualizar={handleAtualizarDispositivo}
              onCancelarEdicao={handleFecharModal}
              salvando={salvando}
              erro={erroSalvar}
              errosCampoApi={errosCampoApi}
            />
          </Modal>

          {loading && <p className="totem-estado">Carregando dispositivos...</p>}

          {!loading && !erro && dispositivos.length > 0 && (
            <>
              <div className="dispositivo-form__tipo admin-filtro-restaurante">
                <span className="dispositivo-form__tipo-rotulo">Filtrar por tipo</span>
                <div className="dispositivo-form__tipo-opcoes">
                  <button
                    type="button"
                    className={"dispositivo-form__tipo-botao" + (filtroTipo === null ? " dispositivo-form__tipo-botao--ativo" : "")}
                    aria-pressed={filtroTipo === null}
                    onClick={() => setFiltroTipo(null)}
                  >
                    Todos
                  </button>
                  {OPCOES_FILTRO_TIPO.map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      className={
                        "dispositivo-form__tipo-botao" + (filtroTipo === opcao.valor ? " dispositivo-form__tipo-botao--ativo" : "")
                      }
                      aria-pressed={filtroTipo === opcao.valor}
                      onClick={() => setFiltroTipo(opcao.valor)}
                    >
                      {opcao.rotulo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dispositivo-form__tipo admin-filtro-restaurante">
                <span className="dispositivo-form__tipo-rotulo">Filtrar por status</span>
                <div className="dispositivo-form__tipo-opcoes">
                  <button
                    type="button"
                    className={
                      "dispositivo-form__tipo-botao" + (filtroStatusOperacional === null ? " dispositivo-form__tipo-botao--ativo" : "")
                    }
                    aria-pressed={filtroStatusOperacional === null}
                    onClick={() => setFiltroStatusOperacional(null)}
                  >
                    Todos
                  </button>
                  {OPCOES_FILTRO_STATUS.map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      className={
                        "dispositivo-form__tipo-botao" +
                        (filtroStatusOperacional === opcao.valor ? " dispositivo-form__tipo-botao--ativo" : "")
                      }
                      aria-pressed={filtroStatusOperacional === opcao.valor}
                      onClick={() => setFiltroStatusOperacional(opcao.valor)}
                    >
                      {opcao.rotulo}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {!loading && !erro && dispositivos.length === 0 && (
            <p className="totem-estado">Nenhum dispositivo cadastrado.</p>
          )}

          {!loading && !erro && dispositivos.length > 0 && dispositivosFiltrados.length === 0 && (
            <p className="totem-estado">Nenhum dispositivo encontrado para os filtros selecionados.</p>
          )}

          {!loading && !erro && dispositivosFiltrados.length > 0 && (
            <div className="caixa-lista">
              {dispositivosFiltrados.map((dispositivo) => (
                <DispositivoCard
                  key={dispositivo.id}
                  dispositivo={dispositivo}
                  executando={acoesEmAndamento.has(dispositivo.id)}
                  erro={errosAcao[dispositivo.id] ?? null}
                  onEditar={handleEditar}
                  onRevogar={handleRevogar}
                  onReativar={handleReativar}
                  onRegenerarCodigo={handleRegenerarCodigo}
                />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
