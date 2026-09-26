import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../theme/useTheme';
import { usePageTitle } from '../hooks/usePageTitle';
import { BrandMark } from '../components/layout/BrandMark';
import { Button } from '../components/ui/Button';
import { TextField, PasswordField } from '../components/ui/TextField';
import { Banner } from '../components/ui/Banner';
import { MoonIcon } from '../components/ui/icons/MoonIcon';
import { SunIcon } from '../components/ui/icons/SunIcon';
import { LeafIcon } from '../components/ui/icons/LeafIcon';
import { MailIcon } from '../components/ui/icons/MailIcon';
import { CloudRainIcon } from '../components/ui/icons/CloudRainIcon';
import { DropletIcon } from '../components/ui/icons/DropletIcon';
import { ChatIcon } from '../components/ui/icons/ChatIcon';

/** Product highlights shown on the hero — visual only, no behaviour. */
const FEATURES = [
  { Icon: LeafIcon, label: 'Crop Diagnosis' },
  { Icon: CloudRainIcon, label: 'Weather Insights' },
  { Icon: DropletIcon, label: 'Smart Irrigation' },
  { Icon: ChatIcon, label: 'AI Assistant' },
];

/**
 * Translate a login failure into a friendly, safe message — never a raw
 * "API error: 500". The backend returns 401 + {code:'invalid_credentials'}
 * for bad credentials; anything else (5xx, an unreachable backend surfacing
 * as a proxy 500, or a network drop with no status) is reported as a generic
 * connectivity/server problem so internal details are not leaked.
 */
