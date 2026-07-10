import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { CategoriaAdminResponse } from "../../../types/categoria";
import type { AtualizarProdutoRequest, CriarProdutoRequest, ProdutoAdminResponse } from "../../../types/produto";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import { isValidHttpUrl } from "../../../utils/url";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { Input } from "../../ui/Input";

interface ProdutoFormProps {
  produtoEmEdicao: ProdutoAdminResponse | null;
  restaurantes: RestauranteAdminResponse[];
  categorias: CategoriaAdminResponse[];
  restauranteSelecionadoPadrao: number | null;
  onCriar: (request: CriarProdutoRequest) => void;
  onAtualizar: (id: number, request: AtualizarProdutoRequest) => void;
  onCancelarEdicao: () => void;
  salvando: boolean;
  erro: string | null;
}

function AlternadorSimNao({
  rotulo,
  valor,
  onAlterar,
  desabilitado,
}: {
  rotulo: string;
  valor: boolean;
  onAlterar: (valor: boolean) => void;
  desabilitado: boolean;
}) {
  return (
    <div className="dispositivo-form__tipo">
      <span className="dispositivo-form__tipo-rotulo">{rotulo}</span>
      <div className="dispositivo-form__tipo-opcoes">
        <button
          type="button"
          className={"dispositivo-form__tipo-botao" + (valor ? " dispositivo-form__tipo-botao--ativo" : "")}
          aria-pressed={valor}
          onClick={() => onAlterar(true)}
          disabled={desabilitado}
        >
          Sim
        </button>
        <button
          type="button"
          className={"dispositivo-form__tipo-botao" + (!valor ? " dispositivo-form__tipo-botao--ativo" : "")}
          aria-pressed={!valor}
          onClick={() => onAlterar(false)}
          disabled={desabilitado}
        >
          Não
        </button>
      </div>
    </div>
  );
}

