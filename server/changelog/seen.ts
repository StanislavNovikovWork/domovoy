import 'server-only';

// пользователь ещё не открывал список изменений текущей версии: показываем красную точку
export const hasUnseenChangelog = (user: { changelogSeenVersion?: string | null }) =>
  user.changelogSeenVersion !== process.env.NEXT_PUBLIC_APP_VERSION;
