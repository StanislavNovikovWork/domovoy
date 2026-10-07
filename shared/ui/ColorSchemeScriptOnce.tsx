'use client';

import { useSyncExternalStore } from 'react';
import { ColorSchemeScript } from '@mantine/core';

const subscribe = () => () => {};

// React 19.3 в dev ругается на <script>, созданный при клиентском рендере.
// Скрипт нужен только до гидрации: отдаём его на сервере и при гидрации, затем убираем.
export function ColorSchemeScriptOnce() {
  const isServer = useSyncExternalStore(subscribe, () => false, () => true);
  return isServer ? <ColorSchemeScript /> : null;
}
