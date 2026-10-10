import { Progress } from '@mantine/core';

// Полоса «потрачено из плана»: красная при превышении
export function PlanProgress({
  spent,
  planned,
  color,
  size = 'sm',
}: {
  spent: number;
  planned: number;
  color: string;
  size?: 'xs' | 'sm';
}) {
  return (
    <Progress
      value={planned > 0 ? Math.min(100, (spent / planned) * 100) : spent > 0 ? 100 : 0}
      color={spent > planned ? 'red' : color}
      size={size}
      radius="xl"
    />
  );
}
