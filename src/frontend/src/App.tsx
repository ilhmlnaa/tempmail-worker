import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from './context/theme-context'
import { Routes, Route, Navigate } from 'react-router'

import { LandingPage } from './pages/public/landing-page'
import { PublicDocsPage } from './pages/public/public-docs-page'
import { PublicSecurityPage } from './pages/public/public-security-page'
import { PublicMaintenancePage } from './pages/public/public-maintenance-page'

import { AdminLayout } from './components/admin/layout/admin-layout'
import { DashboardPage } from './pages/admin/dashboard-page'
import { InboxesPage } from './pages/admin/inboxes-page'
import { InboxDetailPage } from './pages/admin/inbox-detail-page'
import { ApiKeysPage } from './pages/admin/api-keys-page'
import { SettingsPage } from './pages/admin/settings-page'
import { MaintenancePage } from './pages/admin/maintenance-page'
import { DocsPage } from './pages/admin/docs-page'
import { AdminLogin } from './pages/admin/login-page'

function AppToaster() {
  const { colorMode } = useTheme()
  return <Toaster theme={colorMode} position="bottom-right" />
}

function App() {
  return (
    <ThemeProvider>
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
      <AppToaster />
    </ThemeProvider>
  )
}

export default App
