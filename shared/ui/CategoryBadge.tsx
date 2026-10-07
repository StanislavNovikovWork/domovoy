'use client';

import { ThemeIcon } from '@mantine/core';
import { CategoryIcon } from './CategoryIcon';

type Props = {
  icon: string;
  color: string;
  size?: number;
  // selected: с обводкой, muted: приглушённый (невыбранный среди выбранных)
  state?: 'default' | 'selected' | 'muted';
};

export function CategoryBadge({ icon, color, size = 44, state = 'default' }: Props) {
  return (
    <ThemeIcon
      size={size}
      radius="xl"
      color={color}
      variant="filled"
      style={{
        opacity: state === 'muted' ? 0.45 : 1,
        outline: state === 'selected' ? `2px solid var(--mantine-color-${color}-6)` : 'none',
        outlineOffset: 3,
      }}
    >
      <CategoryIcon name={icon} size={Math.round(size * 0.6)} />
    </ThemeIcon>
  );
}