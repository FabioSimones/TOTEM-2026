import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import type { AtualizarCategoriaRequest, CategoriaAdminResponse, CriarCategoriaRequest } from "../../../types/categoria";
import { focarPrimeiroErro } from "../../../utils/validacaoFormulario";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { FieldError } from "../../ui/FieldError";
import { Input } from "../../ui/Input";

type CampoCategoria = "restauranteId" | "nome" | "ordemExibicao";
const ORDEM_CAMPOS: readonly CampoCategoria[] = ["restauranteId", "nome", "ordemExibicao"];

interface CategoriaFormProps {
  categoriaEmEdicao: CategoriaAdminResponse | null;
  restaurantes: RestauranteAdminResponse[];
  restauranteSelecionadoPadrao: number | null;
  /**
   * Presente quando o usuário autenticado é ADMIN_RESTAURANTE (TASK-059): trava o formulário
   * no restaurante do usuário, sem seletor — o backend já rejeitaria qualquer outro (403).
   */
  restauranteFixo?: { id: number; rotulo: string } | null;
  onCriar: (request: CriarCategoriaRequest) => void;
  onAtualizar: (id: number, request: AtualizarCategoriaRequest) => void;
  onCancelarEdicao: () => void;
  salvando: boolean;
  erro: string | null;
  /** TASK-115: erros de campo vindos da API (`errors[]` do backend), mapeados pela página. */
  errosCampoApi?: Partial<Record<CampoCategoria, string>>;
}

export function CategoriaForm({
  categoriaEmEdicao,
  restaurantes,
  restauranteSelecionadoPadrao,
  restauranteFixo,
  onCriar,
  onAtualizar,
  onCancelarEdicao,
  salvando,
  erro,
  errosCampoApi,
}: CategoriaFormProps) {
  const [restauranteId, setRestauranteId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ordemExibicao, setOrdemExibicao] = useState("");
  const [erros, setErros] = useState<Partial<Record<CampoCategoria, string>>>({});

  const restauranteGrupoRef = useRef<HTMLDivElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const ordemRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (categoriaEmEdicao) {
      setRestauranteId(categoriaEmEdicao.restauranteId);
      setNome(categoriaEmEdicao.nome);
      setDescricao(categoriaEmEdicao.descricao ?? "");
      setOrdemExibicao(categoriaEmEdicao.ordemExibicao != null ? String(categoriaEmEdicao.ordemExibicao) : "");
    } else {
      setRestauranteId(restauranteSelecionadoPadrao ?? restaurantes[0]?.id ?? null);
      setNome("");
      setDescricao("");
      setOrdemExibicao("");
    }
    setErros({});
  }, [categoriaEmEdicao, restauranteSelecionadoPadrao, restaurantes]);

  if (!restauranteFixo && !categoriaEmEdicao && restaurantes.length === 0) {
    return (
      <div className="dispositivo-form">
        <p className="totem-estado">
          Cadastre um restaurante antes de criar categorias — veja{" "}
          <Link to="/admin/restaurantes">Admin — Restaurantes</Link>.
        </p>
      </div>
    );
  }

  function validar(): Partial<Record<CampoCategoria, string>> {
    const proximosErros: Partial<Record<CampoCategoria, string>> = {};

    if (!restauranteFixo && !categoriaEmEdicao && !restauranteId) {
      proximosErros.restauranteId = "Selecione um restaurante.";
    }
    if (!nome.trim()) {
      proximosErros.nome = "Informe o nome da categoria.";
    } else if (nome.trim().length < 2 || nome.trim().length > 150) {
      proximosErros.nome = "O nome deve ter entre 2 e 150 caracteres.";
    }
    if (ordemExibicao.trim()) {
      const numero = Number(ordemExibicao);
      if (Number.isNaN(numero) || numero < 0) {
        proximosErros.ordemExibicao = "A ordem de exibição deve ser um número zero ou positivo.";
      }
    }

    return proximosErros;
  }

  function revalidarSeNecessario(campo: CampoCategoria) {
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
        ordemExibicao: ordemRef,
      });
      return;
    }

    const ordemExibicaoNumero = ordemExibicao.trim() ? Number(ordemExibicao) : undefined;
    const camposComuns = {
      nome: nome.trim(),
      ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
      ...(ordemExibicaoNumero !== undefined ? { ordemExibicao: ordemExibicaoNumero } : {}),
    };

    if (categoriaEmEdicao) {
      onAtualizar(categoriaEmEdicao.id, camposComuns);
    } else {
      onCriar({ restauranteId: (restauranteFixo?.id ?? restauranteId) as number, ...camposComuns });
    }
  }

  const erroRestaurante = erros.restauranteId ?? errosCampoApi?.restauranteId;

  return (
    <form onSubmit={handleSubmit} className="dispositivo-form" noValidate>
      <div className={"dispositivo-form__tipo" + (erroRestaurante ? " dispositivo-form__tipo--invalid" : "")}>
        <span className="dispositivo-form__tipo-rotulo">Restaurante</span>
        {restauranteFixo ? (
          <p className="dispositivo-form__restaurante-fixo">{restauranteFixo.rotulo}</p>
        ) : categoriaEmEdicao ? (
          <p className="dispositivo-form__restaurante-fixo">
            {restaurantes.find((r) => r.id === categoriaEmEdicao.restauranteId)?.nome ??
              `#${categoriaEmEdicao.restauranteId}`}{" "}
            (não pode ser alterado)
          </p>
        ) : (
          <div
            className="dispositivo-form__tipo-opcoes"
            ref={restauranteGrupoRef}
            tabIndex={-1}
            role="group"
            aria-label="Restaurante"
            aria-describedby={erroRestaurante ? "restauranteCategoria-error" : undefined}
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
        {!restauranteFixo && !categoriaEmEdicao && <FieldError id="restauranteCategoria-error" message={erroRestaurante} />}
      </div>

      <Input
        id="nomeCategoria"
        ref={nomeRef}
        label="Nome"
        value={nome}
        onChange={(event) => {
          setNome(event.target.value);
          revalidarSeNecessario("nome");
        }}
        placeholder="Ex.: Lanches"
        disabled={salvando}
        error={erros.nome ?? errosCampoApi?.nome}
      />

      <Input
        id="descricaoCategoria"
        label="Descrição (opcional)"
        value={descricao}
        onChange={(event) => setDescricao(event.target.value)}
        placeholder="Ex.: Hambúrgueres e sanduíches"
        disabled={salvando}
      />

      <Input
        id="ordemExibicaoCategoria"
        ref={ordemRef}
        label="Ordem de exibição (opcional)"
        type="number"
        min={0}
        value={ordemExibicao}
        onChange={(event) => {
          setOrdemExibicao(event.target.value);
          revalidarSeNecessario("ordemExibicao");
        }}
        placeholder="Ex.: 1"
        disabled={salvando}
        error={erros.ordemExibicao ?? errosCampoApi?.ordemExibicao}
      />

      <ErrorMessage message={erro} />

      <div className="dispositivo-form__acoes">
        <Button type="submit" loading={salvando}>
          {categoriaEmEdicao ? "Salvar alterações" : "Cadastrar categoria"}
        </Button>

        <Button type="button" variant="secondary" onClick={onCancelarEdicao} disabled={salvando}>
          {categoriaEmEdicao ? "Cancelar edição" : "Cancelar"}
        </Button>
      </div>
    </form>
  );
}
