import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, GripVertical, Pencil, Trash2, Video } from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { useUpdateProcessStep } from '@/hooks/process';
import { cn } from '@/lib/utils';
import type { ProcessStep } from '@/types/api';

type TStepRowProps = {
  step: ProcessStep;
  /** Its number on the storefront, counting only the steps that are on. */
  number: number | null;
  canReorder: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

const StepRow = ({
  step,
  number,
  canReorder,
  onEdit,
  onDelete,
}: TStepRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, disabled: !canReorder });
  const updateStep = useUpdateProcessStep();

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-3 border-b border-stone-100 bg-white py-3 pr-3 pl-2 transition-colors last:border-b-0 sm:pr-4 dark:border-stone-800 dark:bg-stone-900',
        'hover:bg-stone-50/80 dark:hover:bg-stone-800/30',
        isDragging &&
          'relative z-10 rounded-lg border-transparent shadow-xl ring-2 ring-accent-500/40 dark:bg-stone-800',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={!canReorder}
        aria-label={`Reorder ${step.title}`}
        className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded p-0.5 text-stone-300 transition-colors group-hover:text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:outline-none active:cursor-grabbing disabled:cursor-default disabled:opacity-40 dark:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
      >
        <GripVertical className="size-4" />
      </button>

      <span
        aria-hidden
        className={cn(
          'w-7 shrink-0 text-center text-lg font-semibold tabular-nums',
          number === null
            ? 'text-stone-300 dark:text-stone-600'
            : 'text-accent-600 dark:text-accent-400',
        )}
      >
        {number === null ? '–' : String(number).padStart(2, '0')}
      </span>

      {/* Too small to recognise on a phone — the title does the job there */}
      <ImageThumb
        src={step.image}
        alt={step.title}
        className={cn(
          'hidden aspect-4/3 w-20 transition-opacity sm:flex',
          !step.isActive && 'opacity-60',
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={onEdit}
            className="min-w-0 cursor-pointer truncate text-left text-sm font-medium text-stone-900 transition-colors hover:text-accent-600 dark:text-stone-50 dark:hover:text-accent-400"
          >
            {step.title}
          </button>
          {!step.isActive && <Badge variant="outline">Hidden</Badge>}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-stone-500 dark:text-stone-400">
          {step.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400 [&_svg]:size-3.5 [&_svg]:shrink-0">
          {step.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock />
              {step.duration}
            </span>
          )}
          {step.videoUrl && (
            <span className="inline-flex items-center gap-1">
              <Video />
              Video
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <SimpleTooltip
          label={
            step.isActive
              ? 'On — shown on the storefront'
              : 'Off — hidden from the storefront'
          }
        >
          <span className="mr-1.5 inline-flex">
            <Switch
              checked={step.isActive}
              onCheckedChange={(checked) =>
                updateStep.mutate({
                  id: step.id,
                  payload: { isActive: checked },
                })
              }
              disabled={updateStep.isPending}
              aria-label={
                step.isActive ? `Hide ${step.title}` : `Show ${step.title}`
              }
            />
          </span>
        </SimpleTooltip>
        <SimpleTooltip label="Edit">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${step.title}`}
          >
            <Pencil className="text-stone-400" />
          </Button>
        </SimpleTooltip>
        <SimpleTooltip label="Delete">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label={`Delete ${step.title}`}
            className="text-stone-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
          >
            <Trash2 />
          </Button>
        </SimpleTooltip>
      </div>
    </li>
  );
};

export default StepRow;
