import type { TipoDispositivo } from "./auth";

/** POST /api/admin/dispositivos — o frontend nunca envia ativo/ativado/codigoAtivacao. */
export interface CriarDispositivoRequest {
  restauranteId: number;
  nome: string;
  codigoIdentificacao: string;
  tipoDispositivo: TipoDispositivo;
}

/** GET/POST/PATCH /api/admin/dispositivos — resposta completa do backend. */
export interface DispositivoAdminResponse {
  id: number;
  restauranteId: number;
  nome: string;
  codigoIdentificacao: string;
  tipoDispositivo: TipoDispositivo;
  ativo: boolean;
  ativado: boolean;
  codigoAtivacao: string;
  ultimoAcesso: string | null;
  ativadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
