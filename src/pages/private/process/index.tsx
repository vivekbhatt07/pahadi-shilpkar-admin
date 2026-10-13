import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Hammer, ListOrdered, Plus } from 'lucide-react';

import Callout from '@/components/custom/Callout';
import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QUERY_KEYS } from '@/constants/query-key';
import {
  useDeleteProcessStep,
  useProcess,
  useReorderProcessSteps,
} from '@/hooks/process';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Process, ProcessStep } from '@/types/api';

import PageForm from './layouts/PageForm';
import StepDialog from './layouts/StepDialog';
import StepList from './layouts/StepList';

type TDialogState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; step: ProcessStep }
  | { type: 'delete'; step: ProcessStep };

/** Admins see every step — the switched-off ones too. */
const PROCESS_PARAMS = { includeInactive: true };

/**
 * The storefront's "How we make it" page: its headline, intro, photo and
 * figures, then the steps from raw material to finished piece — drag them
 * into order, switch drafts off.
 */
const ProcessPage = () => {
  useDocumentTitle('How we make it');
  const process = useProcess(PROCESS_PARAMS);
  const reorderSteps = useReorderProcessSteps();
  const deleteStep = useDeleteProcessStep();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<TDialogState>({ type: 'closed' });

  const steps = process.data?.steps ?? [];
  const liveCount = steps.filter((step) => step.isActive).length;
  const closeDialog = () => setDialog({ type: 'closed' });

  const handleReorder = (orderedIds: string[]) => {
    // Optimistic: the drop shows the new order straight away; the refetch
    // after the request reconciles it either way.
    queryClient.setQueryData<Process>(
      QUERY_KEYS.PROCESS.GET(PROCESS_PARAMS),
      (old) => {
        if (!old) return old;
        const byId = new Map(old.steps.map((step) => [step.id, step]));
        return {
          ...old,
          steps: orderedIds.flatMap((id, index) => {
            const step = byId.get(id);
            return step ? [{ ...step, sortOrder: index }] : [];
          }),
        };
      },
    );
    reorderSteps.mutate({
      items: orderedIds.map((id, index) => ({ id, sortOrder: index })),
    });
  };

  const handleDelete = () => {
    if (dialog.type !== 'delete') return;
    deleteStep.mutate(dialog.step.id, { onSuccess: closeDialog });
  };

  const newStepButton = (
    <Button onClick={() => setDialog({ type: 'create' })}>
      <Plus />
      New step
    </Button>
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="How we make it"
        description="The storefront page that tells how a piece is made, step by step. It's linked from the storefront's menu once it has a step that's on."
        actions={steps.length > 0 ? newStepButton : undefined}
      />

      {process.isPending ? (
        <div className="flex flex-col gap-6" role="status" aria-label="Loading">
          <Skeleton className="h-96 w-full rounded-xl" />
          <ListSkeleton rows={3} trailing={2} />
        </div>
      ) : process.data ? (
        <>
          {steps.length > 0 && liveCount === 0 && (
            <Callout
              variant="info"
              title="The page isn't on the storefront yet"
            >
              Every step is switched off, so shoppers don't see the page or the
              link to it. Switch one on when it's ready.
            </Callout>
          )}

          <Card className="gap-0 sm:gap-0 md:gap-0">
            <CardHeader className="border-b border-stone-100 pb-4 dark:border-stone-800">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ListOrdered className="size-4 text-stone-400" />
                Steps
              </CardTitle>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                From raw material to the finished piece. Drag to set the order —
                shoppers see the ones that are on, numbered in this order.
              </p>
            </CardHeader>
            <CardContent className="px-0 sm:px-0 md:px-0">
              {steps.length > 0 ? (
                <StepList
                  steps={steps}
                  onReorder={handleReorder}
                  onEdit={(step) => setDialog({ type: 'edit', step })}
                  onDelete={(step) => setDialog({ type: 'delete', step })}
                />
              ) : (
                <EmptyState
                  icon={<Hammer className="size-5" />}
                  title="No steps yet"
                  description="Choosing the wood, seasoning it, carving, finishing… Add each step with a photo, and the page goes live on the storefront."
                  action={newStepButton}
                  className="py-10"
                />
              )}
            </CardContent>
          </Card>

          <PageForm page={process.data.page} />
        </>
      ) : null}

      <StepDialog
        open={dialog.type === 'create' || dialog.type === 'edit'}
        onOpenChange={(open) => !open && closeDialog()}
        step={dialog.type === 'edit' ? dialog.step : null}
        nextNumber={liveCount + 1}
      />

      <ConfirmDialog
        open={dialog.type === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Delete step"
        variant="destructive"
        confirmLabel="Delete step"
        isPending={deleteStep.isPending}
        onConfirm={handleDelete}
        description={
          <p>
            This permanently deletes{' '}
            <span className="font-medium text-stone-900 dark:text-stone-50">
              {dialog.type === 'delete' ? dialog.step.title : ''}
            </span>
            . To take it off the page for now, switch it off instead.
          </p>
        }
      />
    </div>
  );
};

export default ProcessPage;
