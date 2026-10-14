'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// Пункты настроек текущей страницы (например, «Участники», «Категории»).
// Страница регистрирует их, а шторка «Настройки» в нижнем меню (мобильные) выводит списком;
// на десктопе те же пункты показывает шестерёнка в шапке.
export type SettingsItem = {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

type Ctx = {
  items: SettingsItem[];
  setItems: (items: SettingsItem[]) => void;
};

const SettingsItemsContext = createContext<Ctx | null>(null);

export function SettingsItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItemsState] = useState<SettingsItem[]>([]);
  const setItems = useCallback((next: SettingsItem[]) => setItemsState(next), []);
  const value = useMemo(() => ({ items, setItems }), [items, setItems]);
  return <SettingsItemsContext.Provider value={value}>{children}</SettingsItemsContext.Provider>;
}

export function useSettingsItems(): SettingsItem[] {
  return useContext(SettingsItemsContext)?.items ?? [];
}

// Регистрирует пункты на время жизни страницы. onClick берётся из последнего рендера,
// поэтому список перерегистрируется только при смене набора пунктов
export function useRegisterSettingsItems(items: SettingsItem[]) {
  const ctx = useContext(SettingsItemsContext);
  const latest = useRef(items);
  latest.current = items;
  const signature = items.map((i) => `${i.key}:${i.label}`).join('|');

  useEffect(() => {
    if (!ctx) {
      return;
    }
    ctx.setItems(
      latest.current.map((item) => ({
        ...item,
        onClick: () => latest.current.find((i) => i.key === item.key)?.onClick(),
      }))
    );
    return () => ctx.setItems([]);
    // ctx.setItems стабилен; зависим только от набора пунктов
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, ctx?.setItems]);
}
