export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
}

export function formatProfitLoss(amount: number, currency: string): string {
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${formatCurrency(amount, currency)}`;
}

export function formatChips(chips: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(chips);
}

export function formatChipProfitLoss(chips: number): string {
  const prefix = chips > 0 ? '+' : '';
  return `${prefix}${formatChips(chips)}`;
}
