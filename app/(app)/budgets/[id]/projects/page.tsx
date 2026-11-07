import { notFound } from 'next/navigation';
import { z } from 'zod';
import { ProjectsView } from '@/features/projects/ProjectsView';
import { getUserHousehold, listChildHouseholds } from '@/server/households/queries';
import { requirePageSession } from '@/server/session';

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Поездки',
};

export default async function ProjectsPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}/projects`);
  if (!z.uuid().safeParse(id).success) {
    notFound();
  }

  const space = await getUserHousehold(user.id, id);
  if (!space) {
    notFound();
  }

  const projects = await listChildHouseholds(space.id);

  return <ProjectsView householdId={space.id} spaceName={space.name} projects={projects} />;
}
