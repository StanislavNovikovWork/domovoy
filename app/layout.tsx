import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import 'dayjs/locale/ru';
import { mantineHtmlProps, MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
// import { Notifications } from '@mantine/notifications';
import { ColorSchemeScriptOnce } from '@/shared/ui/ColorSchemeScriptOnce';
import { theme } from '../theme';
import './global.css';

export const metadata = {
  title: { default: 'Nest', template: '%s · Nest' },
  description: 'Общие и разовые бюджеты',
  // iOS: запуск с экрана «Домой» без интерфейса браузера
  appleWebApp: { capable: true, title: 'Nest', statusBarStyle: 'default' as const },
};

// цвет адресной строки и системной панели в установленном приложении
// совпадает с фоном страницы (Mantine: белый и dark.7), чтобы статус-бар Android сливался с приложением
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#242424' },
  ],
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="ru" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScriptOnce />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, maximum-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          {/* <Notifications /> */}
          <DatesProvider settings={{ locale: 'ru', firstDayOfWeek: 1 }}>{children}</DatesProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
