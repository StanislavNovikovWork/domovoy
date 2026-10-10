export type CategoryOption = {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  suggestions: string[];
};
