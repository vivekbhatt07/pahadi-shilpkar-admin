import { Skeleton } from '@/components/ui/skeleton';

/** Placeholder rows for the dashboard's list panels. */
const ListSkeletonRows = ({ avatar }: { avatar: 'square' | 'circle' }) => (
  <ul className="divide-y divide-stone-100 dark:divide-stone-800">
    {Array.from({ length: 3 }).map((_, index) => (
      <li
        key={index}
        className="flex items-center gap-3 px-3 py-3 sm:px-4 md:px-6"
      >
        <Skeleton
          className={
            avatar === 'circle' ? 'size-9 rounded-full' : 'size-10 rounded-md'
          }
        />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2 rounded" />
          <Skeleton className="h-2.5 w-1/4 rounded" />
        </div>
      </li>
    ))}
  </ul>
);

export default ListSkeletonRows;
