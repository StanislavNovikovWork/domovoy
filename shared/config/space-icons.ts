// иконки пространства: ключ хранится в household.icon
export const SPACE_ICONS = [
  'home',
  'users',
  'heart',
  'briefcase',
  'star',
  'piggy',
  'wallet',
  'plane',
  'car',
  'beach',
  'mountain',
  'gift',
  'cake',
  'coffee',
  'kitchen',
  'tent',
  'ship',
  'bike',
  'flower',
  'camera',
  'music',
  'gamepad',
  'paw',
  'baby',
] as const;

export type SpaceIconKey = (typeof SPACE_ICONS)[number];
