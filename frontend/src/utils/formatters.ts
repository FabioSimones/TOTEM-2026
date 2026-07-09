const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrencyBRL(value: number): string {
  return currencyFormatter.format(value);
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Formata datas ISO (ex.: `criadoEm`/`atualizadoEm` do backend) como `dd/mm/aaaa hh:mm`. */
export function formatDateTimeBRL(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}
