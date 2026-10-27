import { redirect } from 'next/navigation';

// список бюджетов переехал на главную
export default function BudgetsPage() {
  redirect('/');
}
