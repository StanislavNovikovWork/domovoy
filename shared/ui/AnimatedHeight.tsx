'use client';

import type { ReactNode } from 'react';
import { useElementSize } from '@mantine/hooks';

type Props = {
  children: ReactNode;
  /** Элемент, прижатый к низу: едет вместе с анимируемым нижним краем, а не прыгает сразу */
  footer?: ReactNode;
  duration?: number; // мс
};

/** Плавно анимирует изменение высоты содержимого (CSS не умеет transition до height: auto) */
export function AnimatedHeight({ children, footer, duration = 250 }: Props) {
  const content = useElementSize();
  const foot = useElementSize();
  const total = content.height + foot.height;

  return (
    <div
      style={{
        position: 'relative',
        // до первого замера высота auto, чтобы не было анимации от нуля при открытии
        height: total > 0 ? total : 'auto',
        overflow: 'hidden',
        transition: `height ${duration}ms ease`,
      }}
    >
      <div ref={content.ref}>{children}</div>
      {footer && (
        <div ref={foot.ref} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <div style={{ paddingTop: 'var(--mantine-spacing-md)' }}>{footer}</div>
        </div>
      )}
    </div>
  );
}
