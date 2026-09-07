import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useT } from '../../i18n/useT';
import { NAV_ITEMS } from './navItems';

/**
 * Mobile bottom navigation (frontend-spec.md §4.4): the five primary
 * destinations. Rendered below `lg` — visibility controlled by the caller.
 * Tab targets are ≥56px tall per the spec's touch-target requirement (§12.6).
 */
export function BottomNav({ className }) {
  const { t } = useT();

  return (
    <nav
      aria-label={t('common.mainNav')}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-soil-200 bg-surface pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      <ul className="flex">
        {NAV_ITEMS.map((item) => (
          <li key={item.id} className="min-w-0 flex-1">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-field-500',
                  isActive
                    ? 'text-field-600 dark:text-field-400 before:absolute before:inset-x-4 before:top-0 before:h-0.5 before:rounded-b-full before:bg-field-600 dark:before:bg-field-400'
                    : 'text-soil-500 hover:text-soil-800',
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="w-full truncate text-center text-xs font-medium leading-tight">
                {t(item.labelKey)}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
