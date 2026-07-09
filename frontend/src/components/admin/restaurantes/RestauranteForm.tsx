import { useEffect, useState, type FormEvent } from "react";
import type { AtualizarRestauranteRequest, CriarRestauranteRequest, RestauranteAdminResponse } from "../../../types/restaurante";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { Input } from "../../ui/Input";

interface RestauranteFormProps {
  restauranteEmEdicao: RestauranteAdminResponse | null;
  onCriar: (request: CriarRestauranteRequest) => void;
  onAtualizar: (id: number, request: AtualizarRestauranteRequest) => void;
  onCancelarEdicao: () => void;
  salvando: boolean;
  erro: string | null;
}

export function RestauranteForm({
  restauranteEmEdicao,
  onCriar,
  onAtualizar,
  onCancelarEdicao,
  salvando,
  erro,
}: RestauranteFormProps) {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

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
    setErroValidacao(null);
  }, [restauranteEmEdicao]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nome.trim()) {
      setErroValidacao("Informe o nome do restaurante.");
      return;
    }

    const cnpjLimpo = cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      setErroValidacao("Informe um CNPJ válido com 14 dígitos (só números, sem pontuação).");
      return;
    }

    setErroValidacao(null);

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
    <form onSubmit={handleSubmit} className="dispositivo-form">
      <h2 className="dispositivo-form__titulo">
        {restauranteEmEdicao ? `Editar restaurante — ${restauranteEmEdicao.nome}` : "Cadastrar restaurante"}
      </h2>

      <Input
        id="nomeRestaurante"
        label="Nome"
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        placeholder="Ex.: Totem Burger"
        disabled={salvando}
      />

      <Input
        id="cnpjRestaurante"
        label="CNPJ"
        value={cnpj}
        onChange={(event) => setCnpj(event.target.value)}
        placeholder="Ex.: 12345678000199"
        disabled={salvando}
      />

      <Input
        id="enderecoRestaurante"
        label="Endereço (opcional)"
        value={endereco}
        onChange={(event) => setEndereco(event.target.value)}
        placeholder="Ex.: Rua Teste, 100"
        disabled={salvando}
      />

      <ErrorMessage message={erroValidacao ?? erro} />

      <div className="dispositivo-form__acoes">
        <Button type="submit" loading={salvando}>
          {restauranteEmEdicao ? "Salvar alterações" : "Cadastrar restaurante"}
        </Button>

        {restauranteEmEdicao && (
          <button type="button" className="dispositivo-form__cancelar" onClick={onCancelarEdicao} disabled={salvando}>
            Cancelar edição
          </button>
        )}
      </div>
    </form>
  );
}
