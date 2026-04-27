export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value);
}

export function formatIsoDateToBr(date: string | null | undefined): string {
  if (!date) {
    return '-';
  }

  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}/${month}/${year}` : date;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
