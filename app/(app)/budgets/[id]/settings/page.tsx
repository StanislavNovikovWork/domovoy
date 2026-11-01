import { SettingsIndex } from '@/features/family/SettingsNav';

type Props = { params: Promise<{ id: string }> };

export default async function SettingsPage({ params }: Props) {
  const { id } = await params;
  return <SettingsIndex householdId={id} />;
}
