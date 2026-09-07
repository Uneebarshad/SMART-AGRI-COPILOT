import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import { AppSettingsProvider } from './settings/AppSettingsProvider';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { useAppSettings } from './settings/useAppSettings';
import { AppShell } from './components/layout/AppShell';
import { RouteFallback } from './components/layout/RouteFallback';
import DashboardPage from './pages/DashboardPage';
import WelcomePage from './pages/WelcomePage';

// Route-level code splitting (frontend-spec.md §15.3): the dashboard and the
// welcome screen are the two first-paint screens, everything else is lazy.
const AssistantPage = lazy(() => import('./pages/AssistantPage'));
const DiagnosisPage = lazy(() => import('./pages/DiagnosisPage'));
const ScanResultPage = lazy(() => import('./pages/ScanResultPage'));
const WeatherPage = lazy(() => import('./pages/WeatherPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FieldsPage = lazy(() => import('./pages/FieldsPage'));
const CropRecommendationPage = lazy(() => import('./pages/CropRecommendationPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const DiseasesPage = lazy(() => import('./pages/DiseasesPage'));
const DiseaseDetailPage = lazy(() => import('./pages/DiseaseDetailPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

/**
 * Redirects any route to /welcome until onboarding is complete
 * (frontend-spec.md §5.1 entry point, flow F1).
 */
function OnboardingGate() {
  const { onboarded } = useAppSettings();
  const location = useLocation();
  if (onboarded || location.pathname === '/welcome') {
    return null;
  }
  return <Navigate to="/welcome" replace />;
}

/**
 * Auth gate — redirects unauthenticated users to /login and authenticated
 * users away from /login and /register.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page">
        <div className="text-sm text-soil-600">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page">
        <div className="text-sm text-soil-600">Loading…</div>
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

/**
 * Routing map (frontend-spec.md §4.2).
 * `/welcome`, `/login`, `/register` render standalone — every other route is
 * nested inside the AppShell layout route, which provides nav chrome + Suspense.
 */
export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AppSettingsProvider>
          <AuthProvider>
            {/* v7 future flags: opt in early so the console stays clean and v7 is a non-event. */}
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <OnboardingGate />
              <Routes>
                <Route path="/welcome" element={<WelcomePage />} />
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <Suspense fallback={<RouteFallback />}>
                        <LoginPage />
                      </Suspense>
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <Suspense fallback={<RouteFallback />}>
                        <RegisterPage />
                      </Suspense>
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <ForgotPasswordPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <ResetPasswordPage />
                    </Suspense>
                  }
                />
                <Route
                  path="*"
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <NotFoundPage />
                    </Suspense>
                  }
                />

                <Route
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="assistant" element={<AssistantPage />} />
                  <Route path="assistant/:conversationId" element={<AssistantPage />} />
                  <Route path="diagnosis" element={<DiagnosisPage />} />
                  <Route path="diagnosis/:scanId" element={<ScanResultPage />} />
                  <Route path="weather" element={<WeatherPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="fields" element={<FieldsPage />} />
                  <Route path="crop-recommendation" element={<CropRecommendationPage />} />
                  <Route path="recommendations" element={<RecommendationsPage />} />
                  <Route path="diseases" element={<DiseasesPage />} />
                  <Route path="diseases/:id" element={<DiseaseDetailPage />} />
                  <Route path="history" element={<HistoryPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </AppSettingsProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
