/** Spinner arc — rotate with `animate-spin` at the usage site (design-system motion rules). */
export function SpinnerIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}
