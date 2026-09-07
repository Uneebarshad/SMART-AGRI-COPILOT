import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { usePageTitle } from '../hooks/usePageTitle';
import { BrandMark } from '../components/layout/BrandMark';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { AlertTriangleIcon } from '../components/ui/icons/AlertTriangleIcon';

const MIN_PASSWORD = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register page — collects name, email, password, and confirmation.
 * On success the AuthProvider stores the returned JWT and we redirect to the dashboard.
 */
export function RegisterPage() {
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  usePageTitle('Create account');

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

  const validate = () => {
    if (!name.trim()) return 'Please enter your name.';
    if (!email.trim()) return 'Please enter your email.';
    if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.';
    if (!password) return 'Please enter a password.';
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
      await register({ name: name.trim(), email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      if (err?.status === 409) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(err?.message || 'Could not create your account. Please try again.');
      }
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
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-soil-600">Join Smart Agri Copilot</p>
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
            label="Name"
            type="text"
            autoComplete="name"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />

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
            autoComplete="new-password"
            required
            placeholder={`At least ${MIN_PASSWORD} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            hint={`Minimum ${MIN_PASSWORD} characters`}
          />

          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
          />

          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-soil-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-field-700 hover:underline dark:text-field-400">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}

export default RegisterPage;
