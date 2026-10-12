import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withNext } from '@/shared/lib/safe-next';

// Быстрая проверка до рендера: без cookie сессии сразу отправляем на /login настоящим редиректом 307.
// Иначе редирект из страницы приходит внутри потока, и без JavaScript виден белый экран.
// Cookie только проверяется на наличие; настоящую проверку сессии по-прежнему делают сами страницы.
export function proxy(request: NextRequest) {
  if (request.method !== 'GET' || getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const next = `${pathname}${search}`;
  return NextResponse.redirect(new URL(withNext('/login', next), request.url));
}

export const config = {
  // всё, кроме публичных страниц, API и статики
  matcher: [
    '/((?!api|_next/static|_next/image|login|register|invite|icons|icon\\.png|apple-icon\\.png|manifest\\.webmanifest|favicon).*)',
  ],
};
