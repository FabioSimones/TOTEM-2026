import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import type { AtualizarCategoriaRequest, CategoriaAdminResponse, CriarCategoriaRequest } from "../../../types/categoria";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { Input } from "../../ui/Input";

interface CategoriaFormProps {
  categoriaEmEdicao: CategoriaAdminResponse | null;
  restaurantes: RestauranteAdminResponse[];
  restauranteSelecionadoPadrao: number | null;
  onCriar: (request: CriarCategoriaRequest) => void;
  onAtualizar: (id: number, request: AtualizarCategoriaRequest) => void;
  onCancelarEdicao: () => void;
  salvando: boolean;
  erro: string | null;
}

export function CategoriaForm({
  categoriaEmEdicao,
  restaurantes,
  restauranteSelecionadoPadrao,
  onCriar,
  onAtualizar,
  onCancelarEdicao,
  salvando,
  erro,
}: CategoriaFormProps) {
  const [restauranteId, setRestauranteId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ordemExibicao, setOrdemExibicao] = useState("");
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

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
    setErroValidacao(null);
  }, [categoriaEmEdicao, restauranteSelecionadoPadrao, restaurantes]);

  if (!categoriaEmEdicao && restaurantes.length === 0) {
    return (
      <div className="dispositivo-form">
        <h2 className="dispositivo-form__titulo">Cadastrar categoria</h2>
        <p className="totem-estado">
          Cadastre um restaurante antes de criar categorias — veja{" "}
          <Link to="/admin/restaurantes">Admin — Restaurantes</Link>.
        </p>
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoriaEmEdicao && !restauranteId) {
      setErroValidacao("Selecione um restaurante.");
      return;
    }
    if (!nome.trim()) {
      setErroValidacao("Informe o nome da categoria.");
      return;
    }

    let ordemExibicaoNumero: number | undefined;
    if (ordemExibicao.trim()) {
      const numero = Number(ordemExibicao);
      if (Number.isNaN(numero) || numero < 0) {
        setErroValidacao("Ordem de exibição deve ser um número zero ou positivo.");
        return;
      }
      ordemExibicaoNumero = numero;
    }

    setErroValidacao(null);

    const camposComuns = {
      nome: nome.trim(),
      ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
      ...(ordemExibicaoNumero !== undefined ? { ordemExibicao: ordemExibicaoNumero } : {}),
    };

    if (categoriaEmEdicao) {
      onAtualizar(categoriaEmEdicao.id, camposComuns);
    } else {
      onCriar({ restauranteId: restauranteId as number, ...camposComuns });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="dispositivo-form">
      <h2 className="dispositivo-form__titulo">
        {categoriaEmEdicao ? `Editar categoria — ${categoriaEmEdicao.nome}` : "Cadastrar categoria"}
      </h2>

      <div className="dispositivo-form__tipo">
        <span className="dispositivo-form__tipo-rotulo">Restaurante</span>
        {categoriaEmEdicao ? (
          <p className="dispositivo-form__restaurante-fixo">
            {restaurantes.find((r) => r.id === categoriaEmEdicao.restauranteId)?.nome ??
              `#${categoriaEmEdicao.restauranteId}`}{" "}
            (não pode ser alterado)
          </p>
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

      <Input
        id="nomeCategoria"
        label="Nome"
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        placeholder="Ex.: Lanches"
        disabled={salvando}
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
        label="Ordem de exibição (opcional)"
        type="number"
        min={0}
        value={ordemExibicao}
        onChange={(event) => setOrdemExibicao(event.target.value)}
        placeholder="Ex.: 1"
        disabled={salvando}
      />

      <ErrorMessage message={erroValidacao ?? erro} />

      <div className="dispositivo-form__acoes">
        <Button type="submit" loading={salvando}>
          {categoriaEmEdicao ? "Salvar alterações" : "Cadastrar categoria"}
        </Button>

        {categoriaEmEdicao && (
          <button type="button" className="dispositivo-form__cancelar" onClick={onCancelarEdicao} disabled={salvando}>
            Cancelar edição
          </button>
        )}
      </div>
    </form>
  );
}
