import { cn } from '../../lib/cn';

const VARIANTS = {
  // WCAG AA against white text in both themes: light uses the deeper
  // field-700 ramp; dark tokens map field-600 to #16A34A (≥ 3:1, AA-large).
  primary: 'bg-field-700 text-white hover:bg-field-800 active:bg-field-900 dark:bg-field-600 dark:hover:bg-field-700 dark:active:bg-field-800',
  secondary: 'border border-field-200 bg-field-50 text-field-800 hover:bg-field-100 dark:border-field-500/30 dark:bg-field-900/20 dark:text-field-400 dark:hover:bg-field-900/30',
  outline: 'border border-soil-200 dark:border-soil-300 bg-surface text-soil-800 hover:bg-soil-50 active:bg-soil-100 dark:text-soil-600 dark:hover:bg-soil-200 dark:active:bg-soil-300',
  ghost: 'text-soil-700 hover:bg-soil-100 active:bg-soil-200 dark:text-soil-500 dark:hover:bg-soil-200 dark:active:bg-soil-300',
  danger: 'bg-rust-600 text-white hover:bg-rust-700 active:bg-rust-800',
};

const SIZES = {
  sm: 'h-9 gap-1.5 px-3 text-sm',
  md: 'h-11 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-base',
};

/** Shared Button styling so links can wear it too (see ButtonLink). */
export function buttonClasses({ variant = 'primary', size = 'md', fullWidth = false, className } = {}) {
  return cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-[background-color,border-color,color,box-shadow] duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    variant === 'danger'
      ? 'focus-visible:ring-rust-500'
      : 'focus-visible:ring-field-500',
    'active:shadow-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
    fullWidth && 'w-full',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}) {
  return (
    <button
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {children}
    </button>
  );
}
