import { cn } from '../../lib/cn';

const VARIANTS = {
  ghost: 'text-soil-700 hover:bg-soil-100 active:bg-soil-200 dark:hover:bg-white/5',
  outline: 'border border-soil-200 dark:border-soil-300 bg-surface text-soil-700 hover:bg-soil-50 active:bg-soil-100 dark:hover:bg-soil-200 dark:active:bg-soil-300',
  solid: 'bg-field-600 text-white hover:bg-field-700 active:bg-field-800',
};

const SIZES = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
};

/**
 * Icon-only control (frontend-spec.md §9/§12): `label` is required and becomes
 * the accessible name — the icon itself is decorative. Default size meets the
 * 44px touch-target minimum. Falls back to `children` when no icon component
 * is passed.
 */
export function IconButton({
  label,
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className="h-5 w-5" /> : children}
    </button>
  );
}
