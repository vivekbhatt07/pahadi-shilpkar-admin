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

import type { Banner } from '@/types/api';

import { BANNER_LIMITS } from '../constants';
import { describeSchedule, getBannerStatus } from '../helpers';
import BannerRow from './BannerRow';

type TBannerListProps = {
  /** In storefront order. */
  banners: Banner[];
  /** When the list was fetched — statuses are judged at that moment. */
  now: number;
  onReorder: (orderedIds: string[]) => void;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
};

/** Drag a row by its handle, or focus the handle and use Space + arrow keys. */
const BannerList = ({
  banners,
  now,
  onReorder,
  onEdit,
  onDelete,
}: TBannerListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const canReorder =
    banners.length > 1 && banners.length <= BANNER_LIMITS.REORDER_MAX;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = banners.findIndex((banner) => banner.id === active.id);
    const newIndex = banners.findIndex((banner) => banner.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(
      arrayMove(banners, oldIndex, newIndex).map((banner) => banner.id),
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={banners.map((banner) => banner.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul>
          {banners.map((banner) => {
            const status = getBannerStatus(banner, now);
            return (
              <BannerRow
                key={banner.id}
                banner={banner}
                status={status}
                schedule={describeSchedule(banner, status, now)}
                canReorder={canReorder}
                onEdit={() => onEdit(banner)}
                onDelete={() => onDelete(banner)}
              />
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

export default BannerList;
