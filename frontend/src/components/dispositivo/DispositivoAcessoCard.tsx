import { Button } from "../ui/Button";

interface AcaoDispositivoAcesso {
  rotulo: string;
  onAcionar: () => void;
}

interface DispositivoAcessoCardProps {
  titulo: string;
  mensagem: string;
  acaoPrincipal: AcaoDispositivoAcesso;
}

/**
 * Estado centralizado para as telas operacionais (Caixa/Cozinha) enquanto o terminal não está
 * pronto: sem dispositivo ativado, dispositivo de tipo incompatível, ou sessão de dispositivo
 * expirada (TASK-112) — sempre com uma ação clara para ativar/trocar o equipamento, nunca um beco
 * sem saída. Sem lógica de API própria: quem decide texto/ação é a página que o usa.
 */
export function DispositivoAcessoCard({ titulo, mensagem, acaoPrincipal }: DispositivoAcessoCardProps) {
  return (
    <div className="dispositivo-acesso-card">
      <h2 className="dispositivo-form__titulo">{titulo}</h2>
      <p className="totem-estado">{mensagem}</p>
      <Button type="button" onClick={acaoPrincipal.onAcionar}>
        {acaoPrincipal.rotulo}
      </Button>
    </div>
  );
}
