import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import 'dayjs/locale/ru';
import { mantineHtmlProps, MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { ColorSchemeScriptOnce } from '@/shared/ui/ColorSchemeScriptOnce';
import { theme } from '../theme';

export const metadata = {
  title: 'Mantine Next.js template',
  description: 'I am using Mantine with Next.js!',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="ru" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScriptOnce />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <DatesProvider settings={{ locale: 'ru', firstDayOfWeek: 1 }}>
            <Notifications />
            {children}
          </DatesProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
