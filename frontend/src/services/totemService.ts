import { api } from "./api";
import type { CardapioTotemResponse } from "../types/totem";

/** GET /api/totem/cardapio — exige token de dispositivo TOTEM (anexado automaticamente por api.ts). */
export function buscarCardapio(): Promise<CardapioTotemResponse> {
  return api.get<CardapioTotemResponse>("/api/totem/cardapio");
}
