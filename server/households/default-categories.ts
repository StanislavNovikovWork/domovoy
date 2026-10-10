import 'server-only';
import type { CategoryColor, CategoryIcon } from '@/shared/config/category-options';

type DefaultCategory = {
  name: string;
  type: 'income' | 'expense';
  icon: CategoryIcon;
  color: CategoryColor;
  suggestions: string[];
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // расходы
  {
    name: 'Продукты',
    type: 'expense',
    icon: 'shopping-cart',
    color: 'green',
    suggestions: ['Еда', 'Перекус', 'Напитки', 'Бытовая химия'],
  },
  {
    name: 'Жильё',
    type: 'expense',
    icon: 'home',
    color: 'indigo',
    suggestions: ['Аренда', 'Коммунальные', 'Ремонт', 'Мебель'],
  },
  {
    name: 'Связь и подписки',
    type: 'expense',
    icon: 'wifi',
    color: 'cyan',
    suggestions: ['Интернет', 'Мобильная связь', 'VPN', 'Подписка'],
  },
  {
    name: 'Транспорт',
    type: 'expense',
    icon: 'bus',
    color: 'blue',
    suggestions: ['Бензин', 'Общественный транспорт', 'Такси', 'Парковка'],
  },
  {
    name: 'Здоровье',
    type: 'expense',
    icon: 'heart-pulse',
    color: 'red',
    suggestions: ['Аптека', 'Врач', 'Анализы'],
  },
  {
    name: 'Кафе и рестораны',
    type: 'expense',
    icon: 'coffee',
    color: 'orange',
    suggestions: ['Кофе', 'Обед', 'Доставка'],
  },
  {
    name: 'Развлечения',
    type: 'expense',
    icon: 'device-gamepad-2',
    color: 'violet',
    suggestions: ['Кино', 'Игры', 'Концерт'],
  },
  { name: 'Одежда', type: 'expense', icon: 'shirt', color: 'pink', suggestions: [] },
  { name: 'Подарки', type: 'expense', icon: 'gift', color: 'lime', suggestions: [] },
  { name: 'Прочее', type: 'expense', icon: 'tag', color: 'gray', suggestions: [] },
  // доходы
  {
    name: 'Зарплата',
    type: 'income',
    icon: 'briefcase',
    color: 'teal',
    suggestions: ['Аванс', 'Основная часть', 'Премия'],
  },
  { name: 'Подработка', type: 'income', icon: 'cash', color: 'yellow', suggestions: [] },
  { name: 'Прочее', type: 'income', icon: 'tag', color: 'gray', suggestions: [] },
];
