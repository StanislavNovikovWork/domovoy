export type Period = 'day' | 'week' | 'month' | 'year';

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
];

// разовые бюджеты не делятся на месяцы: их план хранится под одним фиксированным месяцем
export const ONE_TIME_MONTH = '2000-01-01';
export const ALL_TIME_RANGE = { from: '0000-01-01', to: '9999-12-31' };

const LOCALE = 'ru-RU';
const pad = (n: number) => String(n).padStart(2, '0');

export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && formatDate(parseDate(s)) === s;
}

export function isPeriod(v: string): v is Period {
  return PERIOD_OPTIONS.some((o) => o.value === v);
}

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

// неделя начинается с понедельника
function weekStart(d: Date) {
  return addDays(d, -((d.getDay() + 6) % 7));
}

// первое число месяца, в который попадает дата: '2026-10-17' → '2026-10-01'
export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

// '2026-10-01' → '2026-09-01'
export function prevMonth(month: string): string {
  const d = parseDate(month);
  return formatDate(new Date(d.getFullYear(), d.getMonth() - 1, 1));
}

// '2026-10-05' → '5 окт'
export function formatShortDate(date: string): string {
  return parseDate(date)
    .toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
    .replace('.', '');
}

// Прогресс месяца относительно сегодняшней даты; null, если сегодня не в этом месяце
export function getMonthProgress(
  month: string,
  today: string
): { percent: number; daysLeft: number; dayLabel: string } | null {
  if (monthStart(today) !== month) {
    return null;
  }
  const d = parseDate(today);
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return {
    percent: Math.round((d.getDate() / days) * 100),
    daysLeft: days - d.getDate(),
    dayLabel: d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long' }),
  };
}

// [from, to): from включительно, to не включая
export function getPeriodRange(period: Period, date: string): { from: string; to: string } {
  const d = parseDate(date);
  let start: Date;
  let end: Date;
  switch (period) {
    case 'day':
      start = d;
      end = addDays(d, 1);
      break;
    case 'week':
      start = weekStart(d);
      end = addDays(start, 7);
      break;
    case 'month':
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      break;
    case 'year':
      start = new Date(d.getFullYear(), 0, 1);
      end = new Date(d.getFullYear() + 1, 0, 1);
      break;
  }
  return { from: formatDate(start), to: formatDate(end) };
}

export function shiftDate(period: Period, date: string, dir: 1 | -1): string {
  const d = parseDate(date);
  switch (period) {
    case 'day':
      return formatDate(addDays(d, dir));
    case 'week':
      return formatDate(addDays(d, 7 * dir));
    case 'month':
      return formatDate(new Date(d.getFullYear(), d.getMonth() + dir, 1));
    case 'year':
      return formatDate(new Date(d.getFullYear() + dir, 0, 1));
  }
}

// «6 октября, вт», «5 окт. – 11 окт.», «октябрь 2026», «2026»
export function formatPeriodLabel(period: Period, date: string): string {
  const d = parseDate(date);
  switch (period) {
    case 'day':
      return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', weekday: 'short' });
    case 'week': {
      const s = weekStart(d);
      const e = addDays(s, 6);
      const f = (x: Date) => x.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
      return `${f(s)} – ${f(e)}`;
    }
    case 'month':
      return d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
    case 'year':
      return String(d.getFullYear());
  }
}

// Подпись в центре кольца
export function formatPeriodCaption(period: Period, date: string): string {
  const d = parseDate(date);
  switch (period) {
    case 'day':
      return 'за день';
    case 'week':
      return 'за неделю';
    case 'month':
      return `за ${d.toLocaleDateString(LOCALE, { month: 'long' })}`;
    case 'year':
      return `за ${d.getFullYear()} год`;
  }
}
