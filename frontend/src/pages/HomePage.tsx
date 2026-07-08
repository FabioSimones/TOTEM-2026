import { AppLayout } from "../components/layout/AppLayout";

export function HomePage() {
  return (
    <AppLayout
      title="Totem Fast Food"
      description="Ponto de entrada do sistema. Selecione o módulo desejado nas rotas: /totem, /caixa, /cozinha ou /admin."
    />
  );
}
