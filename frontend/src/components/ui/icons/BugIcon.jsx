export function BugIcon({ className = 'h-5 w-5' }) {
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
      <rect x="8" y="7" width="8" height="12" rx="4" />
      <path d="M12 7V5.5" />
      <path d="M10.4 5.5 9.5 3" />
      <path d="M13.6 5.5l.9-2.5" />
      <path d="M8 10.5H4.5" />
      <path d="M8 13.5H3.5" />
      <path d="M8 16.5l-2.5 2" />
      <path d="M16 10.5h3.5" />
      <path d="M16 13.5h4.5" />
      <path d="M16 16.5l2.5 2" />
    </svg>
  );
}
