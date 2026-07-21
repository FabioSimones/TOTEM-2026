/** Normaliza para comparação de busca: minúsculas + sem acentos (NFD + remoção de diacríticos). */
export function normalizarTextoBusca(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
