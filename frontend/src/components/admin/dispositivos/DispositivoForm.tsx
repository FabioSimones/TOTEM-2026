import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { TipoDispositivo } from "../../../types/auth";
import type { AtualizarDispositivoRequest, CriarDispositivoRequest, DispositivoAdminResponse } from "../../../types/dispositivo";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import { focarPrimeiroErro } from "../../../utils/validacaoFormulario";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { FieldError } from "../../ui/FieldError";
import { Input } from "../../ui/Input";

type CampoDispositivo = "restauranteId" | "nome" | "codigoIdentificacao";
const ORDEM_CAMPOS: readonly CampoDispositivo[] = ["restauranteId", "nome", "codigoIdentificacao"];

interface DispositivoFormProps {
  dispositivoEmEdicao: DispositivoAdminResponse | null;
  restaurantes: RestauranteAdminResponse[];
  /**
   * Presente quando o usuário autenticado é ADMIN_RESTAURANTE (TASK-059): trava o formulário
   * no restaurante do usuário, sem seletor — o backend já rejeitaria qualquer outro (403).
   */
  restauranteFixo?: { id: number; rotulo: string } | null;
  onCriar: (request: CriarDispositivoRequest) => void;
  onAtualizar: (id: number, request: AtualizarDispositivoRequest) => void;
  onCancelarEdicao: () => void;
  salvando: boolean;
  erro: string | null;
  /** TASK-115: erros de campo vindos da API (`errors[]` do backend), mapeados pela página. */
  errosCampoApi?: Partial<Record<CampoDispositivo, string>>;
}

const OPCOES_TIPO: { valor: TipoDispositivo; rotulo: string }[] = [
  { valor: "TOTEM", rotulo: "Totem" },
  { valor: "CAIXA", rotulo: "Caixa" },
  { valor: "COZINHA", rotulo: "Cozinha" },
  { valor: "ADMINISTRACAO", rotulo: "Administração" },
];

