import { cn } from '../../lib/cn';
import { SproutIcon } from '../ui/icons/SproutIcon';

const SIZES = {
  md: { tile: 'h-8 w-8 rounded-lg', icon: 'h-5 w-5' },
  lg: { tile: 'h-12 w-12 rounded-xl', icon: 'h-7 w-7' },
};

/** Brand mark — a sprout on the primary field green. Decorative (aria-hidden). */
export function BrandMark({ size = 'md', className }) {
  const { tile, icon } = SIZES[size] ?? SIZES.md;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center bg-field-700 text-white shadow-card',
        tile,
        className,
      )}
    >
      <SproutIcon className={icon} />
    </span>
  );
}
