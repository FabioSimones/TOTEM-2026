import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import type { AtualizarUsuarioRequest, CriarUsuarioRequest, PerfilUsuario, UsuarioAdminResponse } from "../../../types/usuario";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { Input } from "../../ui/Input";

const PERFIS: { valor: PerfilUsuario; rotulo: string }[] = [
  { valor: "SUPER_ADMIN", rotulo: "Super administrador" },
  { valor: "ADMIN_RESTAURANTE", rotulo: "Administrador do restaurante" },
  { valor: "OPERADOR_CAIXA", rotulo: "Operador de caixa" },
  { valor: "OPERADOR_COZINHA", rotulo: "Operador de cozinha" },
];

interface UsuarioFormProps {
  usuarioEmEdicao: UsuarioAdminResponse | null;
  restaurantes: RestauranteAdminResponse[];
  restauranteSelecionadoPadrao: number | null;
  /**
   * Presente quando o usuário autenticado é ADMIN_RESTAURANTE (TASK-090): trava o formulário no
   * restaurante do usuário, sem seletor — o backend já rejeitaria qualquer outro (403). Mesmo
   * padrão de `DispositivoForm.restauranteFixo` (TASK-059).
   */
  restauranteFixo?: { id: number; rotulo: string } | null;
  /**
   * Restringe os perfis exibidos/atribuíveis no formulário (TASK-090). Ausente/undefined = todos
   * os perfis (comportamento de SUPER_ADMIN). Para ADMIN_RESTAURANTE, o backend só aceita
   * OPERADOR_CAIXA/OPERADOR_COZINHA — o front espelha isso para não gerar um 403 evitável.
   */
  perfisPermitidos?: PerfilUsuario[];
  onCriar: (request: CriarUsuarioRequest) => void;
  onAtualizar: (id: number, request: AtualizarUsuarioRequest) => void;
  onCancelarEdicao: () => void;
  salvando: boolean;
  erro: string | null;
}

export function UsuarioForm({
  usuarioEmEdicao,
  restaurantes,
  restauranteSelecionadoPadrao,
  restauranteFixo,
  perfisPermitidos,
  onCriar,
  onAtualizar,
  onCancelarEdicao,
  salvando,
  erro,
}: UsuarioFormProps) {
  const perfisExibidos = perfisPermitidos ? PERFIS.filter((item) => perfisPermitidos.includes(item.valor)) : PERFIS;

  const [restauranteId, setRestauranteId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario>(perfisExibidos[0]?.valor ?? "OPERADOR_CAIXA");
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  useEffect(() => {
    if (usuarioEmEdicao) {
      setRestauranteId(usuarioEmEdicao.restauranteId);
      setNome(usuarioEmEdicao.nome);
      setEmail(usuarioEmEdicao.email);
      setPerfil(usuarioEmEdicao.perfil);
    } else {
      setRestauranteId(restauranteFixo?.id ?? restauranteSelecionadoPadrao ?? restaurantes[0]?.id ?? null);
      setNome("");
      setEmail("");
      setSenha("");
      setPerfil(perfisExibidos[0]?.valor ?? "OPERADOR_CAIXA");
    }
    setErroValidacao(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioEmEdicao, restauranteSelecionadoPadrao, restauranteFixo, restaurantes]);

  const restauranteIdEfetivo = restauranteFixo?.id ?? restauranteId;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nome.trim()) {
      setErroValidacao("Informe o nome do usuário.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErroValidacao("Informe um email válido.");
      return;
    }
    if (!usuarioEmEdicao && senha.trim().length < 8) {
      setErroValidacao("Informe uma senha com no mínimo 8 caracteres.");
      return;
    }
    if (perfil !== "SUPER_ADMIN" && !restauranteIdEfetivo) {
      setErroValidacao("Selecione um restaurante para este perfil.");
      return;
    }

    setErroValidacao(null);

    const restauranteIdFinal = perfil === "SUPER_ADMIN" ? undefined : (restauranteIdEfetivo as number);

    if (usuarioEmEdicao) {
      onAtualizar(usuarioEmEdicao.id, {
        restauranteId: restauranteIdFinal,
        nome: nome.trim(),
        email: email.trim(),
        perfil,
      });
    } else {
      onCriar({
        restauranteId: restauranteIdFinal,
        nome: nome.trim(),
        email: email.trim(),
        senha,
        perfil,
      });
    }
  }

  if (!restauranteFixo && perfil !== "SUPER_ADMIN" && restaurantes.length === 0) {
    return (
      <div className="dispositivo-form">
        <h2 className="dispositivo-form__titulo">Cadastrar usuário</h2>
        <p className="totem-estado">
          Cadastre um restaurante antes de criar usuários que não sejam SUPER_ADMIN — veja{" "}
          <Link to="/admin/restaurantes">Admin — Restaurantes</Link>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="dispositivo-form">
      <h2 className="dispositivo-form__titulo">
        {usuarioEmEdicao ? `Editar usuário — ${usuarioEmEdicao.nome}` : "Cadastrar usuário"}
      </h2>

      <div className="dispositivo-form__tipo">
        <span className="dispositivo-form__tipo-rotulo">Perfil</span>
        <div className="dispositivo-form__tipo-opcoes">
          {perfisExibidos.map((item) => (
            <button
              key={item.valor}
              type="button"
              className={"dispositivo-form__tipo-botao" + (perfil === item.valor ? " dispositivo-form__tipo-botao--ativo" : "")}
              aria-pressed={perfil === item.valor}
              onClick={() => setPerfil(item.valor)}
              disabled={salvando}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
      </div>

      {perfil !== "SUPER_ADMIN" && (
        <div className="dispositivo-form__tipo">
          <span className="dispositivo-form__tipo-rotulo">Restaurante</span>
          {restauranteFixo ? (
            <p className="dispositivo-form__restaurante-fixo">{restauranteFixo.rotulo}</p>
          ) : (
            <div className="dispositivo-form__tipo-opcoes">
              {restaurantes.map((restaurante) => (
                <button
                  key={restaurante.id}
                  type="button"
                  className={
                    "dispositivo-form__tipo-botao" +
                    (restauranteId === restaurante.id ? " dispositivo-form__tipo-botao--ativo" : "")
                  }
                  aria-pressed={restauranteId === restaurante.id}
                  onClick={() => setRestauranteId(restaurante.id)}
                  disabled={salvando}
                >
                  {restaurante.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Input
        id="nomeUsuario"
        label="Nome"
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        placeholder="Ex.: Maria Operadora"
        disabled={salvando}
      />

      <Input
        id="emailUsuario"
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Ex.: maria@totem.local"
        disabled={salvando}
      />

      {!usuarioEmEdicao && (
        <Input
          id="senhaUsuario"
          label="Senha"
          type="password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          placeholder="Mínimo 8 caracteres"
          disabled={salvando}
        />
      )}

      <ErrorMessage message={erroValidacao ?? erro} />

      <div className="dispositivo-form__acoes">
        <Button type="submit" loading={salvando}>
          {usuarioEmEdicao ? "Salvar alterações" : "Cadastrar usuário"}
        </Button>

        {usuarioEmEdicao && (
          <button type="button" className="dispositivo-form__cancelar" onClick={onCancelarEdicao} disabled={salvando}>
            Cancelar edição
          </button>
        )}
      </div>
    </form>
  );
}
