'use client';

import { IconMoon, IconSun } from '@tabler/icons-react';
import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { useMounted } from '@mantine/hooks';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light', { getInitialValueInEffect: true });
  // сохранённая тема читается из localStorage уже при первом клиентском рендере, а сервер её не знает:
  // до монтирования рисуем «светлую» иконку, как на сервере, иначе гидрация не сойдётся
  const mounted = useMounted();
  const dark = mounted && computed === 'dark';

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
