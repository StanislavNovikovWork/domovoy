'use client';

import type { ReactNode } from 'react';
import { Portal } from '@mantine/core';

export const HEADER_ACTIONS_ID = 'header-actions';
export const HEADER_LEFT_ID = 'header-left';

// Выводит кнопки страницы в слот шапки приложения (см. AppShellLayout)
export function HeaderActions({ children }: { children: ReactNode }) {
  return <Portal target={`#${HEADER_ACTIONS_ID}`}>{children}</Portal>;
}

// Выводит элементы страницы в левую часть шапки, например кнопку «назад»
export function HeaderLeft({ children }: { children: ReactNode }) {
  return <Portal target={`#${HEADER_LEFT_ID}`}>{children}</Portal>;
}
