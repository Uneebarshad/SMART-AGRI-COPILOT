import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useT } from '../../i18n/useT';
import { BrandMark } from './BrandMark';
import { NotificationBell } from '../notifications/NotificationBell';
import { MenuIcon } from '../ui/icons/MenuIcon';

/**
 * Mobile top bar (frontend-spec.md §4.4): brand, notification bell and the
 * menu trigger. Rendered below `lg` — visibility is controlled by the caller
 * via `className`.
 */
export function Navbar({ className, onMenuOpen }) {
  const { t } = useT();

  return (
    <header className={cn('sticky top-0 z-30 border-b border-soil-200 bg-surface dark:bg-nav', className)}>
      <div className="flex h-14 items-center justify-between pe-2 ps-4">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2"
        >
          <BrandMark />
          <span className="font-display text-base font-semibold tracking-tight text-soil-900">
            {t('common.brandName')}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            type="button"
            onClick={onMenuOpen}
            aria-label={t('common.openMenu')}
            aria-haspopup="dialog"
            className="flex h-11 w-11 items-center justify-center rounded-md text-soil-700 transition-colors hover:bg-soil-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
