import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AtualizarRestauranteRequest, CriarRestauranteRequest, RestauranteAdminResponse } from "../../../types/restaurante";
import { focarPrimeiroErro } from "../../../utils/validacaoFormulario";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { Input } from "../../ui/Input";

type CampoRestaurante = "nome" | "cnpj" | "endereco";
const ORDEM_CAMPOS: readonly CampoRestaurante[] = ["nome", "cnpj", "endereco"];

interface RestauranteFormProps {
  restauranteEmEdicao: RestauranteAdminResponse | null;
  onCriar: (request: CriarRestauranteRequest) => void;
  onAtualizar: (id: number, request: AtualizarRestauranteRequest) => void;
  onCancelarEdicao: () => void;
  salvando: boolean;
  erro: string | null;
  /** TASK-115: erros de campo vindos da API (`errors[]` do backend), mapeados pela página. */
  errosCampoApi?: Partial<Record<CampoRestaurante, string>>;
}

export function RestauranteForm({
  restauranteEmEdicao,
  onCriar,
  onAtualizar,
  onCancelarEdicao,
  salvando,
  erro,
  errosCampoApi,
}: RestauranteFormProps) {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [erros, setErros] = useState<Partial<Record<CampoRestaurante, string>>>({});

  const nomeRef = useRef<HTMLInputElement>(null);
  const cnpjRef = useRef<HTMLInputElement>(null);
  const enderecoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (restauranteEmEdicao) {
      setNome(restauranteEmEdicao.nome);
      setCnpj(restauranteEmEdicao.cnpj);
      setEndereco(restauranteEmEdicao.endereco ?? "");
    } else {
      setNome("");
      setCnpj("");
      setEndereco("");
    }
    setErros({});
  }, [restauranteEmEdicao]);

  function validar(): Partial<Record<CampoRestaurante, string>> {
    const proximosErros: Partial<Record<CampoRestaurante, string>> = {};

    if (!nome.trim()) {
      proximosErros.nome = "Informe o nome do restaurante.";
    } else if (nome.trim().length > 200) {
      proximosErros.nome = "O nome deve ter no máximo 200 caracteres.";
    }

    const cnpjLimpo = cnpj.replace(/\D/g, "");
    if (!cnpjLimpo) {
      proximosErros.cnpj = "Informe o CNPJ.";
    } else if (cnpjLimpo.length !== 14) {
      proximosErros.cnpj = "Informe um CNPJ válido com 14 dígitos (só números, sem pontuação).";
    }

    if (endereco.trim().length > 500) {
      proximosErros.endereco = "O endereço deve ter no máximo 500 caracteres.";
    }

    return proximosErros;
  }

  /** Revalida só o campo alterado, quando ele já estava marcado como inválido (TASK-115). */
  function revalidarSeNecessario(campo: CampoRestaurante) {
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
      focarPrimeiroErro(ORDEM_CAMPOS, proximosErros, { nome: nomeRef, cnpj: cnpjRef, endereco: enderecoRef });
      return;
    }

    const cnpjLimpo = cnpj.replace(/\D/g, "");
    const request = {
      nome: nome.trim(),
      cnpj: cnpjLimpo,
      ...(endereco.trim() ? { endereco: endereco.trim() } : {}),
    };

    if (restauranteEmEdicao) {
      onAtualizar(restauranteEmEdicao.id, request);
    } else {
      onCriar(request);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="dispositivo-form" noValidate>
      <Input
        id="nomeRestaurante"
        ref={nomeRef}
        label="Nome"
        value={nome}
        onChange={(event) => {
          setNome(event.target.value);
          revalidarSeNecessario("nome");
        }}
        placeholder="Ex.: Totem Burger"
        disabled={salvando}
        error={erros.nome ?? errosCampoApi?.nome}
      />

      <Input
        id="cnpjRestaurante"
        ref={cnpjRef}
        label="CNPJ"
        value={cnpj}
        onChange={(event) => {
          setCnpj(event.target.value);
          revalidarSeNecessario("cnpj");
        }}
        placeholder="Ex.: 12345678000199"
        disabled={salvando}
        error={erros.cnpj ?? errosCampoApi?.cnpj}
      />

      <Input
        id="enderecoRestaurante"
        ref={enderecoRef}
        label="Endereço (opcional)"
        value={endereco}
        onChange={(event) => {
          setEndereco(event.target.value);
          revalidarSeNecessario("endereco");
        }}
        placeholder="Ex.: Rua Teste, 100"
        disabled={salvando}
        error={erros.endereco ?? errosCampoApi?.endereco}
      />

      <ErrorMessage message={erro} />

      <div className="dispositivo-form__acoes">
        <Button type="submit" loading={salvando}>
          {restauranteEmEdicao ? "Salvar alterações" : "Cadastrar restaurante"}
        </Button>

        <Button type="button" variant="secondary" onClick={onCancelarEdicao} disabled={salvando}>
          {restauranteEmEdicao ? "Cancelar edição" : "Cancelar"}
        </Button>
      </div>
    </form>
  );
}
