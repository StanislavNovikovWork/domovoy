import { ProfileView } from '@/features/profile/ProfileView';
import { requirePageSession } from '@/server/session';

export const metadata = {
  title: 'Профиль',
};

export default async function ProfilePage() {
  const { user } = await requirePageSession('/profile');
  return <ProfileView user={{ name: user.name, email: user.email }} />;
}
