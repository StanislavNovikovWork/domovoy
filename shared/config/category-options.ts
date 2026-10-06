export const CATEGORY_COLORS = [
  'red', 'orange', 'yellow', 'lime', 'green', 'teal',
  'cyan', 'blue', 'indigo', 'violet', 'pink', 'gray',
] as const;

export const CATEGORY_ICONS = [
  'tag', 'shopping-cart', 'home', 'car', 'heart-pulse', 'device-gamepad-2',
  'shirt', 'coffee', 'bus', 'plane', 'gift', 'wallet',
  'briefcase', 'cash', 'school', 'paw', 'wifi',
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];