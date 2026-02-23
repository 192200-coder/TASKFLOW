// src/components/tasks/PriorityBadge.tsx
import { Priority } from '@/lib/types/task';

const priorityConfig = {
  Alta:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Alta' },
  Media: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Media' },
  Baja:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Baja' },
};

interface PriorityBadgeProps {
  priority: Priority;
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const config = priorityConfig[priority];

  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};