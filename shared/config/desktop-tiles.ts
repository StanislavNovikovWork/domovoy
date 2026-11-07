// плитки мобильного рабочего стола, которые участник может скрыть; «Настройки» скрыть нельзя
export const DESKTOP_TILES: { key: string; label: string; periodicOnly?: boolean }[] = [
  { key: 'budget', label: 'Бюджет' },
  { key: 'lists', label: 'Списки', periodicOnly: true },
  { key: 'places', label: 'Куда сходить' },
  { key: 'plan', label: 'План затрат' },
  { key: 'calendar', label: 'Календарь', periodicOnly: true },
  { key: 'docs', label: 'Документы', periodicOnly: true },
  { key: 'menu', label: 'Меню', periodicOnly: true },
  { key: 'map', label: 'Карта', periodicOnly: true },
  { key: 'contacts', label: 'Контакты', periodicOnly: true },
  { key: 'birthdays', label: 'Дни рождения', periodicOnly: true },
  { key: 'gallery', label: 'Галерея', periodicOnly: true },
  { key: 'projects', label: 'Поездки', periodicOnly: true },
];

export const DESKTOP_TILE_KEYS = DESKTOP_TILES.map((t) => t.key);

// порядок плиток пользователя; неизвестные и новые ключи остаются в конце в порядке DESKTOP_TILES
export function orderDesktopTiles<T extends { key: string }>(tiles: T[], order: string[]): T[] {
  const saved = new Map(order.map((key, index) => [key, index]));
  const fallback = new Map(DESKTOP_TILES.map((tile, index) => [tile.key, index]));
  const rank = (key: string) =>
    saved.get(key) ?? order.length + (fallback.get(key) ?? DESKTOP_TILES.length);
  return [...tiles].sort((a, b) => rank(a.key) - rank(b.key));
}
