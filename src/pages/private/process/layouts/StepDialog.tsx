import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

import ImageUrlInput from '@/components/custom/ImageUrlInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { applyApiFieldErrors, pickChangedFields } from '@/helpers/form';
import { useCreateProcessStep, useUpdateProcessStep } from '@/hooks/process';
import type { ProcessStep } from '@/types/api';

import { PROCESS_LIMITS, PROCESS_STEP_FORM_FIELD_NAMES } from '../constants';
import { toStepFormData, toStepPayload } from '../helpers';
import { processStepFormSchema } from '../schemas';
import type { TProcessStepFormData } from '../types';

type TStepDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog edits; otherwise it creates. */
  step?: ProcessStep | null;
  /** Its number on the storefront — for the new step's title. */
  nextNumber: number;
};

const { TITLE, DESCRIPTION, IMAGE, VIDEO_URL, DURATION, IS_ACTIVE } =
  PROCESS_STEP_FORM_FIELD_NAMES;

const CharacterCount = ({ value, max }: { value: string; max: number }) => (
  <span className="text-xs text-stone-400 tabular-nums dark:text-stone-500">
    {value.length}/{max}
  </span>
);

const StepDialog = ({
  open,
  onOpenChange,
  step,
  nextNumber,
}: TStepDialogProps) => {
  const isEdit = Boolean(step);
  const createStep = useCreateProcessStep();
  const updateStep = useUpdateProcessStep();
  const isPending = createStep.isPending || updateStep.isPending;

  const form = useForm<TProcessStepFormData>({
    resolver: zodResolver(processStepFormSchema),
    defaultValues: toStepFormData(step),
  });

  useEffect(() => {
    if (open) form.reset(toStepFormData(step));
  }, [open, step, form]);

  const [title, description] = useWatch({
    control: form.control,
    name: [TITLE, DESCRIPTION],
  });

  const handleClose = () => {
    if (!isPending) onOpenChange(false);
  };

  const handleSubmit = (data: TProcessStepFormData) => {
    const options = {
      onSuccess: () => onOpenChange(false),
      onError: (error: unknown) => {
        applyApiFieldErrors(form, error);
      },
    };

    if (step) {
      const changed = pickChangedFields(toStepFormData(step), data);
      if (Object.keys(changed).length === 0) {
        onOpenChange(false);
        return;
      }
      updateStep.mutate(
        { id: step.id, payload: toStepPayload(changed) },
        options,
      );
      return;
    }

    createStep.mutate(
      {
        ...toStepPayload(data),
        title: data.title,
        description: data.description,
      },
      options,
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-xl md:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? 'Edit step'
              : `New step ${String(nextNumber).padStart(2, '0')}`}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Changes show on the storefront as soon as you save.'
              : 'New steps go last — drag them into order afterwards.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-px">
              <FormField
                control={form.control}
                name={TITLE}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel required>Title</FormLabel>
                      <CharacterCount
                        value={title ?? ''}
                        max={PROCESS_LIMITS.STEP_TITLE_MAX}
                      />
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Seasoning the deodar wood"
                        maxLength={PROCESS_LIMITS.STEP_TITLE_MAX}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={DESCRIPTION}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel required>What happens</FormLabel>
                      <CharacterCount
                        value={description ?? ''}
                        max={PROCESS_LIMITS.STEP_DESCRIPTION_MAX}
                      />
                    </div>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Logs from fallen trees rest under the eaves for six months, so the wood never cracks once carved…"
                        maxLength={PROCESS_LIMITS.STEP_DESCRIPTION_MAX}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Line breaks are kept on the storefront.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={IMAGE}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>Photo</FormLabel>
                    <FormControl>
                      <ImageUrlInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={isPending}
                        alt={title || 'Step photo'}
                      />
                    </FormControl>
                    <FormDescription>
                      A landscape photo (4:3) of this step — hands at work tell
                      the story best.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-[3fr_2fr]">
                <FormField
                  control={form.control}
                  name={VIDEO_URL}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>Video link</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://youtu.be/…"
                          maxLength={PROCESS_LIMITS.STEP_VIDEO_URL_MAX}
                          disabled={isPending}
                          onClear={() => field.onChange('')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={DURATION}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel optional>How long it takes</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="6 months"
                          maxLength={PROCESS_LIMITS.STEP_DURATION_MAX}
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="-mt-2 text-xs text-stone-500 sm:col-span-2 dark:text-stone-400">
                  YouTube or Vimeo links play on the page; shoppers press play
                  on the photo to start them.
                </p>
              </div>

              <FormField
                control={form.control}
                name={IS_ACTIVE}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-2.5 dark:border-stone-700 dark:bg-stone-800/30">
                    <div className="flex flex-col gap-0.5">
                      <FormLabel>On</FormLabel>
                      <FormDescription>
                        Shown on the storefront. Switch it off to keep it as a
                        draft.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                startAdornment={
                  isPending ? <Loader2 className="animate-spin" /> : undefined
                }
              >
                {isEdit ? 'Save changes' : 'Add step'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StepDialog;