export function DispositivoForm({
  dispositivoEmEdicao,
  restaurantes,
  restauranteFixo,
  onCriar,
  onAtualizar,
  onCancelarEdicao,
  salvando,
  erro,
  errosCampoApi,
}: DispositivoFormProps) {
  const [restauranteId, setRestauranteId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [codigoIdentificacao, setCodigoIdentificacao] = useState("");
  const [tipoDispositivo, setTipoDispositivo] = useState<TipoDispositivo>("TOTEM");
  const [erros, setErros] = useState<Partial<Record<CampoDispositivo, string>>>({});

  const restauranteGrupoRef = useRef<HTMLDivElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const codigoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dispositivoEmEdicao) {
      setRestauranteId(dispositivoEmEdicao.restauranteId);
      setNome(dispositivoEmEdicao.nome);
      setCodigoIdentificacao(dispositivoEmEdicao.codigoIdentificacao);
      setTipoDispositivo(dispositivoEmEdicao.tipoDispositivo);
    } else {
      setRestauranteId(restauranteFixo?.id ?? restaurantes[0]?.id ?? null);
      setNome("");
      setCodigoIdentificacao("");
      setTipoDispositivo("TOTEM");
    }
    setErros({});
  }, [dispositivoEmEdicao, restauranteFixo, restaurantes]);

  const restauranteIdEfetivo = restauranteFixo?.id ?? restauranteId;

  function validar(): Partial<Record<CampoDispositivo, string>> {
    const proximosErros: Partial<Record<CampoDispositivo, string>> = {};

    if (!restauranteFixo && !dispositivoEmEdicao && !restauranteId) {
      proximosErros.restauranteId = "Selecione um restaurante.";
    }
    if (!nome.trim()) {
      proximosErros.nome = "Informe o nome do dispositivo.";
    } else if (nome.trim().length > 200) {
      proximosErros.nome = "O nome deve ter no máximo 200 caracteres.";
    }
    if (!codigoIdentificacao.trim()) {
      proximosErros.codigoIdentificacao = "Informe o código de identificação.";
    } else if (codigoIdentificacao.trim().length > 100) {
      proximosErros.codigoIdentificacao = "O código de identificação deve ter no máximo 100 caracteres.";
    }

    return proximosErros;
  }

  function revalidarSeNecessario(campo: CampoDispositivo) {
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
        restauranteId: restauranteGrupoRef,
        nome: nomeRef,
        codigoIdentificacao: codigoRef,
      });
      return;
    }

    if (dispositivoEmEdicao) {
      onAtualizar(dispositivoEmEdicao.id, {
        nome: nome.trim(),
        codigoIdentificacao: codigoIdentificacao.trim(),
        tipoDispositivo,
      });
    } else {
      onCriar({
        restauranteId: restauranteIdEfetivo as number,
        nome: nome.trim(),
        codigoIdentificacao: codigoIdentificacao.trim(),
        tipoDispositivo,
      });
    }
  }

  if (!restauranteFixo && !dispositivoEmEdicao && restaurantes.length === 0) {
    return (
      <div className="dispositivo-form">
        <p className="totem-estado">
          Cadastre um restaurante antes de criar dispositivos — veja{" "}
          <Link to="/admin/restaurantes">Admin — Restaurantes</Link>.
        </p>
      </div>
    );
  }

  const erroRestaurante = erros.restauranteId ?? errosCampoApi?.restauranteId;

  return (
    <form onSubmit={handleSubmit} className="dispositivo-form" noValidate>
      <div className={"dispositivo-form__tipo" + (erroRestaurante ? " dispositivo-form__tipo--invalid" : "")}>
        <span className="dispositivo-form__tipo-rotulo">Restaurante</span>
        {restauranteFixo ? (
          <p className="dispositivo-form__restaurante-fixo">{restauranteFixo.rotulo}</p>
        ) : dispositivoEmEdicao ? (
          <p className="dispositivo-form__restaurante-fixo">
            {restaurantes.find((r) => r.id === dispositivoEmEdicao.restauranteId)?.nome ??
              `#${dispositivoEmEdicao.restauranteId}`}{" "}
            (não pode ser alterado)
          </p>
        ) : (
          <div
            className="dispositivo-form__tipo-opcoes"
            ref={restauranteGrupoRef}
            tabIndex={-1}
            role="group"
            aria-label="Restaurante"
            aria-describedby={erroRestaurante ? "restauranteDispositivo-error" : undefined}
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
        {!restauranteFixo && !dispositivoEmEdicao && <FieldError id="restauranteDispositivo-error" message={erroRestaurante} />}
      </div>

      <Input
        id="nomeDispositivo"
        ref={nomeRef}
        label="Nome"
        value={nome}
        onChange={(event) => {
          setNome(event.target.value);
          revalidarSeNecessario("nome");
        }}
        placeholder="Ex.: Totem 01"
        disabled={salvando}
        error={erros.nome ?? errosCampoApi?.nome}
      />

      <Input
        id="codigoIdentificacao"
        ref={codigoRef}
        label="Código de identificação"
        value={codigoIdentificacao}
        onChange={(event) => {
          setCodigoIdentificacao(event.target.value);
          revalidarSeNecessario("codigoIdentificacao");
        }}
        placeholder="Ex.: TOTEM_01"
        disabled={salvando}
        error={erros.codigoIdentificacao ?? errosCampoApi?.codigoIdentificacao}
      />

      <div className="dispositivo-form__tipo">
        <span className="dispositivo-form__tipo-rotulo">Tipo de dispositivo</span>
        <div className="dispositivo-form__tipo-opcoes">
          {OPCOES_TIPO.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={
                "dispositivo-form__tipo-botao" +
                (tipoDispositivo === opcao.valor ? " dispositivo-form__tipo-botao--ativo" : "")
              }
              aria-pressed={tipoDispositivo === opcao.valor}
              onClick={() => setTipoDispositivo(opcao.valor)}
              disabled={salvando}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      <ErrorMessage message={erro} />

      <div className="dispositivo-form__acoes">
        <Button type="submit" loading={salvando}>
          {dispositivoEmEdicao ? "Salvar alterações" : "Cadastrar dispositivo"}
        </Button>

        <Button type="button" variant="secondary" onClick={onCancelarEdicao} disabled={salvando}>
          {dispositivoEmEdicao ? "Cancelar edição" : "Cancelar"}
        </Button>
      </div>
    </form>
  );
}