export function ProdutoForm({
  produtoEmEdicao,
  restaurantes,
  categorias,
  restauranteSelecionadoPadrao,
  onCriar,
  onAtualizar,
  onCancelarEdicao,
  salvando,
  erro,
}: ProdutoFormProps) {
  const [restauranteId, setRestauranteId] = useState<number | null>(null);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [ordemExibicao, setOrdemExibicao] = useState("");
  const [disponivel, setDisponivel] = useState(true);
  const [destaque, setDestaque] = useState(false);
  const [recomendado, setRecomendado] = useState(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [imagemFalhouAoCarregar, setImagemFalhouAoCarregar] = useState(false);

  useEffect(() => {
    if (produtoEmEdicao) {
      setRestauranteId(produtoEmEdicao.restauranteId);
      setCategoriaId(produtoEmEdicao.categoriaId);
      setNome(produtoEmEdicao.nome);
      setDescricao(produtoEmEdicao.descricao ?? "");
      setPreco(String(produtoEmEdicao.preco));
      setImagemUrl(produtoEmEdicao.imagemUrl ?? "");
      setOrdemExibicao(produtoEmEdicao.ordemExibicao != null ? String(produtoEmEdicao.ordemExibicao) : "");
      setRecomendado(produtoEmEdicao.recomendado);
    } else {
      const restauranteInicial = restauranteSelecionadoPadrao ?? restaurantes[0]?.id ?? null;
      setRestauranteId(restauranteInicial);
      setCategoriaId(categorias.find((c) => c.restauranteId === restauranteInicial)?.id ?? null);
      setNome("");
      setDescricao("");
      setPreco("");
      setImagemUrl("");
      setOrdemExibicao("");
      setDisponivel(true);
      setDestaque(false);
      setRecomendado(false);
    }
    setErroValidacao(null);
  }, [produtoEmEdicao, restauranteSelecionadoPadrao, restaurantes, categorias]);

  useEffect(() => {
    setImagemFalhouAoCarregar(false);
  }, [imagemUrl]);

  if (!produtoEmEdicao && restaurantes.length === 0) {
    return (
      <div className="dispositivo-form">
        <h2 className="dispositivo-form__titulo">Cadastrar produto</h2>
        <p className="totem-estado">
          Cadastre um restaurante antes de criar produtos — veja{" "}
          <Link to="/admin/restaurantes">Admin — Restaurantes</Link>.
        </p>
      </div>
    );
  }

  const categoriasDoRestaurante = categorias.filter((categoria) => categoria.restauranteId === restauranteId);
  const imagemUrlTrimmed = imagemUrl.trim();
  const imagemUrlEhValida = isValidHttpUrl(imagemUrlTrimmed);

  function handleSelecionarRestaurante(id: number) {
    setRestauranteId(id);
    setCategoriaId(categorias.find((categoria) => categoria.restauranteId === id)?.id ?? null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!produtoEmEdicao && !restauranteId) {
      setErroValidacao("Selecione um restaurante.");
      return;
    }
    if (!categoriaId) {
      setErroValidacao("Selecione uma categoria.");
      return;
    }
    if (!nome.trim()) {
      setErroValidacao("Informe o nome do produto.");
      return;
    }

    const precoNumero = Number(preco.replace(",", "."));
    if (!preco.trim() || Number.isNaN(precoNumero) || precoNumero <= 0) {
      setErroValidacao("Informe um preço válido maior que zero.");
      return;
    }

    const imagemUrlTrimmed = imagemUrl.trim();
    if (imagemUrlTrimmed && !isValidHttpUrl(imagemUrlTrimmed)) {
      setErroValidacao("Informe uma URL válida, começando com http:// ou https://.");
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
      categoriaId,
      nome: nome.trim(),
      preco: precoNumero,
      recomendado,
      ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
      ...(imagemUrl.trim() ? { imagemUrl: imagemUrl.trim() } : {}),
      ...(ordemExibicaoNumero !== undefined ? { ordemExibicao: ordemExibicaoNumero } : {}),
    };

    if (produtoEmEdicao) {
      onAtualizar(produtoEmEdicao.id, camposComuns);
    } else {
      onCriar({ restauranteId: restauranteId as number, disponivel, destaque, ...camposComuns });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="dispositivo-form">
      <h2 className="dispositivo-form__titulo">
        {produtoEmEdicao ? `Editar produto — ${produtoEmEdicao.nome}` : "Cadastrar produto"}
      </h2>

      <div className="dispositivo-form__tipo">
        <span className="dispositivo-form__tipo-rotulo">Restaurante</span>
        {produtoEmEdicao ? (
          <p className="dispositivo-form__restaurante-fixo">
            {restaurantes.find((r) => r.id === produtoEmEdicao.restauranteId)?.nome ??
              `#${produtoEmEdicao.restauranteId}`}{" "}
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
                onClick={() => handleSelecionarRestaurante(restaurante.id)}
                disabled={salvando}
              >
                {restaurante.nome}
              </button>
            ))}
          </div>
        )}
      </div>

      {categoriasDoRestaurante.length === 0 ? (
        <p className="totem-estado">
          Cadastre uma categoria para este restaurante antes de criar produtos — veja{" "}
          <Link to="/admin/categorias">Admin — Categorias</Link>.
        </p>
      ) : (
        <div className="dispositivo-form__tipo">
          <span className="dispositivo-form__tipo-rotulo">Categoria</span>
          <div className="dispositivo-form__tipo-opcoes">
            {categoriasDoRestaurante.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                className={
                  "dispositivo-form__tipo-botao" +
                  (categoriaId === categoria.id ? " dispositivo-form__tipo-botao--ativo" : "")
                }
                aria-pressed={categoriaId === categoria.id}
                onClick={() => setCategoriaId(categoria.id)}
                disabled={salvando}
              >
                {categoria.nome}
                {!categoria.ativa && " (inativa)"}
              </button>
            ))}
          </div>
        </div>
      )}

      <Input
        id="nomeProduto"
        label="Nome"
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        placeholder="Ex.: X-Burger"
        disabled={salvando}
      />

      <Input
        id="descricaoProduto"
        label="Descrição (opcional)"
        value={descricao}
        onChange={(event) => setDescricao(event.target.value)}
        placeholder="Ex.: Hambúrguer artesanal"
        disabled={salvando}
      />

      <Input
        id="precoProduto"
        label="Preço (R$)"
        type="number"
        min={0.01}
        step={0.01}
        value={preco}
        onChange={(event) => setPreco(event.target.value)}
        placeholder="Ex.: 29.90"
        disabled={salvando}
      />

      <Input
        id="imagemUrlProduto"
        label="URL da imagem (opcional)"
        value={imagemUrl}
        onChange={(event) => setImagemUrl(event.target.value)}
        placeholder="https://exemplo.com/produto.png"
        disabled={salvando}
      />
      <p className="produto-form__imagem-ajuda">Informe uma URL pública da imagem do produto.</p>

      {imagemUrlTrimmed && !imagemUrlEhValida && (
        <ErrorMessage message="URL inválida. Deve começar com http:// ou https://." />
      )}

      {imagemUrlTrimmed && imagemUrlEhValida && !imagemFalhouAoCarregar && (
        <img
          className="produto-form__imagem-preview"
          src={imagemUrlTrimmed}
          alt="Prévia da imagem do produto"
          onError={() => setImagemFalhouAoCarregar(true)}
          onLoad={() => setImagemFalhouAoCarregar(false)}
        />
      )}

      {imagemUrlTrimmed && imagemUrlEhValida && imagemFalhouAoCarregar && (
        <div className="produto-form__imagem-preview-fallback">Não foi possível carregar a prévia da imagem.</div>
      )}

      <Input
        id="ordemExibicaoProduto"
        label="Ordem de exibição (opcional)"
        type="number"
        min={0}
        value={ordemExibicao}
        onChange={(event) => setOrdemExibicao(event.target.value)}
        placeholder="Ex.: 1"
        disabled={salvando}
      />

      {!produtoEmEdicao && (
        <>
          <AlternadorSimNao rotulo="Disponível" valor={disponivel} onAlterar={setDisponivel} desabilitado={salvando} />
          <AlternadorSimNao rotulo="Destaque" valor={destaque} onAlterar={setDestaque} desabilitado={salvando} />
        </>
      )}

      <AlternadorSimNao rotulo="Recomendado" valor={recomendado} onAlterar={setRecomendado} desabilitado={salvando} />

      <ErrorMessage message={erroValidacao ?? erro} />

      <div className="dispositivo-form__acoes">
        <Button type="submit" loading={salvando}>
          {produtoEmEdicao ? "Salvar alterações" : "Cadastrar produto"}
        </Button>

        {produtoEmEdicao && (
          <button type="button" className="dispositivo-form__cancelar" onClick={onCancelarEdicao} disabled={salvando}>
            Cancelar edição
          </button>
        )}
      </div>
    </form>
  );
}
