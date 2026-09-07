export function ChartIcon({ className = 'h-5 w-5' }) {
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
      <path d="M3 3v18h18" />
      <path d="M13 17V9" />
      <path d="M18 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
