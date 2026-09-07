import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { BrandMark } from '../components/layout/BrandMark';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { AlertTriangleIcon } from '../components/ui/icons/AlertTriangleIcon';
import { CheckCircleIcon } from '../components/ui/icons/CheckCircleIcon';
import { resetPasswordApi } from '../services/api';

const MIN_PASSWORD = 6;

/**
 * Reset Password page — validates the token from the URL query string and
 * lets the user set a new password.  On success, redirects to login.
 */
export function ResetPasswordPage() {
  usePageTitle('Reset password');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!token) return 'This reset link is missing a token. Please request a new reset link.';
    if (!password) return 'Please enter a new password.';
    if (password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await resetPasswordApi(token, password);
      setSuccess(true);
    } catch (err) {
      if (err?.code === 'invalid_or_expired_token') {
        setError('This reset link is invalid or has expired. Please request a new one.');
      } else {
        setError(err?.message || 'Could not reset your password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-dvh flex-col bg-page">
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:py-12">
          <header className="mb-8 flex flex-col items-center text-center">
            <BrandMark size="lg" />
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-soil-900 sm:text-3xl">
              Invalid reset link
            </h1>
          </header>
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rust-200 bg-rust-50 p-4 text-sm text-rust-800 dark:border-rust-500/40 dark:bg-rust-900/20 dark:text-rust-300"
          >
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>This password reset link is missing a token. Please request a new one from the login page.</span>
          </div>
          <p className="mt-6 text-center text-sm text-soil-600">
            <Link to="/login" className="font-medium text-field-700 hover:underline dark:text-field-400">
              Back to sign in
            </Link>
          </p>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-dvh flex-col bg-page">
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:py-12">
          <header className="mb-8 flex flex-col items-center text-center">
            <BrandMark size="lg" />
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-soil-900 sm:text-3xl">
              Password reset
            </h1>
          </header>
          <div className="flex flex-col items-center rounded-lg border border-field-200 bg-field-50 p-6 text-center dark:border-field-500/30 dark:bg-field-900/20">
            <CheckCircleIcon className="h-10 w-10 text-field-600 dark:text-field-400" />
            <h2 className="mt-3 font-display text-lg font-semibold text-soil-900 dark:text-soil-100">
              Your password has been reset
            </h2>
            <p className="mt-2 text-sm text-soil-600 dark:text-soil-400">
              You can now sign in with your new password.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={() => navigate('/login')}>Sign in with new password</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:py-12">
        <header className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="lg" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-soil-900 sm:text-3xl">
            Set new password
          </h1>
          <p className="mt-1.5 text-sm text-soil-600">
            Enter your new password below
          </p>
        </header>

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
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            placeholder={`At least ${MIN_PASSWORD} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            hint={`Minimum ${MIN_PASSWORD} characters`}
          />

          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
          />

          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Resetting…' : 'Reset password'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-soil-600">
          <Link to="/login" className="font-medium text-field-700 hover:underline dark:text-field-400">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}

export default ResetPasswordPage;
