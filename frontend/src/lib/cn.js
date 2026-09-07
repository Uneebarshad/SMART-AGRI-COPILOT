/** Joins truthy class names — the project's dependency-free `cn`. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
