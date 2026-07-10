import type { TipoDispositivo } from "./auth";

/** POST /api/admin/dispositivos — o frontend nunca envia ativo/ativado/codigoAtivacao. */
export interface CriarDispositivoRequest {
  restauranteId: number;
  nome: string;
  codigoIdentificacao: string;
  tipoDispositivo: TipoDispositivo;
}

/** PUT /api/admin/dispositivos/{id} — não aceita restauranteId (dispositivo não muda de restaurante por edição), nem ativo/ativado/codigoAtivacao. */
export interface AtualizarDispositivoRequest {
  nome: string;
  codigoIdentificacao: string;
  tipoDispositivo: TipoDispositivo;
}

/** GET/POST/PUT/PATCH /api/admin/dispositivos — resposta completa do backend. */
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
