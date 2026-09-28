import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Check,
  CornerDownLeft,
  FolderPlus,
  Gift,
  Laptop,
  Loader2,
  LogOut,
  Moon,
  PanelLeft,
  Plus,
  Search,
  Sun,
  type LucideIcon,
} from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { NAV_SECTIONS, SETTINGS_ITEMS } from '@/components/layouts/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { ROUTES } from '@/constants/routes';
import { formatPrice } from '@/helpers/format';
import { useLogout } from '@/hooks/auth';
import { useProducts } from '@/hooks/products';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { useAppearanceStore, type TTheme } from '@/store/appearanceStore';
import { useCommandPaletteStore } from '@/store/commandPaletteStore';
import { useSidebarStore } from '@/store/sidebarStore';

type TCommand = {
  id: string;
  group: string;
  label: string;
  icon?: LucideIcon;
  /** Replaces the icon, e.g. a product thumbnail. */
  media?: React.ReactNode;
  hint?: string;
  keywords?: string;
  isSelected?: boolean;
  perform: () => void;
};

const MIN_PRODUCT_QUERY = 2;

const THEME_COMMANDS: { theme: TTheme; label: string; icon: LucideIcon }[] = [
  { theme: 'light', label: 'Light theme', icon: Sun },
  { theme: 'dark', label: 'Dark theme', icon: Moon },
  { theme: 'system', label: 'System theme', icon: Laptop },
];

