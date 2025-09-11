'use client';

import { use } from 'react';
import PlanningManager from '@/components/planning/PlanningManager';

export default function PlanningProjetPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <PlanningManager projetId={id} />
    </div>
  );
}
