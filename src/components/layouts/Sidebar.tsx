import { useEffect, useState } from 'react';
import { NavLink, useLocation, useMatch, useResolvedPath } from 'react-router';
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from 'lucide-react';

import BrandMark from '@/components/custom/BrandMark';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { useStats } from '@/hooks/stats';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebarStore';

import { NAV_SECTIONS, SETTINGS_ITEMS, type TNavItem } from './navigation';

const itemBaseClass =
  'group/nav relative flex items-center rounded-lg text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent-500/40';

const activeItemClass =
  'bg-accent-50 text-accent-700 dark:bg-accent-950/50 dark:text-accent-300';

const inactiveItemClass =
  'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/70 dark:hover:text-stone-50';

/** Small accent pill on the left edge of the active item. */
const ActiveMarker = ({ isActive }: { isActive: boolean }) => (
  <span
    aria-hidden
    className={cn(
      'absolute top-1/2 left-0 h-4 w-0.75 -translate-y-1/2 rounded-r-full bg-accent-500 transition-all duration-300 ease-out-expo dark:bg-accent-400',
      isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0',
    )}
  />
);

/** How many inquiries nobody has opened yet; a dot while collapsed. */
const NewInquiriesBadge = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { data } = useStats();
  const count = data?.inquiries.new ?? 0;
  if (count === 0) return null;

  return (
    <>
      <span className="sr-only">, {count} new</span>
      {isCollapsed ? (
        <span
          aria-hidden
          className="absolute top-1.5 right-3 size-2 rounded-full bg-accent-500 ring-2 ring-white dark:bg-accent-400 dark:ring-stone-950"
        />
      ) : (
        <span
          aria-hidden
          className="ml-auto min-w-5 rounded-full bg-accent-600 px-1.5 text-center text-[11px] leading-4.5 font-semibold text-white tabular-nums dark:bg-accent-500"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </>
  );
};

type TSidebarLinkProps = {
  item: TNavItem;
  isCollapsed: boolean;
  onNavigate: () => void;
};

const SidebarLink = ({ item, isCollapsed, onNavigate }: TSidebarLinkProps) => {
  const Icon = item.icon;
  // Resolve "active" here rather than via NavLink's function className: the
  // tooltip's Slot string-joins className and would stringify the function.
  const resolved = useResolvedPath(item.to);
  const isActive = Boolean(
    useMatch({
      path: item.matchPath ?? resolved.pathname,
      end: item.end ?? false,
    }),
  );

  return (
    <SimpleTooltip label={item.label} side="right" disabled={!isCollapsed}>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={cn(
          itemBaseClass,
          'h-9',
          isCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
          isActive ? activeItemClass : inactiveItemClass,
        )}
      >
        <ActiveMarker isActive={isActive} />
        <Icon
          size={17}
          className={cn(
            'shrink-0 transition-transform duration-200 group-hover/nav:scale-110',
            isActive
              ? 'text-accent-600 dark:text-accent-400'
              : 'text-stone-400 group-hover/nav:text-stone-600 dark:text-stone-500 dark:group-hover/nav:text-stone-300',
          )}
        />
        {/* Kept for screen readers while collapsed, so a badge's count joins the name */}
        <span className={isCollapsed ? 'sr-only' : 'truncate'}>
          {item.label}
        </span>
        {item.badge === 'newInquiries' && (
          <NewInquiriesBadge isCollapsed={isCollapsed} />
        )}
      </NavLink>
    </SimpleTooltip>
  );
};

type TSidebarContentProps = {
  isCollapsed: boolean;
  onNavigate: () => void;
};

const SidebarNav = ({ isCollapsed, onNavigate }: TSidebarContentProps) => {
  const { pathname } = useLocation();
  const isOnSettings = pathname.startsWith(ROUTES.PRIVATE.SETTINGS.ROOT);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(isOnSettings);
  const [wasOnSettings, setWasOnSettings] = useState(isOnSettings);

  // Auto-expand when navigating into settings (adjusting state during render
  // instead of in an effect avoids a cascading re-render).
  if (isOnSettings !== wasOnSettings) {
    setWasOnSettings(isOnSettings);
    if (isOnSettings) setIsSettingsExpanded(true);
  }

  return (
    <nav className="flex flex-col gap-4 px-3" aria-label="Main">
      {NAV_SECTIONS.map((section, index) => (
        <div key={section.label} className="flex flex-col gap-0.5">
          {isCollapsed ? (
            index > 0 && (
              <div
                aria-hidden
                className="mx-auto mb-1 h-px w-5 bg-stone-200 dark:bg-stone-800"
              />
            )
          ) : (
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider whitespace-nowrap text-stone-400 uppercase dark:text-stone-500">
              {section.label}
            </p>
          )}
          {section.items.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              isCollapsed={isCollapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}

      <div className="flex flex-col gap-0.5">
        {isCollapsed ? (
          <>
            <div
              aria-hidden
              className="mx-auto mb-1 h-px w-5 bg-stone-200 dark:bg-stone-800"
            />
            <SidebarLink
              item={{
                label: 'Settings',
                to: ROUTES.PRIVATE.SETTINGS.PROFILE,
                matchPath: ROUTES.PRIVATE.SETTINGS.ROOT,
                icon: Settings,
              }}
              isCollapsed
              onNavigate={onNavigate}
            />
          </>
        ) : (
          <>
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider whitespace-nowrap text-stone-400 uppercase dark:text-stone-500">
              Account
            </p>
            <button
              type="button"
              onClick={() => setIsSettingsExpanded((prev) => !prev)}
              aria-expanded={isSettingsExpanded}
              className={cn(
                itemBaseClass,
                'h-9 w-full gap-3 px-3',
                isOnSettings ? activeItemClass : inactiveItemClass,
              )}
            >
              <ActiveMarker isActive={isOnSettings && !isSettingsExpanded} />
              <Settings
                size={17}
                className={cn(
                  'shrink-0 transition-transform duration-500 group-hover/nav:rotate-45',
                  isOnSettings
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-stone-400 group-hover/nav:text-stone-600 dark:text-stone-500 dark:group-hover/nav:text-stone-300',
                )}
              />
              <span className="flex-1 truncate text-left">Settings</span>
              <ChevronDown
                size={14}
                className={cn(
                  'shrink-0 text-stone-400 transition-transform duration-200',
                  isSettingsExpanded && 'rotate-180',
                )}
              />
            </button>

            {/* grid-rows 0fr → 1fr animates to the content's natural height */}
            <div
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-300 ease-out-expo',
                isSettingsExpanded
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0',
              )}
              inert={!isSettingsExpanded}
            >
              <div className="overflow-hidden">
                <div className="relative mt-0.5 ml-5.25 flex flex-col gap-0.5 border-l border-stone-200 pl-2 dark:border-stone-800">
                  {SETTINGS_ITEMS.map(({ label, to, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          itemBaseClass,
                          'h-8 gap-2.5 px-2.5 text-[13px]',
                          isActive ? activeItemClass : inactiveItemClass,
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={14}
                            className={cn(
                              'shrink-0',
                              isActive
                                ? 'text-accent-600 dark:text-accent-400'
                                : 'text-stone-400 dark:text-stone-500',
                            )}
                          />
                          {label}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

const Sidebar = () => {
  const { isOpen, isCollapsed, close, toggleCollapsed } = useSidebarStore();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-stone-200/80 md:flex dark:border-stone-800',
          'bg-white/50 dark:bg-stone-900/20',
          'overflow-x-hidden overflow-y-auto transition-[width] duration-300 ease-out-expo',
          isCollapsed ? 'w-17' : 'w-60',
        )}
      >
        <div className="flex-1 py-4">
          <SidebarNav isCollapsed={isCollapsed} onNavigate={() => {}} />
        </div>

        <div className="sticky bottom-0 border-t border-stone-200/80 bg-inherit p-3 dark:border-stone-800">
          <SimpleTooltip
            label="Expand sidebar"
            side="right"
            disabled={!isCollapsed}
          >
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                itemBaseClass,
                'h-9 w-full',
                isCollapsed ? 'justify-center' : 'gap-3 px-3',
                inactiveItemClass,
              )}
            >
              {isCollapsed ? (
                <PanelLeftOpen size={17} className="shrink-0 text-stone-400" />
              ) : (
                <>
                  <PanelLeftClose
                    size={17}
                    className="shrink-0 text-stone-400"
                  />
                  <span className="whitespace-nowrap">Collapse</span>
                </>
              )}
            </button>
          </SimpleTooltip>
        </div>
      </aside>

      {/* Mobile drawer — always mounted so it can animate in and out */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          !isOpen && 'pointer-events-none',
        )}
        inert={!isOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-stone-950/40 backdrop-blur-sm transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={close}
        />
        <aside
          aria-label="Navigation"
          className={cn(
            'absolute top-0 left-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto',
            'border-r border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950',
            'transition-[translate,box-shadow] duration-300 ease-out-expo',
            // Shadow only while open, or it bleeds onto the page edge.
            isOpen
              ? 'translate-x-0 shadow-2xl'
              : '-translate-x-full shadow-none',
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200/80 px-4 dark:border-stone-800">
            <BrandMark showName />
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-50"
            >
              <X size={18} />
            </button>
          </div>
          <div className="py-4">
            <SidebarNav isCollapsed={false} onNavigate={close} />
          </div>
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
