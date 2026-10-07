// Куда вернуть пользователя после входа. Принимаем только внутренние пути:
// одна ведущая «/» и не «//…» (иначе браузер трактует как ссылку на другой сайт)
export function safeNext(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

// Добавляет next к ссылке на /login или /register, если возврат не на главную
export function withNext(path: string, next: string): string {
  return next === '/' ? path : `${path}?next=${encodeURIComponent(next)}`;
}
