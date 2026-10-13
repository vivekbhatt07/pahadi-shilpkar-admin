import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import type { ProcessStep } from '@/types/api';

import { PROCESS_LIMITS } from '../constants';
import StepRow from './StepRow';

type TStepListProps = {
  /** In storefront order. */
  steps: ProcessStep[];
  onReorder: (orderedIds: string[]) => void;
  onEdit: (step: ProcessStep) => void;
  onDelete: (step: ProcessStep) => void;
};

/** Each step's number on the storefront — hidden steps don't count. */
const storefrontNumbers = (steps: ProcessStep[]) => {
  let shown = 0;
  return steps.map((step) => (step.isActive ? ++shown : null));
};

/** Drag a row by its handle, or focus the handle and use Space + arrow keys. */
const StepList = ({ steps, onReorder, onEdit, onDelete }: TStepListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const canReorder =
    steps.length > 1 && steps.length <= PROCESS_LIMITS.REORDER_MAX;
  const numbers = storefrontNumbers(steps);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((step) => step.id === active.id);
    const newIndex = steps.findIndex((step) => step.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(steps, oldIndex, newIndex).map((step) => step.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={steps.map((step) => step.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul>
          {steps.map((step, index) => (
            <StepRow
              key={step.id}
              step={step}
              number={numbers[index]}
              canReorder={canReorder}
              onEdit={() => onEdit(step)}
              onDelete={() => onDelete(step)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

export default StepList;
