import { redirect } from 'next/navigation';

// старый адрес: общие бюджеты переехали на /budgets
export default function FamilyPage() {
  redirect('/budgets');
}
