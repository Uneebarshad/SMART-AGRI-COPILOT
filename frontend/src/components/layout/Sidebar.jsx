import { Link, NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useT } from '../../i18n/useT';
import { useAuth } from '../../auth/AuthProvider';
import { BrandMark } from './BrandMark';
import { NotificationBell } from '../notifications/NotificationBell';
import { NAV_ITEMS, SECONDARY_ITEMS } from './navItems';
import { UserIcon } from '../ui/icons/UserIcon';

const linkClasses = ({ isActive }) =>
  cn(
    'relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2',
    isActive
      ? 'bg-field-50 dark:bg-field-900/20 font-semibold text-field-800 dark:text-field-400 before:absolute before:start-0 before:h-6 before:w-1 before:rounded-e-full before:bg-field-600 dark:before:bg-field-500'
      : 'font-medium text-soil-600 hover:bg-soil-100 hover:text-soil-900 dark:hover:bg-white/5',
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
          <span className="font-display text-lg font-semibold tracking-tight text-soil-900">
            {t('common.brandName')}
          </span>
        </Link>
        <NotificationBell className="ms-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <NavLink to={item.path} className={linkClasses}>
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{t(item.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="my-4 border-t border-soil-200" />

        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-soil-400">
          {t('common.moreNav')}
        </p>
        <ul className="space-y-1">
          {SECONDARY_ITEMS.map((item) => (
            <li key={item.id}>
              <NavLink to={item.path} className={linkClasses}>
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{t(item.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-soil-200 p-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-field-100 text-field-700 dark:bg-field-900/30 dark:text-field-400"
          >
            <UserIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-soil-900">{displayName}</p>
            {user?.email && (
              <p className="truncate text-xs text-soil-500">{user.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md px-2 py-1 text-xs font-medium text-soil-600 transition-colors hover:bg-soil-100 hover:text-soil-900 dark:text-soil-400 dark:hover:bg-white/5 dark:hover:text-soil-200"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
