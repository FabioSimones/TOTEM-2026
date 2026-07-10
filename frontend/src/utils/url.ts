/** Validação básica: precisa ser http(s) e passar pelo construtor URL do navegador. */
export function isValidHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) {
    return false;
  }
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
