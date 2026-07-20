import { FoodIcons } from "./FoodIcons";

const RECURSOS = ["Gestão de pedidos", "Cardápio digital", "Totem de autoatendimento", "Operação em tempo real"];

/**
 * TASK-117: painel institucional do login central (`AuthSplitLayout`) — marca, ícones decorativos
 * e um resumo curto do que o sistema realmente faz. Não é o `<h1>` da página: esse título fica no
 * formulário (`LoginPage`), aqui é conteúdo de apoio (`<h2>`), mantendo uma única hierarquia de
 * heading na tela (auditoria de acessibilidade, item 18 da TASK-117).
 */
export function LoginBrandPanel() {
  return (
    <div className="auth-split__brand">
      {/* Formas decorativas de fundo — puramente visuais, nunca interferem em clique/leitura. */}
      <span className="auth-split__blob auth-split__blob--top" aria-hidden="true" />
      <span className="auth-split__blob auth-split__blob--bottom" aria-hidden="true" />

      <div className="auth-split__brand-content">
        <span className="auth-split__logo">
          <span className="auth-split__logo-mark" aria-hidden="true" />
          TotemFood
        </span>

        <FoodIcons />

        <h2 className="auth-split__title">Gerencie seu restaurante com eficiência</h2>
        <p className="auth-split__description">
          Uma plataforma para pedidos, cardápios e operações — do autoatendimento ao painel
          administrativo.
        </p>

        <ul className="auth-split__features">
          {RECURSOS.map((recurso) => (
            <li key={recurso} className="auth-split__feature">
              {recurso}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
