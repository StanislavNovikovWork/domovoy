'use client';

import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  // getInitialValueInEffect: на сервере схема неизвестна, иначе будет расхождение при гидрации
  const computed = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const dark = computed === 'dark';

  return (
    <ActionIcon
      variant="default"
      size="lg"
      radius="xl"
      aria-label={dark ? 'Светлая тема' : 'Тёмная тема'}
      onClick={() => setColorScheme(dark ? 'light' : 'dark')}
    >
      {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}
