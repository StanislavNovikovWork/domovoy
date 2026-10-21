import type { ModalProps } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

// на мобильных окно занимает весь экран без скруглений и лежит выше окна настроек (200),
// на десктопе остаётся обычной модалкой
export function useMobileModal(): Partial<ModalProps> {
  const isMobile = useMediaQuery('(max-width: 47.99375em)');
  return isMobile
    ? {
        fullScreen: true,
        radius: 0,
        xOffset: 0,
        yOffset: 0,
        zIndex: 250,
        transitionProps: { transition: 'slide-up' },
      }
    : {};
}
