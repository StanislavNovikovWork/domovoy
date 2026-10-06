'use client';

import {
  IconTag, IconShoppingCart, IconHome, IconCar, IconHeartbeat, IconDeviceGamepad2,
  IconShirt, IconCoffee, IconBus, IconPlane, IconGift, IconWallet,
  IconBriefcase, IconCash, IconSchool, IconPaw, IconWifi,
} from '@tabler/icons-react';
import type { CategoryIcon as CategoryIconKey } from '@/shared/config/category-options';

const ICONS: Record<CategoryIconKey, typeof IconTag> = {
  tag: IconTag,
  'shopping-cart': IconShoppingCart,
  home: IconHome,
  car: IconCar,
  'heart-pulse': IconHeartbeat,
  'device-gamepad-2': IconDeviceGamepad2,
  shirt: IconShirt,
  coffee: IconCoffee,
  bus: IconBus,
  plane: IconPlane,
  gift: IconGift,
  wallet: IconWallet,
  briefcase: IconBriefcase,
  cash: IconCash,
  school: IconSchool,
  paw: IconPaw,
  wifi: IconWifi,
};

export function CategoryIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICONS[name as CategoryIconKey] ?? IconTag;
  return <Icon size={size} />;
}