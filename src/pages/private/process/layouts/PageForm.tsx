import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import { FileText } from 'lucide-react';

import FormActionBar from '@/components/custom/FormActionBar';
import ImageUrlInput from '@/components/custom/ImageUrlInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { applyApiFieldErrors, pickChangedFields } from '@/helpers/form';
import { useUpdateProcessPage } from '@/hooks/process';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import type { ProcessPage } from '@/types/api';

import {
  PROCESS_DEFAULT_COPY,
  PROCESS_LIMITS,
  PROCESS_PAGE_FORM_FIELD_NAMES,
} from '../constants';
import { toPageFormData, toPagePayload } from '../helpers';
import { processPageFormSchema } from '../schemas';
import type { TProcessPageFormData } from '../types';
import StatsField from './StatsField';

const { TITLE, INTRO, HERO_IMAGE } = PROCESS_PAGE_FORM_FIELD_NAMES;

const CharacterCount = ({ value, max }: { value: string; max: number }) => (
  <span className="text-xs text-stone-400 tabular-nums dark:text-stone-500">
    {value.length}/{max}
  </span>
);

/** The words and photo at the top of the page, and its headline figures. */
const PageForm = ({ page }: { page: ProcessPage }) => {
  const updatePage = useUpdateProcessPage();

  const form = useForm<TProcessPageFormData>({
    resolver: zodResolver(processPageFormSchema),
    defaultValues: toPageFormData(page),
  });

  useEffect(() => {
    form.reset(toPageFormData(page));
  }, [page, form]);

  const { control } = form;
  const title = useWatch({ control, name: TITLE }) ?? '';
  const intro = useWatch({ control, name: INTRO }) ?? '';
  // useFormState (not form.formState) so the React Compiler sees fresh state.
  const { isDirty } = useFormState({ control });
  useUnsavedChangesWarning(isDirty && !updatePage.isPending);
  const isPending = updatePage.isPending;

  const handleSubmit = (data: TProcessPageFormData) => {
    const changed = pickChangedFields(toPageFormData(page), data);
    if (Object.keys(changed).length === 0) return;
    updatePage.mutate(toPagePayload(changed), {
      onError: (error) => applyApiFieldErrors(form, error),
    });
  };

  return (
    <Card>
      <CardHeader className="border-b border-stone-100 pb-4 dark:border-stone-800">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="size-4 text-stone-400" />
          The page
        </CardTitle>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Leave a field empty to use the storefront's own words.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-5"
          >
            <FormField
              control={control}
              name={TITLE}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel optional>Headline</FormLabel>
                    <CharacterCount
                      value={title}
                      max={PROCESS_LIMITS.TITLE_MAX}
                    />
                  </div>
                  <FormControl>
                    <Input
                      placeholder={PROCESS_DEFAULT_COPY.TITLE}
                      maxLength={PROCESS_LIMITS.TITLE_MAX}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={INTRO}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel optional>Intro</FormLabel>
                    <CharacterCount
                      value={intro}
                      max={PROCESS_LIMITS.INTRO_MAX}
                    />
                  </div>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder={PROCESS_DEFAULT_COPY.INTRO}
                      maxLength={PROCESS_LIMITS.INTRO_MAX}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A few sentences on who makes the pieces and where — shown
                    next to the photo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={HERO_IMAGE}
              render={({ field }) => (
                <FormItem>
                  <FormLabel optional>Photo</FormLabel>
                  <FormControl>
                    <ImageUrlInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isPending}
                      alt="Page photo"
                    />
                  </FormControl>
                  <FormDescription>
                    A landscape photo (4:3), e.g. an artisan at work. Without
                    one, the page shows the hills illustration.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <p className="text-sm leading-none font-medium text-stone-700 dark:text-stone-300">
                Headline figures
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Up to 4 numbers that tell the story at a glance — artisans,
                villages, hours per piece.
              </p>
              <StatsField disabled={isPending} />
            </div>

            <FormActionBar
              isDirty={isDirty}
              isPending={isPending}
              submitLabel="Save page"
              secondaryLabel="Reset"
              onSecondary={() => form.reset(toPageFormData(page))}
              secondaryRequiresDirty
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PageForm;
