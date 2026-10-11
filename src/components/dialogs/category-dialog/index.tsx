import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

import Callout from '@/components/custom/Callout';
import CategoryTreePicker from '@/components/custom/CategoryTreePicker';
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
import { useCreateCategory, useUpdateCategory } from '@/hooks/categories';
import type { CategoryWithCount, UpdateCategoryPayload } from '@/types/api';

import { CATEGORY_FORM_FIELD_NAMES, CATEGORY_LIMITS } from './constants';
import { categoryFormSchema } from './schemas';
import type { TCategoryFormData } from './types';

type TCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog edits; otherwise it creates. */
  category?: CategoryWithCount | null;
  /** Pre-selects a parent when creating (e.g. "Add subcategory" from a tree row). */
  defaultParentId?: string | null;
};

const toFormData = (
  category?: CategoryWithCount | null,
  defaultParentId: string | null = null,
): TCategoryFormData => ({
  name: category?.name ?? '',
  slug: category?.slug ?? '',
  description: category?.description ?? '',
  image: category?.image ?? '',
  parentId: category ? category.parentId : defaultParentId,
  isActive: category?.isActive ?? true,
});

const CategoryDialog = ({
  open,
  onOpenChange,
  category,
  defaultParentId = null,
}: TCategoryDialogProps) => {
  const isEdit = Boolean(category);
  const { NAME, SLUG, DESCRIPTION, IMAGE, PARENT_ID, IS_ACTIVE } =
    CATEGORY_FORM_FIELD_NAMES;

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isPending = createCategory.isPending || updateCategory.isPending;

  const form = useForm<TCategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: toFormData(category, defaultParentId),
  });

  useEffect(() => {
    if (open) form.reset(toFormData(category, defaultParentId));
  }, [open, category, defaultParentId, form]);

  const { control } = form;
  const nameValue = useWatch({ control, name: NAME });
  const slugValue = useWatch({ control, name: SLUG });
  const descriptionValue = useWatch({ control, name: DESCRIPTION }) ?? '';
  const isRenaming = isEdit && nameValue.trim() !== category?.name;
  const isSlugChanged = isEdit && slugValue.trim() !== (category?.slug ?? '');

  const handleClose = () => {
    if (!isPending) onOpenChange(false);
  };

  const handleSubmit = (data: TCategoryFormData) => {
    const onError = (error: unknown) => {
      applyApiFieldErrors(form, error);
    };

    if (isEdit && category) {
      // Send only changed fields; re-sending an unchanged name would still
      // regenerate the slug.
      const payload = pickChangedFields(toFormData(category), data);
      if (Object.keys(payload).length === 0) {
        onOpenChange(false);
        return;
      }
      const body: UpdateCategoryPayload = {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.slug !== undefined &&
          payload.slug && { slug: payload.slug }),
        ...(payload.description !== undefined && {
          description: payload.description || null,
        }),
        ...(payload.image !== undefined && { image: payload.image || null }),
        ...(payload.parentId !== undefined && { parentId: payload.parentId }),
        ...(payload.isActive !== undefined && { isActive: payload.isActive }),
      };
      updateCategory.mutate(
        { id: category.id, payload: body },
        { onSuccess: () => onOpenChange(false), onError },
      );
      return;
    }

    createCategory.mutate(
      {
        name: data.name,
        ...(data.slug && { slug: data.slug }),
        ...(data.description && { description: data.description }),
        ...(data.image && { image: data.image }),
        parentId: data.parentId,
        isActive: data.isActive,
      },
      { onSuccess: () => onOpenChange(false), onError },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit category' : 'New category'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the category details.'
              : 'Categories group products on the storefront and can be nested to any depth.'}
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
                name={NAME}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Festive & Pooja"
                        maxLength={CATEGORY_LIMITS.NAME_MAX}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isRenaming && (
                <Callout variant="warning">
                  Renaming regenerates the slug (unless you set a custom one
                  below) and{' '}
                  <span className="font-medium">
                    breaks existing storefront URLs
                  </span>{' '}
                  for this category.
                </Callout>
              )}

              <FormField
                control={form.control}
                name={SLUG}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>Custom slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Leave blank to auto-generate from the name"
                        maxLength={CATEGORY_LIMITS.SLUG_MAX}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    {isEdit && category && (
                      <FormDescription>
                        Current slug:{' '}
                        <span className="font-mono">{category.slug}</span>
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSlugChanged && !isRenaming && (
                <Callout variant="warning">
                  Changing the slug{' '}
                  <span className="font-medium">
                    breaks existing storefront URLs
                  </span>{' '}
                  for this category.
                </Callout>
              )}

              <FormField
                control={form.control}
                name={PARENT_ID}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>Parent category</FormLabel>
                    <FormControl>
                      <CategoryTreePicker
                        value={field.value}
                        onChange={field.onChange}
                        excludeId={category?.id}
                        allowNone
                        noneLabel="No parent (top level)"
                        disabled={isPending}
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
                      <FormLabel optional>Description</FormLabel>
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        {descriptionValue.length}/
                        {CATEGORY_LIMITS.DESCRIPTION_MAX}
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="A short description shown on the storefront…"
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
                name={IMAGE}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>Image</FormLabel>
                    <FormControl>
                      <ImageUrlInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={isPending}
                        alt={nameValue || 'Category image'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={IS_ACTIVE}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-2.5 dark:border-stone-700 dark:bg-stone-800/30">
                    <div className="flex flex-col gap-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive hides this category and its whole subtree from
                        the storefront.
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
                {isEdit ? 'Save changes' : 'Create category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
