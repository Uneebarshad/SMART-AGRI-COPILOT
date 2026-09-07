import { Link } from 'react-router-dom';
import { buttonClasses } from './Button';

/**
 * Navigation action styled as a Button — same variants and sizes, rendered
 * as a router Link so CTAs keep 44px targets and real link semantics.
 */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  to,
  children,
  ...props
}) {
  return (
    <Link
      to={to}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {children}
    </Link>
  );
}
