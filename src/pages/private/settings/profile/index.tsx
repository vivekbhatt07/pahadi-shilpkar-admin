import { useEffect } from 'react';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, UserRound } from 'lucide-react';

import FormActionBar from '@/components/custom/FormActionBar';
import ImageUrlInput from '@/components/custom/ImageUrlInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import { formatDate, getDisplayName, getInitials } from '@/helpers/format';
import { useUpdateProfile } from '@/hooks/auth';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { useAuthStore } from '@/store/authStore';
import type { UpdateProfilePayload, User } from '@/types/api';

import SettingsSection from '../components/SettingsSection';
import { PROFILE_FORM_FIELD_NAMES, PROFILE_LIMITS } from './constants';
import { profileFormSchema } from './schemas';
import type { TProfileFormData } from './types';

const toFormData = (user: User | null): TProfileFormData => ({
  firstName: user?.firstName ?? '',
  lastName: user?.lastName ?? '',
  email: user?.email ?? '',
  bio: user?.bio ?? '',
  avatar: user?.avatar ?? '',
});

const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useUpdateProfile();
  const { FIRST_NAME, LAST_NAME, EMAIL, BIO, AVATAR } =
    PROFILE_FORM_FIELD_NAMES;

  const form = useForm<TProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toFormData(user),
  });

  // Re-sync after /me hydration or a successful save.
  useEffect(() => {
    form.reset(toFormData(user));
  }, [user, form]);

  const { control } = form;
  const bioValue = useWatch({ control, name: BIO }) ?? '';
  const avatarValue = useWatch({ control, name: AVATAR });
  const firstNameValue = useWatch({ control, name: FIRST_NAME });
  const lastNameValue = useWatch({ control, name: LAST_NAME });
  const emailValue = useWatch({ control, name: EMAIL });
  // useFormState (not form.formState) so the React Compiler sees fresh state.
  const { isDirty } = useFormState({ control });
  useUnsavedChangesWarning(isDirty && !updateProfile.isPending);

  // The identity card previews unsaved edits live.
  const preview = {
    firstName: firstNameValue || null,
    lastName: lastNameValue || null,
    email: emailValue,
  };

  const handleSubmit = (data: TProfileFormData) => {
    const changed = pickChangedFields(toFormData(user), data);
    if (Object.keys(changed).length === 0) return;

    // Only changed keys are sent. Cleared optional fields are sent as null
    // (see the TODO on UpdateProfilePayload).
    const payload: UpdateProfilePayload = {
      ...(changed.firstName !== undefined && { firstName: changed.firstName }),
      ...(changed.lastName !== undefined && { lastName: changed.lastName }),
      ...(changed.email !== undefined && { email: changed.email }),
      ...(changed.bio !== undefined && { bio: changed.bio || null }),
      ...(changed.avatar !== undefined && { avatar: changed.avatar || null }),
    };

    updateProfile.mutate(payload, {
      onError: (error) => {
        applyApiFieldErrors(form, error);
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden py-0 sm:py-0 md:py-0">
        <div
          aria-hidden
          className="h-20 bg-linear-to-r from-accent-400/30 via-accent-500/20 to-accent-300/10 dark:from-accent-500/25 dark:via-accent-600/15 dark:to-transparent"
        />
        <div className="flex flex-col gap-4 px-4 pb-5 sm:flex-row sm:items-end sm:px-6">
          <Avatar className="-mt-10 size-20 border-4 border-white shadow-md dark:border-stone-900">
            <AvatarImage
              src={avatarValue || undefined}
              alt={getDisplayName(preview)}
            />
            <AvatarFallback className="bg-accent-50 text-xl font-semibold text-accent-700 dark:bg-accent-950 dark:text-accent-300">
              {getInitials(preview)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1 pb-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold text-stone-900 dark:text-stone-50">
                {getDisplayName(preview)}
              </p>
              {user && (
                <Badge variant="accent">
                  <ShieldCheck />
                  {user.role === 'ADMIN' ? 'Admin' : user.role}
                </Badge>
              )}
            </div>
            <p className="truncate text-sm text-stone-500 dark:text-stone-400">
              {emailValue}
              {user?.createdAt && ` · Joined ${formatDate(user.createdAt)}`}
            </p>
          </div>
        </div>
      </Card>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6"
        >
          <SettingsSection
            icon={<UserRound />}
            title="Personal details"
            description="How you appear across the admin panel."
          >
            <FormField
              control={form.control}
              name={AVATAR}
              render={({ field }) => (
                <FormItem>
                  <FormLabel optional>Profile photo</FormLabel>
                  <FormControl>
                    <ImageUrlInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      rounded="full"
                      alt="Avatar preview"
                      placeholder="https://example.com/avatar.jpg"
                      disabled={updateProfile.isPending}
                      variant="avatar"
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a photo or paste an image URL.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name={FIRST_NAME}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>First name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Vivek"
                        maxLength={PROFILE_LIMITS.NAME_MAX}
                        autoComplete="given-name"
                        disabled={updateProfile.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={LAST_NAME}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>Last name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Bhatt"
                        maxLength={PROFILE_LIMITS.NAME_MAX}
                        autoComplete="family-name"
                        disabled={updateProfile.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name={EMAIL}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      autoComplete="email"
                      disabled={updateProfile.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Used to sign in to this panel.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={BIO}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel optional>Bio</FormLabel>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {bioValue.length}/{PROFILE_LIMITS.BIO_MAX}
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="A short note about yourself…"
                      rows={4}
                      disabled={updateProfile.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SettingsSection>

          <FormActionBar
            isDirty={isDirty}
            isPending={updateProfile.isPending}
            submitLabel="Save changes"
            secondaryLabel="Reset"
            onSecondary={() => form.reset(toFormData(user))}
            secondaryRequiresDirty
          />
        </form>
      </Form>
    </div>
  );
};

export default ProfilePage;
