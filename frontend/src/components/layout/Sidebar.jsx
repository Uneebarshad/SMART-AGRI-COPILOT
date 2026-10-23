import { Link, NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useT } from '../../i18n/useT';
import { useAuth } from '../../auth/AuthProvider';
import { BrandMark } from './BrandMark';
import { SIDEBAR_ITEMS } from './navItems';
import { SettingsIcon } from '../ui/icons/SettingsIcon';
import { LogoutIcon } from '../ui/icons/LogoutIcon';
import { UserAvatar } from '../ui/UserAvatar';
import { LeafIcon } from '../ui/icons/LeafIcon';

const linkClasses = ({ isActive }) =>
  cn(
    'relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2',
    isActive
      ? 'bg-field-100 font-semibold text-field-800 dark:bg-field-500/15 dark:text-field-300 dark:ring-1 dark:ring-inset dark:ring-field-500/25 dark:shadow-[0_2px_18px_-6px_rgba(57,211,83,0.45)] before:absolute before:start-0 before:h-6 before:w-1 before:rounded-e-full before:bg-field-600 dark:before:bg-field-400'
      : 'font-medium text-soil-600 hover:bg-soil-100 hover:text-soil-900 dark:text-soil-500 dark:hover:bg-field-500/[0.08] dark:hover:text-soil-900',
  );

/**
 * Desktop sidebar (frontend-spec.md §4.4). Rendered from `lg` up — the caller
 * controls visibility via `className` (e.g. `hidden lg:flex`), so this component
 * carries no display utility of its own.
 */
export function Sidebar({ className }) {
  const { t } = useT();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.name || user?.email || t('common.guestFarmer');

  return (
    <aside
      aria-label={t('common.mainNav')}
      className={cn(
        'fixed inset-y-0 start-0 z-40 w-64 flex-col border-e border-soil-200',
        'bg-nav',
        className,
      )}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-soil-200 px-4">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2 dark:ring-offset-soil-50"
        >
          <BrandMark />
          <span className="font-display text-lg font-semibold tracking-tight text-soil-900 dark:text-soil-950">
            {t('common.brandName')}
          </span>
        </Link>
      </div>

      {/* Scrollable nav: scrollbar hidden for a clean edge, scrolling intact. */}
      <nav className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-3 py-5">
        <ul className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <li key={item.id}>
              <NavLink to={item.path} end={item.path === '/'} className={linkClasses}>
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{t(item.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="my-4 border-t border-soil-200" />

        <ul className="space-y-1">
          <li>
            <NavLink to="/settings" className={linkClasses}>
              <SettingsIcon className="h-5 w-5 shrink-0" />
              <span className="truncate">{t('nav.settings')}</span>
            </NavLink>
          </li>
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium',
                'text-soil-600 transition-colors duration-150 hover:bg-soil-100 hover:text-soil-900',
                'dark:text-soil-500 dark:hover:bg-field-500/[0.08] dark:hover:text-soil-900',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2',
              )}
            >
              <LogoutIcon className="h-5 w-5 shrink-0" />
              <span className="truncate">{t('common.logout')}</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="shrink-0 border-t border-soil-200 p-4">
        {/* The whole block opens the farmer's profile/settings — it is one
            link (name/email are its label, not nested interactive parts). */}
        <Link
          to="/settings"
          aria-label={t('common.openProfile')}
          className={cn(
            '-mx-2 -my-1 flex items-center gap-3 rounded-xl px-2 py-1 transition-colors duration-150',
            'hover:bg-soil-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500',
            'dark:hover:bg-field-500/[0.08]',
          )}
        >
          <UserAvatar src={user?.preferences?.avatar || null} className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-soil-900 dark:text-soil-950">{displayName}</p>
            {user?.email && (
              <p className="truncate text-xs text-soil-500 dark:text-soil-600">{user.email}</p>
            )}
          </div>
        </Link>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-soil-500 dark:text-soil-600">
          <LeafIcon className="h-3.5 w-3.5 text-field-500 dark:text-field-400" aria-hidden="true" />
          {t('common.sidebarTagline')}
        </p>
      </div>
    </aside>
  );
}
