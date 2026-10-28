// виды мест для «Куда сходить»: value хранится в базе, label и color — для интерфейса
export const PLACE_KINDS = [
  { value: 'food', label: 'Еда', color: 'orange' },
  { value: 'fun', label: 'Развлечения', color: 'grape' },
  { value: 'other', label: 'Другое', color: 'gray' },
] as const;

export type PlaceKind = (typeof PLACE_KINDS)[number]['value'];

export const PLACE_KIND_VALUES = PLACE_KINDS.map((k) => k.value) as [PlaceKind, ...PlaceKind[]];
