import { useState, type FormEvent } from "react";
import type { TipoDispositivo } from "../../../types/auth";
import type { CriarDispositivoRequest } from "../../../types/dispositivo";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { Input } from "../../ui/Input";

interface DispositivoFormProps {
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

export function DispositivoForm({ onCriar, criando, erro }: DispositivoFormProps) {
  const [restauranteId, setRestauranteId] = useState("");
  const [nome, setNome] = useState("");
  const [codigoIdentificacao, setCodigoIdentificacao] = useState("");
  const [tipoDispositivo, setTipoDispositivo] = useState<TipoDispositivo>("TOTEM");
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const restauranteIdNumero = Number(restauranteId);
    if (!restauranteId.trim() || Number.isNaN(restauranteIdNumero) || restauranteIdNumero <= 0) {
      setErroValidacao("Informe um ID de restaurante válido.");
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
      restauranteId: restauranteIdNumero,
      nome: nome.trim(),
      codigoIdentificacao: codigoIdentificacao.trim(),
      tipoDispositivo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="dispositivo-form">
      <h2 className="dispositivo-form__titulo">Cadastrar dispositivo</h2>

      <Input
        id="restauranteId"
        label="ID do restaurante"
        type="number"
        min={1}
        value={restauranteId}
        onChange={(event) => setRestauranteId(event.target.value)}
        placeholder="Ex.: 1"
        disabled={criando}
      />

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
