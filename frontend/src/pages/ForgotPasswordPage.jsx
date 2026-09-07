import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { BrandMark } from '../components/layout/BrandMark';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { AlertTriangleIcon } from '../components/ui/icons/AlertTriangleIcon';
import { CheckCircleIcon } from '../components/ui/icons/CheckCircleIcon';
import { forgotPasswordApi } from '../services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Forgot Password page — collects the user's email and requests a reset link.
 * Always shows a generic success message to prevent email enumeration.
 */
export function ForgotPasswordPage() {
  usePageTitle('Forgot password');

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await forgotPasswordApi(trimmed);
    } catch {
      // Silently ignore — we always show the same success message.
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:py-12">
        <header className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="lg" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-soil-900 sm:text-3xl">
            Forgot password?
          </h1>
          <p className="mt-1.5 text-sm text-soil-600">
            No worries — enter your email and we'll send you a reset link
          </p>
        </header>

        {sent ? (
          <div className="flex flex-col items-center rounded-lg border border-field-200 bg-field-50 p-6 text-center dark:border-field-500/30 dark:bg-field-900/20">
            <CheckCircleIcon className="h-10 w-10 text-field-600 dark:text-field-400" />
            <h2 className="mt-3 font-display text-lg font-semibold text-soil-900 dark:text-soil-100">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-soil-600 dark:text-soil-400">
              If an account exists for <strong className="text-soil-800 dark:text-soil-200">{email.trim()}</strong>,
              we've sent a password reset link. Please check your inbox and spam folder.
            </p>
            <p className="mt-3 text-xs text-soil-500 dark:text-soil-500">
              The link will expire in 60 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rust-200 bg-rust-50 p-3 text-sm text-rust-800 dark:border-rust-500/40 dark:bg-rust-900/20 dark:text-rust-300"
              >
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              placeholder="farmer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />

            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-soil-600">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-field-700 hover:underline dark:text-field-400">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;
