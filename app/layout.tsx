import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import 'dayjs/locale/ru';
import { mantineHtmlProps, MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { ColorSchemeScriptOnce } from '@/shared/ui/ColorSchemeScriptOnce';
import { theme } from '../theme';

export const metadata = {
  title: { default: 'Cash', template: '%s · Cash' },
  description: 'Личные, общие и разовые бюджеты',
  // iOS: запуск с экрана «Домой» без интерфейса браузера
  appleWebApp: { capable: true, title: 'Cash', statusBarStyle: 'default' as const },
};

// цвет адресной строки и системной панели в установленном приложении
export const viewport = { themeColor: '#2457e6' };

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="ru" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScriptOnce />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <DatesProvider settings={{ locale: 'ru', firstDayOfWeek: 1 }}>
            {children}
          </DatesProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
