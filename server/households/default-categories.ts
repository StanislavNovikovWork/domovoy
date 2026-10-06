import 'server-only';
import type { CategoryColor, CategoryIcon } from '@/shared/config/category-options';

type DefaultCategory = {
  name: string;
  type: 'income' | 'expense';
  icon: CategoryIcon;
  color: CategoryColor;
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // расходы
  { name: 'Продукты', type: 'expense', icon: 'shopping-cart', color: 'green' },
  { name: 'Жильё', type: 'expense', icon: 'home', color: 'indigo' },
  { name: 'Транспорт', type: 'expense', icon: 'bus', color: 'blue' },
  { name: 'Здоровье', type: 'expense', icon: 'heart-pulse', color: 'red' },
  { name: 'Кафе и рестораны', type: 'expense', icon: 'coffee', color: 'orange' },
  { name: 'Развлечения', type: 'expense', icon: 'device-gamepad-2', color: 'violet' },
  { name: 'Одежда', type: 'expense', icon: 'shirt', color: 'pink' },
  { name: 'Подарки', type: 'expense', icon: 'gift', color: 'cyan' },
  { name: 'Прочее', type: 'expense', icon: 'tag', color: 'gray' },
  // доходы
  { name: 'Зарплата', type: 'income', icon: 'briefcase', color: 'teal' },
  { name: 'Подработка', type: 'income', icon: 'cash', color: 'lime' },
  { name: 'Прочее', type: 'income', icon: 'tag', color: 'gray' },
];