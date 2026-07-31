import { lazy, Suspense, useEffect } from 'react'
import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from './context/theme-context'
import { Routes, Route, Navigate, useLocation } from 'react-router'

const routeModules = {
  landing: () => import('./pages/public/landing-page'),
  publicDocs: () => import('./pages/public/public-docs-page'),
  publicSecurity: () => import('./pages/public/public-security-page'),
  publicMaintenance: () => import('./pages/public/public-maintenance-page'),
  adminLayout: () => import('./components/admin/layout/admin-layout'),
  dashboard: () => import('./pages/admin/dashboard-page'),
  inboxes: () => import('./pages/admin/inboxes-page'),
  inboxDetail: () => import('./pages/admin/inbox-detail-page'),
  apiKeys: () => import('./pages/admin/api-keys-page'),
  settings: () => import('./pages/admin/settings-page'),
  maintenance: () => import('./pages/admin/maintenance-page'),
  docs: () => import('./pages/admin/docs-page'),
  adminLogin: () => import('./pages/admin/login-page'),
}

const LandingPage = lazy(() => routeModules.landing().then(module => ({ default: module.LandingPage })))
const PublicDocsPage = lazy(() => routeModules.publicDocs().then(module => ({ default: module.PublicDocsPage })))
const PublicSecurityPage = lazy(() => routeModules.publicSecurity().then(module => ({ default: module.PublicSecurityPage })))
const PublicMaintenancePage = lazy(() => routeModules.publicMaintenance().then(module => ({ default: module.PublicMaintenancePage })))
const AdminLayout = lazy(() => routeModules.adminLayout().then(module => ({ default: module.AdminLayout })))
const DashboardPage = lazy(() => routeModules.dashboard().then(module => ({ default: module.DashboardPage })))
const InboxesPage = lazy(() => routeModules.inboxes().then(module => ({ default: module.InboxesPage })))
const InboxDetailPage = lazy(() => routeModules.inboxDetail().then(module => ({ default: module.InboxDetailPage })))
const ApiKeysPage = lazy(() => routeModules.apiKeys().then(module => ({ default: module.ApiKeysPage })))
const SettingsPage = lazy(() => routeModules.settings().then(module => ({ default: module.SettingsPage })))
const MaintenancePage = lazy(() => routeModules.maintenance().then(module => ({ default: module.MaintenancePage })))
const DocsPage = lazy(() => routeModules.docs().then(module => ({ default: module.DocsPage })))
const AdminLogin = lazy(() => routeModules.adminLogin().then(module => ({ default: module.AdminLogin })))

const publicRouteLoaders = [
  routeModules.landing,
  routeModules.publicDocs,
  routeModules.publicSecurity,
  routeModules.publicMaintenance,
  routeModules.adminLogin,
]

const adminRouteLoaders = [
  routeModules.adminLayout,
  routeModules.dashboard,
  routeModules.inboxes,
  routeModules.inboxDetail,
  routeModules.apiKeys,
  routeModules.settings,
  routeModules.maintenance,
  routeModules.docs,
]

function RoutePrefetcher() {
  const { pathname } = useLocation()
  const isAdminArea = pathname.startsWith('/admin') && pathname !== '/admin/login'

  useEffect(() => {
    const routeLoaders = isAdminArea ? adminRouteLoaders : publicRouteLoaders
    const timeout = window.setTimeout(() => {
      void Promise.allSettled(routeLoaders.map(loadRoute => loadRoute()))
    }, 1200)

    return () => window.clearTimeout(timeout)
  }, [isAdminArea])

  return null
}

function AppToaster() {
  const { colorMode } = useTheme()
  return <Toaster theme={colorMode} position="bottom-right" />
}

function AppLoadingFallback() {
  return (
    <div className="route-loader" role="status" aria-live="polite">
      <div className="route-loader-mark" aria-hidden="true">
        <span className="route-loader-envelope" />
        <span className="route-loader-signal route-loader-signal-one" />
        <span className="route-loader-signal route-loader-signal-two" />
      </div>
      <div className="route-loader-copy">
        <strong>Loading</strong>
        <span>Please wait a moment</span>
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <RoutePrefetcher />
      <Suspense fallback={<AppLoadingFallback />}>
        <Routes>
          {/* Public Application Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs" element={<PublicDocsPage />} />
          <Route path="/security" element={<PublicSecurityPage />} />
          <Route path="/maintenance" element={<PublicMaintenancePage />} />

          {/* Admin Application Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="inboxes" element={<InboxesPage />} />
            <Route path="inboxes/:address" element={<InboxDetailPage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="docs" element={<DocsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <AppToaster />
    </ThemeProvider>
  )
}

export default App