function describeLoginError(err) {
  const status = err?.status;
  const code = err?.code;

  if (status === 401 || code === 'invalid_credentials') {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (status === 403) {
    return 'This account has been deactivated. Please contact support.';
  }
  if (!status) {
    return "We couldn't reach the server. Please check your connection and try again.";
  }
  return 'Something went wrong on our side. Please try again in a moment.';
}

/*
 * NOTE ON DARK-MODE COLOURS: the `.dark` block in index.css INVERTS the whole
 * `field` green scale (field-50 becomes near-black, field-900 near-white), so
 * light-on-dark text must NOT use `field-50/100`. Every "light green text"
 * below is a literal hex to stay correct in both themes.
 */

/**
 * Login page — premium full-bleed split: an agricultural scene fills the whole
 * viewport, brand messaging sits over the left, and the authentication card
 * floats over the right (reference composition). Email + password exchange
 * credentials for a JWT via useAuth().login; on success we return the user to
 * the protected page ProtectedRoute remembered (location.state.from) or the
 * dashboard. The scene stays visible from the `md` (768px) breakpoint up, so a
 * normal laptop/tablet never collapses to the centred mobile card.
 */
export function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  usePageTitle('Sign in');

  /* ProtectedRoute stores the attempted location in state.from — honour it. */
  const from = location.state?.from?.pathname || '/';
  const isDark = resolvedTheme === 'dark';

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page">
        <div className="text-sm text-soil-600">Loading…</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
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
      navigate(from, { replace: true });
    } catch (err) {
      setError(describeLoginError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full overflow-hidden bg-page">
      {/* One continuous agricultural scene behind the entire page. */}
      <SceneBackdrop />

      {/* Theme control — top-right, over the scene. */}
      <ThemeToggle isDark={isDark} onToggle={() => setTheme(isDark ? 'light' : 'dark')} />

      {/* Split composition: hero (left) + auth card (right). */}
      <div className="relative z-10 flex w-full flex-1 flex-col md:flex-row">
        <HeroPanel />

        <div className="flex w-full flex-1 items-center justify-center px-4 pb-10 pt-24 sm:px-6 md:flex-none md:px-6 md:py-10 md:basis-[44%] lg:px-10 xl:basis-[40%]">
          <AuthCard
            email={email}
            password={password}
            error={error}
            submitting={submitting}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Left hero column — brand lockup, headline, supporting copy and four feature
 * highlights laid directly over the scene (no separate panel, matching the
 * reference). Hidden below `md`; a compact brand header appears above the card
 * on mobile instead.
 */
function HeroPanel() {
  return (
    <section className="relative hidden flex-1 flex-col justify-center px-10 py-12 md:flex lg:px-16 xl:px-20">
      {/* Brand lockup — top-left of the composition. */}
      <div className="flex items-center gap-3">
        <BrandMark size="lg" className="ring-1 ring-black/5 dark:ring-white/15" />
        <div>
          <p className="font-display text-xl font-semibold tracking-tight text-field-950 dark:text-white">
            Smart <span className="text-field-600 dark:text-[#4ade80]">Agri</span> Copilot
          </p>
          <p className="text-xs text-field-800 dark:text-[#bbf7d0]/75">
            Smarter Farming • Healthier Tomorrow
          </p>
        </div>
      </div>

      {/* Headline + copy */}
      <div className="mt-12 max-w-xl lg:mt-16">
        <h2 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-field-950 lg:text-5xl dark:text-white">
          Better Decisions.
          <br />
          <span className="text-field-600 dark:text-[#4ade80]">Healthier Crops.</span>
          <br />
          Higher Yields.
        </h2>
        <p className="mt-5 max-w-md text-base leading-relaxed text-field-900/80 dark:text-[#dcfce7]/85">
          AI-powered agricultural intelligence to help farmers understand their crops, fields,
          weather and farming decisions.
        </p>
      </div>

      {/* Feature highlights — decorative product pillars, not controls. */}
      <ul className="mt-12 grid max-w-xl grid-cols-2 gap-3.5 lg:gap-4">
        {FEATURES.map(({ Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-3.5 rounded-2xl border border-field-900/10 bg-white/60 px-4 py-3.5 text-sm font-medium text-field-950 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-[#eafaf0]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-field-100 text-field-700 dark:bg-[#4ade80]/15 dark:text-[#4ade80]">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 break-words">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The authentication card — a clean, elevated surface floating over the right
 * side of the scene. Fully functional: real login, validation, error banner,
 * password visibility toggle, forgot-password + register routes.
 */
function AuthCard({
  email,
  password,
  error,
  submitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <div className="w-full max-w-[27rem]">
      {/* Compact brand — only on mobile, where the hero column is hidden. */}
      <header className="mb-5 flex flex-col items-center text-center md:hidden">
        <BrandMark size="lg" />
        <p className="mt-3 font-display text-lg font-semibold tracking-tight text-field-950 dark:text-white">
          Smart <span className="text-field-600 dark:text-[#4ade80]">Agri</span> Copilot
        </p>
        <p className="mt-0.5 text-xs text-field-800 dark:text-[#bbf7d0]/75">
          Smarter Farming • Healthier Tomorrow
        </p>
      </header>

      <div className="rounded-3xl border border-soil-200/80 bg-white/85 p-7 shadow-raised ring-1 ring-black/5 backdrop-blur-xl sm:p-9 dark:border-white/10 dark:bg-[#0a1410]/85 dark:shadow-[0_0_70px_-18px_rgba(34,197,94,0.45)] dark:ring-white/5">
        <div className="mb-7 flex flex-col items-center text-center">
          <BrandMark size="lg" className="ring-1 ring-black/5 dark:ring-white/15" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-field-950 sm:text-3xl dark:text-white">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-soil-600 dark:text-[#bbf7d0]/75">
            Sign in to your Smart Agri Copilot account
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {error && <Banner tone="error">{error}</Banner>}

          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            required
            pill
            placeholder="farmer@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={submitting}
            trailing={<MailIcon className="h-5 w-5" />}
            inputClassName="dark:bg-[#0e1a14] dark:text-[#eafaf0] dark:border-white/10 dark:placeholder:text-[#bbf7d0]/40"
          />

          <PasswordField
            label="Password"
            autoComplete="current-password"
            required
            pill
            placeholder="Your password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            disabled={submitting}
            inputClassName="dark:bg-[#0e1a14] dark:text-[#eafaf0] dark:border-white/10 dark:placeholder:text-[#bbf7d0]/40"
          />

          <div className="-mt-1.5 text-end">
            <Link
              to="/forgot-password"
              className="inline-block rounded py-2 text-sm font-medium text-field-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 dark:text-[#4ade80]"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={submitting}
            aria-busy={submitting}
            className="mt-1 h-12 rounded-full bg-gradient-to-r from-field-800 to-field-700 text-base font-semibold text-white shadow-raised transition hover:from-field-900 hover:to-field-800 dark:from-[#166534] dark:to-[#15803d] dark:hover:from-[#14532d] dark:hover:to-[#166534]"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-soil-600 dark:text-[#bbf7d0]/75">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-field-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 dark:text-[#4ade80]"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Light/Dark switch for the auth screen. Drives the real ThemeProvider (never
 * local state), sits top-right over the scene as a compact pill.
 */
function ThemeToggle({ isDark, onToggle }) {
  const base =
    'flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 ';
  const inactive = 'text-field-800/60 hover:text-field-800 dark:text-white/55 dark:hover:text-white ';

  return (
    <div className="absolute end-4 top-4 z-20 sm:end-6 sm:top-6 lg:end-10 lg:top-8">
      <div className="flex items-center gap-1 rounded-full border border-field-900/10 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={!isDark}
          aria-label="Switch to light theme"
          className={base + (!isDark ? 'bg-field-600 text-white ' : inactive)}
        >
          <SunIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isDark}
          aria-label="Switch to dark theme"
          className={base + (isDark ? 'bg-[#15803d] text-white ' : inactive)}
        >
          <MoonIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Full-bleed agricultural scene rendered with pure CSS + inline SVG (no image
 * assets, no dependencies): a sky-to-field gradient, a soft sun glow, and
 * layered rolling-field silhouettes. Light theme reads as a bright daytime
 * field; dark theme as a deep dusk field. Literal greens are used for the dark
 * ramp because the `.dark` token scale inverts the field palette.
 */
function SceneBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Sky → field gradient base (warm leaf tone, not blue). */}
      <div className="absolute inset-0 bg-gradient-to-b from-leaf-50 via-field-50 to-field-200 dark:from-[#0a1a12] dark:via-[#08150f] dark:to-[#04100a]" />

      {/* Sun glow near the horizon. */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_72%_18%,rgba(253,224,71,0.4),transparent_60%)] dark:bg-[radial-gradient(60%_45%_at_72%_20%,rgba(74,222,128,0.16),transparent_60%)]" />

      {/* Rolling field silhouettes for depth. */}
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-1/2 w-full"
      >
        <path
          className="fill-field-200/70 dark:fill-[#0c2418]"
          d="M0 160c220-60 420 40 660-10s520-70 780 20v150H0Z"
        />
        <path
          className="fill-field-300/80 dark:fill-[#0a1c13]"
          d="M0 210c260-50 480 30 760-15s460-45 680 5v135H0Z"
        />
        <path
          className="fill-field-400/70 dark:fill-[#07140d]"
          d="M0 260c240-40 520 20 800-10s400-25 640 0v70H0Z"
        />
      </svg>

      {/* Ploughed crop-row furrows on the foreground field, faded toward the horizon. */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 [mask-image:linear-gradient(to_top,black,transparent)] dark:[mask-image:linear-gradient(to_top,rgba(0,0,0,0.7),transparent)] bg-[repeating-linear-gradient(74deg,rgba(21,128,61,0.12)_0px,rgba(21,128,61,0.12)_2px,transparent_2px,transparent_15px)] dark:bg-[repeating-linear-gradient(74deg,rgba(74,222,128,0.07)_0px,rgba(74,222,128,0.07)_2px,transparent_2px,transparent_15px)]" />

      {/* Left scrim so hero text stays legible over the scene in both themes. */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/55 via-white/10 to-transparent dark:from-black/65 dark:via-black/30 dark:to-transparent" />

      {/* Soft vignette for premium depth. */}
      <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(6,40,20,0.18)] dark:shadow-[inset_0_0_220px_rgba(0,0,0,0.55)]" />
    </div>
  );
}

export default LoginPage;
