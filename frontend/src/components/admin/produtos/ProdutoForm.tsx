import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../../services/api";
import { uploadImagemProduto } from "../../../services/adminUploadService";
import type { CategoriaAdminResponse } from "../../../types/categoria";
import { ApiError } from "../../../types/api";
import type { AtualizarProdutoRequest, CriarProdutoRequest, ProdutoAdminResponse } from "../../../types/produto";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import { isValidHttpUrl } from "../../../utils/url";
import { focarPrimeiroErro } from "../../../utils/validacaoFormulario";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { FieldError } from "../../ui/FieldError";
import { Input } from "../../ui/Input";

const TIPOS_IMAGEM_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO_IMAGEM_BYTES = 5 * 1024 * 1024; // 5MB, mesmo limite do backend

type CampoProduto = "restauranteId" | "categoriaId" | "nome" | "preco" | "imagemUrl" | "ordemExibicao";
const ORDEM_CAMPOS: readonly CampoProduto[] = [
  "restauranteId",
  "categoriaId",
  "nome",
  "preco",
  "imagemUrl",
  "ordemExibicao",
];

interface ProdutoFormProps {
  produtoEmEdicao: ProdutoAdminResponse | null;
  restaurantes: RestauranteAdminResponse[];
  categorias: CategoriaAdminResponse[];
  restauranteSelecionadoPadrao: number | null;
  /**
   * Presente quando o usuário autenticado é ADMIN_RESTAURANTE (TASK-059): trava o formulário
   * no restaurante do usuário, sem seletor — o backend já rejeitaria qualquer outro (403).
   */
  restauranteFixo?: { id: number; rotulo: string } | null;
  onCriar: (request: CriarProdutoRequest) => void;
  onAtualizar: (id: number, request: AtualizarProdutoRequest) => void;
  onCancelarEdicao: () => void;
  salvando: boolean;
  erro: string | null;
  /** TASK-115: erros de campo vindos da API (`errors[]` do backend), mapeados pela página. */
  errosCampoApi?: Partial<Record<CampoProduto, string>>;
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
  restauranteFixo,
  onCriar,
  onAtualizar,
  onCancelarEdicao,
  salvando,
  erro,
  errosCampoApi,
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
  const [erros, setErros] = useState<Partial<Record<CampoProduto, string>>>({});
  const [imagemFalhouAoCarregar, setImagemFalhouAoCarregar] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [previewLocalUrl, setPreviewLocalUrl] = useState<string | null>(null);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erroUpload, setErroUpload] = useState<string | null>(null);

  const restauranteGrupoRef = useRef<HTMLDivElement>(null);
  const categoriaGrupoRef = useRef<HTMLDivElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const precoRef = useRef<HTMLInputElement>(null);
  const imagemUrlRef = useRef<HTMLInputElement>(null);
  const ordemRef = useRef<HTMLInputElement>(null);

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
      const restauranteInicial = restauranteFixo?.id ?? restauranteSelecionadoPadrao ?? restaurantes[0]?.id ?? null;
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
    setErros({});
    setArquivoSelecionado(null);
    setErroUpload(null);
  }, [produtoEmEdicao, restauranteSelecionadoPadrao, restauranteFixo, restaurantes, categorias]);

  useEffect(() => {
    setImagemFalhouAoCarregar(false);
  }, [imagemUrl]);

  // Revoga a URL local (URL.createObjectURL) ao trocar de arquivo ou desmontar, evitando vazamento de memória.
  useEffect(() => {
    if (!arquivoSelecionado) {
      setPreviewLocalUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(arquivoSelecionado);
    setPreviewLocalUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [arquivoSelecionado]);

  function handleSelecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setErroUpload(null);

    if (!file) {
      return;
    }
    if (!TIPOS_IMAGEM_ACEITOS.includes(file.type)) {
      setErroUpload("Envie uma imagem JPEG, PNG ou WEBP.");
      return;
    }
    if (file.size > TAMANHO_MAXIMO_IMAGEM_BYTES) {
      setErroUpload("A imagem deve ter no máximo 5MB.");
      return;
    }
    setArquivoSelecionado(file);
  }

  async function handleEnviarImagem() {
    if (!arquivoSelecionado) {
      return;
    }
    setErroUpload(null);
    setEnviandoImagem(true);
    try {
      const response = await uploadImagemProduto(arquivoSelecionado);
      setImagemUrl(`${API_BASE_URL}${response.url}`);
      setArquivoSelecionado(null);
      revalidarSeNecessario("imagemUrl");
    } catch (error) {
      setErroUpload(error instanceof ApiError ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setEnviandoImagem(false);
    }
  }

  if (!restauranteFixo && !produtoEmEdicao && restaurantes.length === 0) {
    return (
      <div className="dispositivo-form">
        <p className="totem-estado">
          Cadastre um restaurante antes de criar produtos — veja{" "}
          <Link to="/admin/restaurantes">Admin — Restaurantes</Link>.
        </p>
      </div>
    );
  }

  const restauranteIdEfetivo = restauranteFixo?.id ?? restauranteId;
  const categoriasDoRestaurante = categorias.filter((categoria) => categoria.restauranteId === restauranteIdEfetivo);
  const imagemUrlTrimmed = imagemUrl.trim();
  const imagemUrlEhValida = isValidHttpUrl(imagemUrlTrimmed);

  function handleSelecionarRestaurante(id: number) {
    setRestauranteId(id);
    setCategoriaId(categorias.find((categoria) => categoria.restauranteId === id)?.id ?? null);
    revalidarSeNecessario("restauranteId");
    revalidarSeNecessario("categoriaId");
  }

  function validar(): Partial<Record<CampoProduto, string>> {
    const proximosErros: Partial<Record<CampoProduto, string>> = {};

    if (!restauranteFixo && !produtoEmEdicao && !restauranteId) {
      proximosErros.restauranteId = "Selecione um restaurante.";
    }
    if (!categoriaId) {
      proximosErros.categoriaId = "Selecione uma categoria.";
    }
    if (!nome.trim()) {
      proximosErros.nome = "Informe o nome do produto.";
    } else if (nome.trim().length < 2 || nome.trim().length > 200) {
      proximosErros.nome = "O nome deve ter entre 2 e 200 caracteres.";
    }

    const precoNumero = Number(preco.replace(",", "."));
    if (!preco.trim() || Number.isNaN(precoNumero) || precoNumero <= 0) {
      proximosErros.preco = "Informe um preço válido maior que zero.";
    }

    const imagemUrlValidacao = imagemUrl.trim();
    if (imagemUrlValidacao) {
      if (!isValidHttpUrl(imagemUrlValidacao)) {
        proximosErros.imagemUrl = "Informe uma URL válida, começando com http:// ou https://.";
      } else if (imagemUrlValidacao.length > 500) {
        proximosErros.imagemUrl = "A URL deve ter no máximo 500 caracteres.";
      }
    }

    if (ordemExibicao.trim()) {
      const numero = Number(ordemExibicao);
      if (Number.isNaN(numero) || numero < 0) {
        proximosErros.ordemExibicao = "A ordem de exibição deve ser um número zero ou positivo.";
      }
    }

    return proximosErros;
  }

  function revalidarSeNecessario(campo: CampoProduto) {
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
        categoriaId: categoriaGrupoRef,
        nome: nomeRef,
        preco: precoRef,
        imagemUrl: imagemUrlRef,
        ordemExibicao: ordemRef,
      });
      return;
    }

    const precoNumero = Number(preco.replace(",", "."));
    let ordemExibicaoNumero: number | undefined;
    if (ordemExibicao.trim()) {
      ordemExibicaoNumero = Number(ordemExibicao);
    }

    const camposComuns = {
      categoriaId: categoriaId as number,
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
      onCriar({ restauranteId: restauranteIdEfetivo as number, disponivel, destaque, ...camposComuns });
    }
  }

  const erroRestaurante = erros.restauranteId ?? errosCampoApi?.restauranteId;
  const erroCategoria = erros.categoriaId ?? errosCampoApi?.categoriaId;
  const erroImagemUrl = erros.imagemUrl ?? errosCampoApi?.imagemUrl;

  return (
    <form onSubmit={handleSubmit} className="dispositivo-form" noValidate>
      <div className={"dispositivo-form__tipo" + (erroRestaurante ? " dispositivo-form__tipo--invalid" : "")}>
        <span className="dispositivo-form__tipo-rotulo">Restaurante</span>
        {restauranteFixo ? (
          <p className="dispositivo-form__restaurante-fixo">{restauranteFixo.rotulo}</p>
        ) : produtoEmEdicao ? (
          <p className="dispositivo-form__restaurante-fixo">
            {restaurantes.find((r) => r.id === produtoEmEdicao.restauranteId)?.nome ??
              `#${produtoEmEdicao.restauranteId}`}{" "}
            (não pode ser alterado)
          </p>
        ) : (
          <div
            className="dispositivo-form__tipo-opcoes"
            ref={restauranteGrupoRef}
            tabIndex={-1}
            role="group"
            aria-label="Restaurante"
            aria-describedby={erroRestaurante ? "restauranteProduto-error" : undefined}
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
                onClick={() => handleSelecionarRestaurante(restaurante.id)}
                disabled={salvando}
              >
                {restaurante.nome}
              </button>
            ))}
          </div>
        )}
        {!restauranteFixo && !produtoEmEdicao && <FieldError id="restauranteProduto-error" message={erroRestaurante} />}
      </div>

      {categoriasDoRestaurante.length === 0 ? (
        <p className="totem-estado">
          Cadastre uma categoria para este restaurante antes de criar produtos — veja{" "}
          <Link to="/admin/categorias">Admin — Categorias</Link>.
        </p>
      ) : (
        <div className={"dispositivo-form__tipo" + (erroCategoria ? " dispositivo-form__tipo--invalid" : "")}>
          <span className="dispositivo-form__tipo-rotulo">Categoria</span>
          <div
            className="dispositivo-form__tipo-opcoes"
            ref={categoriaGrupoRef}
            tabIndex={-1}
            role="group"
            aria-label="Categoria"
            aria-describedby={erroCategoria ? "categoriaProduto-error" : undefined}
          >
            {categoriasDoRestaurante.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                className={
                  "dispositivo-form__tipo-botao" +
                  (categoriaId === categoria.id ? " dispositivo-form__tipo-botao--ativo" : "")
                }
                aria-pressed={categoriaId === categoria.id}
                onClick={() => {
                  setCategoriaId(categoria.id);
                  revalidarSeNecessario("categoriaId");
                }}
                disabled={salvando}
              >
                {categoria.nome}
                {!categoria.ativa && " (inativa)"}
              </button>
            ))}
          </div>
          <FieldError id="categoriaProduto-error" message={erroCategoria} />
        </div>
      )}

      <Input
        id="nomeProduto"
        ref={nomeRef}
        label="Nome"
        value={nome}
        onChange={(event) => {
          setNome(event.target.value);
          revalidarSeNecessario("nome");
        }}
        placeholder="Ex.: X-Burger"
        disabled={salvando}
        error={erros.nome ?? errosCampoApi?.nome}
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
        ref={precoRef}
        label="Preço (R$)"
        type="number"
        min={0.01}
        step={0.01}
        value={preco}
        onChange={(event) => {
          setPreco(event.target.value);
          revalidarSeNecessario("preco");
        }}
        placeholder="Ex.: 29.90"
        disabled={salvando}
        error={erros.preco ?? errosCampoApi?.preco}
      />

      <div className="produto-form__upload">
        <span className="dispositivo-form__tipo-rotulo">Enviar imagem do produto (opcional)</span>
        <input
          id="arquivoImagemProduto"
          className="produto-form__upload-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleSelecionarArquivo}
          disabled={salvando || enviandoImagem}
        />
        <p className="produto-form__imagem-ajuda">Formatos aceitos: JPEG, PNG ou WEBP. Tamanho máximo: 5MB.</p>

        {previewLocalUrl && (
          <img className="produto-form__imagem-preview" src={previewLocalUrl} alt="Prévia local do arquivo selecionado" />
        )}

        {arquivoSelecionado && (
          <Button type="button" onClick={handleEnviarImagem} loading={enviandoImagem} disabled={salvando}>
            Enviar imagem
          </Button>
        )}

        <ErrorMessage message={erroUpload} />
      </div>

      <Input
        id="imagemUrlProduto"
        ref={imagemUrlRef}
        label="URL da imagem (opcional)"
        value={imagemUrl}
        onChange={(event) => {
          setImagemUrl(event.target.value);
          revalidarSeNecessario("imagemUrl");
        }}
        placeholder="https://exemplo.com/produto.png"
        disabled={salvando}
        error={erroImagemUrl}
        helpText="Informe uma URL pública da imagem do produto, ou envie um arquivo acima — o campo é preenchido automaticamente após o envio."
      />

      {!erroImagemUrl && imagemUrlTrimmed && imagemUrlEhValida && !imagemFalhouAoCarregar && (
        <img
          className="produto-form__imagem-preview"
          src={imagemUrlTrimmed}
          alt="Prévia da imagem do produto"
          onError={() => setImagemFalhouAoCarregar(true)}
          onLoad={() => setImagemFalhouAoCarregar(false)}
        />
      )}

      {!erroImagemUrl && imagemUrlTrimmed && imagemUrlEhValida && imagemFalhouAoCarregar && (
        <div className="produto-form__imagem-preview-fallback">Não foi possível carregar a prévia da imagem.</div>
      )}

      <Input
        id="ordemExibicaoProduto"
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

      {!produtoEmEdicao && (
        <>
          <AlternadorSimNao rotulo="Disponível" valor={disponivel} onAlterar={setDisponivel} desabilitado={salvando} />
          <AlternadorSimNao rotulo="Destaque" valor={destaque} onAlterar={setDestaque} desabilitado={salvando} />
        </>
      )}

      <AlternadorSimNao rotulo="Recomendado" valor={recomendado} onAlterar={setRecomendado} desabilitado={salvando} />

      <ErrorMessage message={erro} />

      <div className="dispositivo-form__acoes">
        <Button type="submit" loading={salvando}>
          {produtoEmEdicao ? "Salvar alterações" : "Cadastrar produto"}
        </Button>

        <Button type="button" variant="secondary" onClick={onCancelarEdicao} disabled={salvando}>
          {produtoEmEdicao ? "Cancelar edição" : "Cancelar"}
        </Button>
      </div>
    </form>
  );
}
