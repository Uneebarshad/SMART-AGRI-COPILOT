export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center sm:py-14">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-soil-200 bg-soil-100 dark:bg-soil-200 text-soil-400 dark:text-soil-500">
        {Icon && <Icon className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 text-base font-semibold text-soil-800">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-soil-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
