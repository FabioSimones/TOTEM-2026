import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { AdminVoltarLink } from "../../components/admin/AdminVoltarLink";
import { UsuarioCard } from "../../components/admin/usuarios/UsuarioCard";
import { UsuarioForm } from "../../components/admin/usuarios/UsuarioForm";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import {
  alterarSenhaUsuario,
  ativarUsuario,
  atualizarUsuario,
  criarUsuario,
  desativarUsuario,
  listarUsuarios,
} from "../../services/adminUsuarioService";
import { listarRestaurantes } from "../../services/adminRestauranteService";
import { clearSession, getAccessToken, getStoredUsuario } from "../../services/tokenStorage";
import { ApiError } from "../../types/api";
import type { RestauranteAdminResponse } from "../../types/restaurante";
import type { AtualizarUsuarioRequest, CriarUsuarioRequest, UsuarioAdminResponse } from "../../types/usuario";

export function AdminUsuariosPage() {
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState<RestauranteAdminResponse[]>([]);
  const [erroRestaurantes, setErroRestaurantes] = useState<string | null>(null);

  const [usuarios, setUsuarios] = useState<UsuarioAdminResponse[]>([]);
  const [filtroRestauranteId, setFiltroRestauranteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAutorizacao, setSemAutorizacao] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UsuarioAdminResponse | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const [acoesEmAndamento, setAcoesEmAndamento] = useState<Set<number>>(new Set());
  const [errosAcao, setErrosAcao] = useState<Record<number, string | null>>({});

  const carregarRestaurantes = useCallback(async () => {
    setErroRestaurantes(null);
    try {
      const response = await listarRestaurantes();
      setRestaurantes(response);
    } catch {
      // Best-effort: sem lista de restaurantes o formulário fica restrito a
      // SUPER_ADMIN, mas a listagem/edição/ativação de usuários segue normalmente.
      setErroRestaurantes("Não foi possível carregar a lista de restaurantes.");
    }
  }, []);

  const carregarUsuarios = useCallback(async (restauranteId: number | null) => {
    setLoading(true);
    setErro(null);
    setSemAutorizacao(false);
    setMensagemSucesso(null);

    try {
      const response = await listarUsuarios(restauranteId ?? undefined);
      setUsuarios(response);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setSemAutorizacao(true);
        if (error.status === 401) {
          clearSession();
          setErro("Sessão expirada. Faça login novamente.");
        } else {
          setErro("Você não tem permissão para acessar usuários.");
        }
      } else {
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os usuários. Tente novamente.",
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
    void carregarRestaurantes();
    void carregarUsuarios(null);
  }, [navigate, carregarRestaurantes, carregarUsuarios]);

  function handleFiltrar(restauranteId: number | null) {
    setFiltroRestauranteId(restauranteId);
    void carregarUsuarios(restauranteId);
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
      setErrosAcao((atual) => ({ ...atual, [id]: "Usuário não encontrado." }));
    } else if (error instanceof ApiError && error.status === 400) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message || mensagemPadrao }));
    } else if (error instanceof ApiError) {
      setErrosAcao((atual) => ({ ...atual, [id]: error.message }));
    } else {
      setErrosAcao((atual) => ({ ...atual, [id]: mensagemPadrao }));
    }
  }, []);

  const handleCriar = useCallback(
    async (request: CriarUsuarioRequest) => {
      setErroSalvar(null);
      setSalvando(true);

      try {
        const response = await criarUsuario(request);
        await carregarUsuarios(filtroRestauranteId);
        setMensagemSucesso(`Usuário "${response.nome}" cadastrado.`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Faça login novamente.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroSalvar("Você não tem permissão para cadastrar usuários.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroSalvar("Restaurante não encontrado.");
        } else if (error instanceof ApiError && error.status === 400) {
          setErroSalvar(error.message || "Dados inválidos. O email pode já estar em uso.");
        } else if (error instanceof ApiError) {
          setErroSalvar(error.message);
        } else {
          setErroSalvar("Não foi possível cadastrar o usuário. Tente novamente.");
        }
      } finally {
        setSalvando(false);
      }
    },
    [carregarUsuarios, filtroRestauranteId],
  );

  const handleAtualizar = useCallback(
    async (id: number, request: AtualizarUsuarioRequest) => {
      setErroSalvar(null);
      setSalvando(true);

      try {
        const response = await atualizarUsuario(id, request);
        await carregarUsuarios(filtroRestauranteId);
        setUsuarioEmEdicao(null);
        setMensagemSucesso(`Usuário "${response.nome}" atualizado.`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          setSemAutorizacao(true);
          setErro("Sessão expirada. Faça login novamente.");
        } else if (error instanceof ApiError && error.status === 403) {
          setErroSalvar("Você não tem permissão para editar usuários.");
        } else if (error instanceof ApiError && error.status === 404) {
          setErroSalvar("Usuário ou restaurante não encontrado.");
        } else if (error instanceof ApiError && error.status === 400) {
          setErroSalvar(error.message || "Dados inválidos. O email pode já estar em uso.");
        } else if (error instanceof ApiError) {
          setErroSalvar(error.message);
        } else {
          setErroSalvar("Não foi possível atualizar o usuário. Tente novamente.");
        }
      } finally {
        setSalvando(false);
      }
    },
    [carregarUsuarios, filtroRestauranteId],
  );

  const handleAtivar = useCallback(
    async (id: number) => {
      setErrosAcao((atual) => ({ ...atual, [id]: null }));
      marcarAcaoEmAndamento(id, true);

      try {
        const response = await ativarUsuario(id);
        await carregarUsuarios(filtroRestauranteId);
        setMensagemSucesso(`Usuário "${response.nome}" ativado.`);
      } catch (error) {
        tratarErroAcao(id, error, "Não foi possível ativar o usuário. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(id, false);
      }
    },
    [carregarUsuarios, filtroRestauranteId, marcarAcaoEmAndamento, tratarErroAcao],
  );

  const handleDesativar = useCallback(
    async (id: number) => {
      setErrosAcao((atual) => ({ ...atual, [id]: null }));
      marcarAcaoEmAndamento(id, true);

      try {
        const response = await desativarUsuario(id);
        await carregarUsuarios(filtroRestauranteId);
        setMensagemSucesso(`Usuário "${response.nome}" desativado.`);
      } catch (error) {
        tratarErroAcao(id, error, "Não foi possível desativar o usuário. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(id, false);
      }
    },
    [carregarUsuarios, filtroRestauranteId, marcarAcaoEmAndamento, tratarErroAcao],
  );

  const handleAlterarSenha = useCallback(
    async (id: number, novaSenha: string) => {
      setErrosAcao((atual) => ({ ...atual, [id]: null }));
      marcarAcaoEmAndamento(id, true);

      try {
        const response = await alterarSenhaUsuario(id, { novaSenha });
        await carregarUsuarios(filtroRestauranteId);
        setMensagemSucesso(`Senha do usuário "${response.nome}" alterada.`);
      } catch (error) {
        tratarErroAcao(id, error, "Não foi possível alterar a senha. Tente novamente.");
      } finally {
        marcarAcaoEmAndamento(id, false);
      }
    },
    [carregarUsuarios, filtroRestauranteId, marcarAcaoEmAndamento, tratarErroAcao],
  );

  function handleEditar(usuario: UsuarioAdminResponse) {
    setErroSalvar(null);
    setUsuarioEmEdicao(usuario);
  }

  function handleCancelarEdicao() {
    setErroSalvar(null);
    setUsuarioEmEdicao(null);
  }

  return (
    <AppLayout title="Usuários" description="Cadastro e gestão dos usuários administrativos do sistema.">
      <AdminVoltarLink />

      <div className="caixa-toolbar">
        <Button type="button" onClick={() => void carregarUsuarios(filtroRestauranteId)} loading={loading}>
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

      {erroRestaurantes && <ErrorMessage message={erroRestaurantes} />}

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
            <Button type="button" onClick={() => void carregarUsuarios(filtroRestauranteId)}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {!semAutorizacao && (
        <>
          <UsuarioForm
            usuarioEmEdicao={usuarioEmEdicao}
            restaurantes={restaurantes}
            restauranteSelecionadoPadrao={filtroRestauranteId}
            onCriar={handleCriar}
            onAtualizar={handleAtualizar}
            onCancelarEdicao={handleCancelarEdicao}
            salvando={salvando}
            erro={erroSalvar}
          />

          {loading && <p className="totem-estado">Carregando usuários...</p>}

          {!loading && !erro && usuarios.length === 0 && (
            <p className="totem-estado">Nenhum usuário cadastrado.</p>
          )}

          {!loading && !erro && usuarios.length > 0 && (
            <div className="caixa-lista">
              {usuarios.map((usuario) => (
                <UsuarioCard
                  key={usuario.id}
                  usuario={usuario}
                  restaurantes={restaurantes}
                  executando={acoesEmAndamento.has(usuario.id)}
                  erro={errosAcao[usuario.id] ?? null}
                  onEditar={handleEditar}
                  onAtivar={handleAtivar}
                  onDesativar={handleDesativar}
                  onAlterarSenha={handleAlterarSenha}
                />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
