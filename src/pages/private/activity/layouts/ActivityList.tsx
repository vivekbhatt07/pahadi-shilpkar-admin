import { Link as RouterLink } from 'react-router';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDateTime, getDisplayName, getInitials } from '@/helpers/format';
import type { AdminActivity } from '@/types/api';

import { activityLink, describeActivity, fieldLabel } from '../helpers';

/** More fields than this end in "+N". */
const FIELDS_SHOWN = 6;

type TActivityListProps = {
  activities: AdminActivity[];
  /** Without the fields — the dashboard's short list. */
  compact?: boolean;
};

/** Who changed what, and when — newest first, as the API sends them. */
const ActivityList = ({ activities, compact = false }: TActivityListProps) => (
  <ul className="divide-y divide-stone-100 dark:divide-stone-800">
    {activities.map((activity) => {
      const to = activityLink(activity);
      const name = activity.target?.name;

      return (
        <li key={activity.id} className="flex gap-3 px-3 py-3 sm:px-4 md:px-6">
          <Avatar className="size-8 shrink-0 border border-stone-200 dark:border-stone-800">
            <AvatarImage
              src={activity.user?.avatar || undefined}
              alt={getDisplayName(activity.user)}
            />
            <AvatarFallback className="bg-stone-100 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              {getInitials(activity.user)}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm text-stone-700 dark:text-stone-300">
              {describeActivity(activity)}
              {name &&
                (to ? (
                  <>
                    {' '}
                    <RouterLink
                      to={to}
                      className="font-medium text-stone-900 hover:text-accent-600 dark:text-stone-50 dark:hover:text-accent-400"
                    >
                      {name}
                    </RouterLink>
                  </>
                ) : (
                  <span className="font-medium text-stone-900 dark:text-stone-50">
                    {' '}
                    {name}
                  </span>
                ))}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {activity.user
                ? getDisplayName(activity.user)
                : 'An admin since removed'}{' '}
              · {formatDateTime(activity.createdAt)}
            </p>
            {!compact && activity.fields.length > 0 && (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Changed:{' '}
                {activity.fields
                  .slice(0, FIELDS_SHOWN)
                  .map(fieldLabel)
                  .join(', ')}
                {activity.fields.length > FIELDS_SHOWN &&
                  ` +${activity.fields.length - FIELDS_SHOWN}`}
              </p>
            )}
          </div>
        </li>
      );
    })}
  </ul>
);

export default ActivityList;
