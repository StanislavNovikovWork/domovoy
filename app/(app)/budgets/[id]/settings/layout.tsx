import { Box, Group } from '@mantine/core';
import { SettingsNav } from '@/features/family/SettingsNav';

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

// настройки пространства на десктопе: слева список разделов, справа контент раздела.
// На мобильном меню скрыто: /settings сам показывает список, разделы — отдельные экраны с «назад»
export default async function SettingsLayout({ children, params }: Props) {
  const { id } = await params;
  return (
    <Group align="flex-start" wrap="nowrap" gap="lg">
      <SettingsNav householdId={id} />
      <Box style={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Group>
  );
}
