import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { usePageTitle } from '../hooks/usePageTitle';
import { BrandMark } from '../components/layout/BrandMark';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { AlertTriangleIcon } from '../components/ui/icons/AlertTriangleIcon';

/**
 * Login page — email + password form that exchanges credentials for a JWT.
 * On success the AuthProvider stores the token and we redirect to the dashboard.
 */
export function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  usePageTitle('Sign in');

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page">
        <div className="text-sm text-soil-600">Loading…</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:py-12">
        <header className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="lg" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-soil-900 sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-soil-600">Sign in to your Smart Agri Copilot account</p>
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
            label="Email"
            type="email"
            autoComplete="email"
            required
            placeholder="farmer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />

          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />

          <div className="-mt-1 text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-field-700 hover:underline dark:text-field-400"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-soil-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-field-700 hover:underline dark:text-field-400">
            Create one
          </Link>
        </p>
      </main>
    </div>
  );
}

export default LoginPage;
