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
];

export const DESKTOP_TILE_KEYS = DESKTOP_TILES.map((t) => t.key);
