import { Link } from "react-router-dom";

/**
 * Navegação de volta ao painel administrativo — presente em toda subtela de
 * `/admin/*` (Restaurantes/Dispositivos/Categorias/Produtos). Adicionado na
 * revisão TASK-047: nenhuma dessas telas tinha um caminho de volta além do
 * botão "Voltar" do navegador.
 */
export function AdminVoltarLink() {
  return (
    <Link to="/admin" className="admin-voltar-link">
      ← Painel administrativo
    </Link>
  );
}
