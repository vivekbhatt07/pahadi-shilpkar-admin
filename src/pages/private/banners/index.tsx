import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GalleryHorizontalEnd, Plus } from 'lucide-react';

import Callout from '@/components/custom/Callout';
import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Button } from '@/components/ui/button';
import { QUERY_KEYS } from '@/constants/query-key';
import {
  useBanners,
  useDeleteBanner,
  useReorderBanners,
} from '@/hooks/banners';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Banner } from '@/types/api';

import { getBannerStatus } from './helpers';
import BannerDialog from './layouts/BannerDialog';
import BannerList from './layouts/BannerList';

type TDialogState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; banner: Banner }
  | { type: 'delete'; banner: Banner };

/** Admins see every banner — hidden, scheduled and ended ones too. */
const LIST_PARAMS = { includeInactive: true };

const BannersPage = () => {
  useDocumentTitle('Banners');
  const banners = useBanners(LIST_PARAMS);
  const reorderBanners = useReorderBanners();
  const deleteBanner = useDeleteBanner();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<TDialogState>({ type: 'closed' });

  const items = banners.data ?? [];
  // Statuses are judged as of the fetch, the same moment the server's isLive was
  const now = banners.dataUpdatedAt;
  const liveCount = items.filter(
    (banner) => getBannerStatus(banner, now) === 'live',
  ).length;

  const closeDialog = () => setDialog({ type: 'closed' });

  const handleReorder = (orderedIds: string[]) => {
    // Optimistic: the drop shows the new order straight away; the refetch
    // after the request reconciles it either way.
    queryClient.setQueryData<Banner[]>(
      QUERY_KEYS.BANNERS.LIST(LIST_PARAMS),
      (old) => {
        if (!old) return old;
        const byId = new Map(old.map((banner) => [banner.id, banner]));
        return orderedIds.flatMap((id, index) => {
          const banner = byId.get(id);
          return banner ? [{ ...banner, sortOrder: index }] : [];
        });
      },
    );
    reorderBanners.mutate({
      items: orderedIds.map((id, index) => ({ id, sortOrder: index })),
    });
  };

  const handleDelete = () => {
    if (dialog.type !== 'delete') return;
    deleteBanner.mutate(dialog.banner.id, { onSuccess: closeDialog });
  };

  const newBannerButton = (
    <Button onClick={() => setDialog({ type: 'create' })}>
      <Plus />
      New banner
    </Button>
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Banners"
        count={items.length > 0 ? items.length : undefined}
        description="Slides at the top of the storefront home page. Drag to set the order — shoppers only see the live ones."
        actions={newBannerButton}
      />

      {banners.isPending ? (
        <ListSkeleton rows={3} trailing={2} />
      ) : items.length > 0 ? (
        <>
          {liveCount === 0 && (
            <Callout variant="info" title="No banner is live right now">
              The home page opens with the brand hero until one is switched on
              and inside its schedule.
            </Callout>
          )}
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700/60 dark:bg-stone-900">
            <BannerList
              banners={items}
              now={now}
              onReorder={handleReorder}
              onEdit={(banner) => setDialog({ type: 'edit', banner })}
              onDelete={(banner) => setDialog({ type: 'delete', banner })}
            />
          </div>
        </>
      ) : (
        <EmptyState
          icon={<GalleryHorizontalEnd className="size-5" />}
          title="No banners yet"
          description="Promote a festival sale, a new collection or a gift set at the top of the home page. Schedule it to start and end on its own."
          action={newBannerButton}
        />
      )}

      <BannerDialog
        open={dialog.type === 'create' || dialog.type === 'edit'}
        onOpenChange={(open) => !open && closeDialog()}
        banner={dialog.type === 'edit' ? dialog.banner : null}
      />

      <ConfirmDialog
        open={dialog.type === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Delete banner"
        variant="destructive"
        confirmLabel="Delete banner"
        isPending={deleteBanner.isPending}
        onConfirm={handleDelete}
        description={
          <p>
            This permanently deletes{' '}
            <span className="font-medium text-stone-900 dark:text-stone-50">
              {dialog.type === 'delete' ? dialog.banner.title : ''}
            </span>
            . To take it down for now, switch it off instead.
          </p>
        }
      />
    </div>
  );
};

export default BannersPage;
