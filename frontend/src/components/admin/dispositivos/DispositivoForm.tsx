import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { TipoDispositivo } from "../../../types/auth";
import type { CriarDispositivoRequest } from "../../../types/dispositivo";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { Input } from "../../ui/Input";

interface DispositivoFormProps {
  restaurantes: RestauranteAdminResponse[];
  onCriar: (request: CriarDispositivoRequest) => void;
  criando: boolean;
  erro: string | null;
}

const OPCOES_TIPO: { valor: TipoDispositivo; rotulo: string }[] = [
  { valor: "TOTEM", rotulo: "Totem" },
  { valor: "CAIXA", rotulo: "Caixa" },
  { valor: "COZINHA", rotulo: "Cozinha" },
  { valor: "ADMINISTRACAO", rotulo: "Administração" },
];

export function DispositivoForm({ restaurantes, onCriar, criando, erro }: DispositivoFormProps) {
  const [restauranteId, setRestauranteId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [codigoIdentificacao, setCodigoIdentificacao] = useState("");
  const [tipoDispositivo, setTipoDispositivo] = useState<TipoDispositivo>("TOTEM");
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  useEffect(() => {
    setRestauranteId(restaurantes[0]?.id ?? null);
  }, [restaurantes]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!restauranteId) {
      setErroValidacao("Selecione um restaurante.");
      return;
    }
    if (!nome.trim()) {
      setErroValidacao("Informe o nome do dispositivo.");
      return;
    }
    if (!codigoIdentificacao.trim()) {
      setErroValidacao("Informe o código de identificação.");
      return;
    }

    setErroValidacao(null);
    onCriar({
      restauranteId,
      nome: nome.trim(),
      codigoIdentificacao: codigoIdentificacao.trim(),
      tipoDispositivo,
    });
  }

  if (restaurantes.length === 0) {
    return (
      <div className="dispositivo-form">
        <h2 className="dispositivo-form__titulo">Cadastrar dispositivo</h2>
        <p className="totem-estado">
          Cadastre um restaurante antes de criar dispositivos — veja{" "}
          <Link to="/admin/restaurantes">Admin — Restaurantes</Link>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="dispositivo-form">
      <h2 className="dispositivo-form__titulo">Cadastrar dispositivo</h2>

      <div className="dispositivo-form__tipo">
        <span className="dispositivo-form__tipo-rotulo">Restaurante</span>
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
              disabled={criando}
            >
              {restaurante.nome}
            </button>
          ))}
        </div>
      </div>

      <Input
        id="nomeDispositivo"
        label="Nome"
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        placeholder="Ex.: Totem 01"
        disabled={criando}
      />

      <Input
        id="codigoIdentificacao"
        label="Código de identificação"
        value={codigoIdentificacao}
        onChange={(event) => setCodigoIdentificacao(event.target.value)}
        placeholder="Ex.: TOTEM_01"
        disabled={criando}
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
              disabled={criando}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      <ErrorMessage message={erroValidacao ?? erro} />

      <Button type="submit" loading={criando}>
        Cadastrar dispositivo
      </Button>
    </form>
  );
}
