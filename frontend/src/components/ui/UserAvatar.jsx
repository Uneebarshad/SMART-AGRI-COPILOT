import { useState } from 'react';
import { cn } from '../../lib/cn';
import { UserIcon } from './icons/UserIcon';

const DEFAULT_FALLBACK_TONE =
  'bg-gradient-to-br from-field-500/25 to-field-600/10 text-field-300 ring-1 ring-inset ring-field-500/25';

/**
 * Circular user avatar shared by the top bar, sidebar, and settings.
 * Renders the uploaded profile photo when available; a failed or missing
 * image always falls back to the generic icon (never a broken <img>).
 *
 * `cn` here is a plain join, so callers replacing the fallback look pass a
 * complete `fallbackClassName` instead of layering conflicting utilities.
 */
export function UserAvatar({
  src,
  alt = '',
  className,
  fallbackClassName = DEFAULT_FALLBACK_TONE,
  iconClassName = 'h-5 w-5',
}) {
  // Remember which source failed so a replacement upload gets a fresh chance.
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(src) && failedSrc !== src;

  if (showImage) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setFailedSrc(src)}
        className={cn('h-9 w-9 shrink-0 rounded-full object-cover', className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        fallbackClassName,
        className,
      )}
    >
      <UserIcon className={iconClassName} />
    </span>
  );
}
