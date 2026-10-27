import { redirect } from 'next/navigation';

// старый адрес: список бюджетов теперь на главной
export default function FamilyPage() {
  redirect('/');
}
