'use client';

import type { ReactNode } from 'react';
import { Portal } from '@mantine/core';

export const HEADER_ACTIONS_ID = 'header-actions';

// Выводит кнопки страницы в слот шапки приложения (см. AppShellLayout)
export function HeaderActions({ children }: { children: ReactNode }) {
  return <Portal target={`#${HEADER_ACTIONS_ID}`}>{children}</Portal>;
}
