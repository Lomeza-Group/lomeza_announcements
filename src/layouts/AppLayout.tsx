import { useState } from 'react'
import { ClipboardCheck, Settings } from 'lucide-react'
import type { EmployeeProfile } from '../types/auth'
import { PlaceholderPage } from '../components/layout/PlaceholderPage'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { AnnouncementEditor } from '../features/announcements/AnnouncementEditor'
import { AnnouncementFeed } from '../features/announcements/AnnouncementFeed'
import { AnnouncementManagement } from '../features/announcements/AnnouncementManagement'
import { AnnouncementsProvider } from '../features/announcements/AnnouncementsProvider'
import { Dashboard } from '../features/dashboard/Dashboard'
import { canAccessAdministration, canManageAnnouncements } from '../utils/roles'
import { VIEW_TITLES } from './navigation'
import type { AppView } from './navigation'

function isViewAllowed(view: AppView, employee: EmployeeProfile): boolean {
  switch (view) {
    case 'manage':
    case 'create':
      return canManageAnnouncements(employee)
    case 'administration':
      return canAccessAdministration(employee)
    default:
      return true
  }
}

export function AppLayout({ employee }: { employee: EmployeeProfile }) {
  const [view, setView] = useState<AppView>('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const activeView = isViewAllowed(view, employee) ? view : 'dashboard'

  const navigate = (next: AppView) => {
    setView(next)
    setDrawerOpen(false)
  }

  return (
    <AnnouncementsProvider>
      <div className={`app-shell${collapsed ? ' is-collapsed' : ''}`}>
        <Sidebar
          employee={employee}
          activeView={activeView}
          onNavigate={navigate}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
        {drawerOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="app-shell-body">
          <Topbar
            title={VIEW_TITLES[activeView]}
            employee={employee}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((current) => !current)}
            onToggleDrawer={() => setDrawerOpen(true)}
          />

          <main className="app-content">
            {activeView === 'dashboard' && (
              <Dashboard employee={employee} onNavigate={navigate} />
            )}
            {activeView === 'announcements' && <AnnouncementFeed />}
            {activeView === 'acknowledgements' && (
              <PlaceholderPage
                icon={ClipboardCheck}
                title="My Acknowledgements"
                description="Review announcements you have acknowledged and your acknowledgement history. This view is being prepared."
              />
            )}
            {activeView === 'manage' && (
              <AnnouncementManagement employee={employee} />
            )}
            {activeView === 'create' && (
              <AnnouncementEditor
                employee={employee}
                onCancel={() => navigate('manage')}
                onSaved={() => navigate('manage')}
              />
            )}
            {activeView === 'administration' && (
              <PlaceholderPage
                icon={Settings}
                title="Administration"
                description="Manage employees, roles, sites and platform settings. This view is being prepared."
              />
            )}
          </main>
        </div>
      </div>
    </AnnouncementsProvider>
  )
}
