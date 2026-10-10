export function formatMoney(kopecks: number): string {
  const whole = kopecks % 100 === 0;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(kopecks / 100);
}
