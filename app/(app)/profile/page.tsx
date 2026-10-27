import { ProfileView } from '@/features/profile/ProfileView';
import { listChangelog } from '@/server/changelog/queries';
import { requirePageSession } from '@/server/session';

export const metadata = {
  title: 'Профиль',
};

export default async function ProfilePage() {
  const { user } = await requirePageSession('/profile');
  const changelog = await listChangelog();
  return (
    <ProfileView
      user={{ name: user.name, email: user.email }}
      changelog={changelog}
      hasNewChangelog={user.changelogSeenVersion !== process.env.NEXT_PUBLIC_APP_VERSION}
    />
  );
}
