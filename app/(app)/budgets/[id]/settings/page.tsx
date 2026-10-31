import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function SettingsPage({ params }: Props) {
  const { id } = await params;
  redirect(`/budgets/${id}/settings/space`);
}
