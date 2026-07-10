import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { TipoDispositivo } from "../../../types/auth";
import type { AtualizarDispositivoRequest, CriarDispositivoRequest, DispositivoAdminResponse } from "../../../types/dispositivo";
import type { RestauranteAdminResponse } from "../../../types/restaurante";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { Input } from "../../ui/Input";

interface DispositivoFormProps {
  dispositivoEmEdicao: DispositivoAdminResponse | null;
  restaurantes: RestauranteAdminResponse[];
  onCriar: (request: CriarDispositivoRequest) => void;
  onAtualizar: (id: number, request: AtualizarDispositivoRequest) => void;
  onCancelarEdicao: () => void;
  salvando: boolean;
  erro: string | null;
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
  onCriar,
  onAtualizar,
  onCancelarEdicao,
  salvando,
  erro,
}: DispositivoFormProps) {
  const [restauranteId, setRestauranteId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [codigoIdentificacao, setCodigoIdentificacao] = useState("");
  const [tipoDispositivo, setTipoDispositivo] = useState<TipoDispositivo>("TOTEM");
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  useEffect(() => {
    if (dispositivoEmEdicao) {
      setRestauranteId(dispositivoEmEdicao.restauranteId);
      setNome(dispositivoEmEdicao.nome);
      setCodigoIdentificacao(dispositivoEmEdicao.codigoIdentificacao);
      setTipoDispositivo(dispositivoEmEdicao.tipoDispositivo);
    } else {
      setRestauranteId(restaurantes[0]?.id ?? null);
      setNome("");
      setCodigoIdentificacao("");
      setTipoDispositivo("TOTEM");
    }
    setErroValidacao(null);
  }, [dispositivoEmEdicao, restaurantes]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!dispositivoEmEdicao && !restauranteId) {
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

    if (dispositivoEmEdicao) {
      onAtualizar(dispositivoEmEdicao.id, {
        nome: nome.trim(),
        codigoIdentificacao: codigoIdentificacao.trim(),
        tipoDispositivo,
      });
    } else {
      onCriar({
        restauranteId: restauranteId as number,
        nome: nome.trim(),
        codigoIdentificacao: codigoIdentificacao.trim(),
        tipoDispositivo,
      });
    }
  }

  if (!dispositivoEmEdicao && restaurantes.length === 0) {
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
      <h2 className="dispositivo-form__titulo">
        {dispositivoEmEdicao ? `Editar dispositivo — ${dispositivoEmEdicao.nome}` : "Cadastrar dispositivo"}
      </h2>

      <div className="dispositivo-form__tipo">
        <span className="dispositivo-form__tipo-rotulo">Restaurante</span>
        {dispositivoEmEdicao ? (
          <p className="dispositivo-form__restaurante-fixo">
            {restaurantes.find((r) => r.id === dispositivoEmEdicao.restauranteId)?.nome ??
              `#${dispositivoEmEdicao.restauranteId}`}{" "}
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
        id="nomeDispositivo"
        label="Nome"
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        placeholder="Ex.: Totem 01"
        disabled={salvando}
      />

      <Input
        id="codigoIdentificacao"
        label="Código de identificação"
        value={codigoIdentificacao}
        onChange={(event) => setCodigoIdentificacao(event.target.value)}
        placeholder="Ex.: TOTEM_01"
        disabled={salvando}
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

      <ErrorMessage message={erroValidacao ?? erro} />

      <div className="dispositivo-form__acoes">
        <Button type="submit" loading={salvando}>
          {dispositivoEmEdicao ? "Salvar alterações" : "Cadastrar dispositivo"}
        </Button>

        {dispositivoEmEdicao && (
          <button type="button" className="dispositivo-form__cancelar" onClick={onCancelarEdicao} disabled={salvando}>
            Cancelar edição
          </button>
        )}
      </div>
    </form>
  );
}