const matches = (command: TCommand, query: string) => {
  if (!query) return true;
  const haystack =
    `${command.label} ${command.group} ${command.keywords ?? ''}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
};

/** Lives inside DialogContent, so its state resets every time it opens. */
const CommandPaletteBody = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const logout = useLogout();
  const theme = useAppearanceStore((state) => state.theme);
  const setTheme = useAppearanceStore((state) => state.setTheme);
  const toggleSidebar = useSidebarStore((state) => state.toggleCollapsed);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef(new Map<number, HTMLButtonElement>());

  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed, 300);
  const isProductSearch = debouncedQuery.length >= MIN_PRODUCT_QUERY;
  const productSearch = useProducts(
    { search: debouncedQuery, limit: 5, includeInactive: true },
    { enabled: isProductSearch },
  );

  const go = (to: string) => () => navigate(to);

  const staticCommands: TCommand[] = [
    ...NAV_SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        id: `nav-${item.to}`,
        group: 'Go to',
        label: item.label,
        icon: item.icon,
        keywords: item.keywords,
        perform: go(item.to),
      })),
    ),
    ...SETTINGS_ITEMS.map((item) => ({
      id: `settings-${item.to}`,
      group: 'Go to',
      label: `Settings: ${item.label}`,
      icon: item.icon,
      keywords: item.keywords,
      perform: go(item.to),
    })),
    {
      id: 'create-product',
      group: 'Create',
      label: 'New product',
      icon: Plus,
      keywords: 'add create item',
      perform: go(ROUTES.PRIVATE.PRODUCTS.CREATE),
    },
    {
      id: 'create-combo',
      group: 'Create',
      label: 'New combo',
      icon: Gift,
      keywords: 'add create bundle gift set pack',
      perform: go(ROUTES.PRIVATE.COMBOS.CREATE),
    },
    {
      id: 'create-category',
      group: 'Create',
      label: 'New category',
      icon: FolderPlus,
      keywords: 'add create',
      perform: go(`${ROUTES.PRIVATE.CATEGORIES}?new=1`),
    },
    ...THEME_COMMANDS.map((item) => ({
      id: `theme-${item.theme}`,
      group: 'Preferences',
      label: item.label,
      icon: item.icon,
      keywords: 'appearance mode switch',
      isSelected: theme === item.theme,
      perform: () => setTheme(item.theme),
    })),
    {
      id: 'toggle-sidebar',
      group: 'Preferences',
      label: 'Collapse or expand sidebar',
      icon: PanelLeft,
      keywords: 'menu navigation',
      perform: toggleSidebar,
    },
    {
      id: 'logout',
      group: 'Account',
      label: 'Log out',
      icon: LogOut,
      keywords: 'sign out exit',
      perform: logout,
    },
  ];

  const productCommands: TCommand[] =
    isProductSearch && trimmed.length >= MIN_PRODUCT_QUERY
      ? (productSearch.data?.items ?? []).map((product) => ({
          id: `product-${product.id}`,
          group: 'Products',
          label: product.name,
          media: (
            <ImageThumb
              src={product.images[0]}
              alt=""
              className="size-7"
              rounded="md"
            />
          ),
          hint: formatPrice(product.price),
          perform: go(ROUTES.PRIVATE.PRODUCTS.DETAIL(product.slug)),
        }))
      : [];

  const commands = [
    ...staticCommands.filter((command) => matches(command, trimmed)),
    ...productCommands,
  ];
  const safeIndex = Math.min(activeIndex, Math.max(commands.length - 1, 0));

  useEffect(() => {
    itemRefs.current.get(safeIndex)?.scrollIntoView({ block: 'nearest' });
  }, [safeIndex]);

  const run = (command: TCommand | undefined) => {
    if (!command) return;
    onClose();
    command.perform();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (commands.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((safeIndex + 1) % commands.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((safeIndex - 1 + commands.length) % commands.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(commands[safeIndex]);
    }
  };

  const isSearchingProducts =
    trimmed.length >= MIN_PRODUCT_QUERY &&
    (trimmed !== debouncedQuery || productSearch.isFetching);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-stone-200 px-4 dark:border-stone-700/60">
        <Search className="size-4 shrink-0 text-stone-400" />
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search pages, actions, or products…"
          aria-label="Search commands"
          aria-activedescendant={
            commands[safeIndex]
              ? `command-${commands[safeIndex].id}`
              : undefined
          }
          aria-controls="command-list"
          role="combobox"
          aria-expanded
          className="h-13 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
        />
        {isSearchingProducts && (
          <Loader2 className="size-4 shrink-0 animate-spin text-stone-400" />
        )}
      </div>

      <div
        id="command-list"
        role="listbox"
        className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain p-2"
      >
        {commands.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-stone-500 dark:text-stone-400">
            {isSearchingProducts
              ? 'Searching products…'
              : `No results for “${trimmed}”`}
          </p>
        ) : (
          commands.map((command, index) => {
            const Icon = command.icon;
            const showGroup =
              index === 0 || commands[index - 1].group !== command.group;
            const isActive = index === safeIndex;

            return (
              <div key={command.id}>
                {showGroup && (
                  <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold tracking-wider text-stone-400 uppercase first:pt-1 dark:text-stone-500">
                    {command.group}
                  </p>
                )}
                <button
                  id={`command-${command.id}`}
                  ref={(node) => {
                    if (node) itemRefs.current.set(index, node);
                    else itemRefs.current.delete(index);
                  }}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  tabIndex={-1}
                  onMouseMove={() =>
                    index !== safeIndex && setActiveIndex(index)
                  }
                  onClick={() => run(command)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-100',
                    isActive
                      ? 'bg-accent-50 text-accent-800 dark:bg-accent-950/50 dark:text-accent-200'
                      : 'text-stone-700 dark:text-stone-300',
                  )}
                >
                  {command.media ??
                    (Icon && (
                      <Icon
                        className={cn(
                          'size-4 shrink-0',
                          isActive
                            ? 'text-accent-600 dark:text-accent-400'
                            : 'text-stone-400',
                        )}
                      />
                    ))}
                  <span className="min-w-0 flex-1 truncate">
                    {command.label}
                  </span>
                  {command.isSelected && (
                    <Check className="size-4 shrink-0 text-accent-600 dark:text-accent-400" />
                  )}
                  {command.hint && (
                    <span className="shrink-0 text-xs tabular-nums text-stone-400 dark:text-stone-500">
                      {command.hint}
                    </span>
                  )}
                  {isActive && (
                    <CornerDownLeft className="size-3.5 shrink-0 text-accent-500/70" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-stone-200 bg-stone-50 px-4 py-2 text-[11px] text-stone-500 dark:border-stone-700/60 dark:bg-stone-800/40 dark:text-stone-400">
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> navigate
        </span>
        <span className="flex items-center gap-1">
          <Kbd>↵</Kbd> open
        </span>
        <span className="flex items-center gap-1">
          <Kbd>esc</Kbd> close
        </span>
        <span className="ml-auto hidden sm:inline">
          Type 2+ letters to search products
        </span>
      </div>
    </>
  );
};

/** ⌘K / Ctrl+K launcher for navigation, quick actions and product lookup. */
const CommandPalette = () => {
  const isOpen = useCommandPaletteStore((state) => state.isOpen);
  const setOpen = useCommandPaletteStore((state) => state.setOpen);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        useCommandPaletteStore.getState().toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl sm:p-0 md:max-w-xl"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Jump to a page, run an action, or search products.
        </DialogDescription>
        <CommandPaletteBody onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
