import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import type { AtualizarUsuarioRequest, CriarUsuarioRequest, PerfilUsuario, UsuarioAdminResponse } from "../../../types/usuario";
import { focarPrimeiroErro, isValidEmail } from "../../../utils/validacaoFormulario";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { FieldError } from "../../ui/FieldError";
import { Input } from "../../ui/Input";

const PERFIS: { valor: PerfilUsuario; rotulo: string }[] = [
  { valor: "SUPER_ADMIN", rotulo: "Super administrador" },
  { valor: "ADMIN_RESTAURANTE", rotulo: "Administrador do restaurante" },
  { valor: "OPERADOR_CAIXA", rotulo: "Operador de caixa" },
  { valor: "OPERADOR_COZINHA", rotulo: "Operador de cozinha" },
];

type CampoUsuario = "nome" | "email" | "senha" | "restauranteId";
const ORDEM_CAMPOS: readonly CampoUsuario[] = ["nome", "email", "senha", "restauranteId"];

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
  /** TASK-115: erros de campo vindos da API (`errors[]` do backend), mapeados pela página. */
  errosCampoApi?: Partial<Record<CampoUsuario, string>>;
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
  errosCampoApi,
}: UsuarioFormProps) {
  const perfisExibidos = perfisPermitidos ? PERFIS.filter((item) => perfisPermitidos.includes(item.valor)) : PERFIS;

  const [restauranteId, setRestauranteId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario>(perfisExibidos[0]?.valor ?? "OPERADOR_CAIXA");
  const [erros, setErros] = useState<Partial<Record<CampoUsuario, string>>>({});

  const nomeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);
  const restauranteGrupoRef = useRef<HTMLDivElement>(null);

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
    setErros({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioEmEdicao, restauranteSelecionadoPadrao, restauranteFixo, restaurantes]);

  const restauranteIdEfetivo = restauranteFixo?.id ?? restauranteId;

  function validar(): Partial<Record<CampoUsuario, string>> {
    const proximosErros: Partial<Record<CampoUsuario, string>> = {};

    if (!nome.trim()) {
      proximosErros.nome = "Informe o nome do usuário.";
    } else if (nome.trim().length > 200) {
      proximosErros.nome = "O nome deve ter no máximo 200 caracteres.";
    }

    if (!email.trim()) {
      proximosErros.email = "Informe o e-mail do usuário.";
    } else if (!isValidEmail(email.trim())) {
      proximosErros.email = "Informe um e-mail válido, no formato nome@dominio.com.";
    } else if (email.trim().length > 255) {
      proximosErros.email = "O e-mail deve ter no máximo 255 caracteres.";
    }

    if (!usuarioEmEdicao) {
      if (!senha.trim()) {
        proximosErros.senha = "Informe uma senha.";
      } else if (senha.length < 8 || senha.length > 100) {
        proximosErros.senha = "A senha deve ter entre 8 e 100 caracteres.";
      }
    }

    if (perfil !== "SUPER_ADMIN" && !restauranteIdEfetivo) {
      proximosErros.restauranteId = "Selecione um restaurante para este perfil.";
    }

    return proximosErros;
  }

  function revalidarSeNecessario(campo: CampoUsuario) {
    if (!erros[campo]) {
      return;
    }
    const proximosErros = validar();
    setErros((atual) => ({ ...atual, [campo]: proximosErros[campo] }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const proximosErros = validar();
    setErros(proximosErros);

    if (Object.keys(proximosErros).length > 0) {
      focarPrimeiroErro(ORDEM_CAMPOS, proximosErros, {
        nome: nomeRef,
        email: emailRef,
        senha: senhaRef,
        restauranteId: restauranteGrupoRef,
      });
      return;
    }

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
        <p className="totem-estado">
          Cadastre um restaurante antes de criar usuários que não sejam SUPER_ADMIN — veja{" "}
          <Link to="/admin/restaurantes">Admin — Restaurantes</Link>.
        </p>
      </div>
    );
  }

  const erroRestaurante = erros.restauranteId ?? errosCampoApi?.restauranteId;

  return (
    <form onSubmit={handleSubmit} className="dispositivo-form" noValidate>
      <div className="dispositivo-form__tipo">
        <span className="dispositivo-form__tipo-rotulo">Perfil</span>
        <div className="dispositivo-form__tipo-opcoes">
          {perfisExibidos.map((item) => (
            <button
              key={item.valor}
              type="button"
              className={"dispositivo-form__tipo-botao" + (perfil === item.valor ? " dispositivo-form__tipo-botao--ativo" : "")}
              aria-pressed={perfil === item.valor}
              onClick={() => {
                setPerfil(item.valor);
                revalidarSeNecessario("restauranteId");
              }}
              disabled={salvando}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
      </div>

      {perfil !== "SUPER_ADMIN" && (
        <div className={"dispositivo-form__tipo" + (erroRestaurante ? " dispositivo-form__tipo--invalid" : "")}>
          <span className="dispositivo-form__tipo-rotulo">Restaurante</span>
          {restauranteFixo ? (
            <p className="dispositivo-form__restaurante-fixo">{restauranteFixo.rotulo}</p>
          ) : (
            <div
              className="dispositivo-form__tipo-opcoes"
              ref={restauranteGrupoRef}
              tabIndex={-1}
              role="group"
              aria-label="Restaurante"
              aria-describedby={erroRestaurante ? "restauranteUsuario-error" : undefined}
            >
              {restaurantes.map((restaurante) => (
                <button
                  key={restaurante.id}
                  type="button"
                  className={
                    "dispositivo-form__tipo-botao" +
                    (restauranteId === restaurante.id ? " dispositivo-form__tipo-botao--ativo" : "")
                  }
                  aria-pressed={restauranteId === restaurante.id}
                  onClick={() => {
                    setRestauranteId(restaurante.id);
                    revalidarSeNecessario("restauranteId");
                  }}
                  disabled={salvando}
                >
                  {restaurante.nome}
                </button>
              ))}
            </div>
          )}
          {!restauranteFixo && <FieldError id="restauranteUsuario-error" message={erroRestaurante} />}
        </div>
      )}

      <Input
        id="nomeUsuario"
        ref={nomeRef}
        label="Nome"
        value={nome}
        onChange={(event) => {
          setNome(event.target.value);
          revalidarSeNecessario("nome");
        }}
        placeholder="Ex.: Maria Operadora"
        disabled={salvando}
        error={erros.nome ?? errosCampoApi?.nome}
      />

      <Input
        id="emailUsuario"
        ref={emailRef}
        label="Email"
        type="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          revalidarSeNecessario("email");
        }}
        placeholder="Ex.: maria@totem.local"
        disabled={salvando}
        error={erros.email ?? errosCampoApi?.email}
      />

      {!usuarioEmEdicao && (
        <Input
          id="senhaUsuario"
          ref={senhaRef}
          label="Senha"
          type="password"
          value={senha}
          onChange={(event) => {
            setSenha(event.target.value);
            revalidarSeNecessario("senha");
          }}
          placeholder="Mínimo 8 caracteres"
          disabled={salvando}
          error={erros.senha ?? errosCampoApi?.senha}
        />
      )}

      <ErrorMessage message={erro} />

      <div className="dispositivo-form__acoes">
        <Button type="submit" loading={salvando}>
          {usuarioEmEdicao ? "Salvar alterações" : "Cadastrar usuário"}
        </Button>

        <Button type="button" variant="secondary" onClick={onCancelarEdicao} disabled={salvando}>
          {usuarioEmEdicao ? "Cancelar edição" : "Cancelar"}
        </Button>
      </div>
    </form>
  );
}
