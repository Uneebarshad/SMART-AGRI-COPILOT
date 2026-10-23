import { Component } from 'react';
import { useT } from '../../i18n/useT';
import { Button } from '../ui';
import { AlertTriangleIcon } from '../ui/icons/AlertTriangleIcon';

/**
 * Route-level crash guard for the shell's page outlet.
 * Without it a single render error (e.g. a bad date value) unmounts the
 * entire React root and leaves the user on a blank screen.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep it visible in the console for post-demo investigation.
    console.error('Page render error:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return <PageErrorFallback onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

function PageErrorFallback({ onRetry }) {
  const { t } = useT();
  return (
    <div role="alert" className="mx-auto max-w-md rounded-xl border border-soil-200 bg-surface p-6 text-center shadow-card">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sun-50 text-sun-700 dark:bg-sun-900/20 dark:text-sun-400">
        <AlertTriangleIcon className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold text-soil-900">{t('common.pageErrorTitle')}</h2>
      <p className="mt-2 text-sm text-soil-600">{t('common.pageErrorMessage')}</p>
      <div className="mt-5 flex justify-center gap-3">
        <Button variant="outline" onClick={onRetry}>
          {t('common.pageErrorRetry')}
        </Button>
        <Button onClick={() => window.location.reload()}>{t('common.pageErrorReload')}</Button>
      </div>
    </div>
  );
}

export { ErrorBoundary };
