import { useState } from 'react'
import type { EmployeeProfile } from '../types/auth'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { EmployeeDirectory } from '../features/administration/EmployeeDirectory'
import { LocationManagement } from '../features/administration/LocationManagement'
import { RoleManagement } from '../features/administration/RoleManagement'
import { AnnouncementEditor } from '../features/announcements/AnnouncementEditor'
import { AnnouncementFeed } from '../features/announcements/AnnouncementFeed'
import { AnnouncementManagement } from '../features/announcements/AnnouncementManagement'
import { AnnouncementsProvider } from '../features/announcements/AnnouncementsProvider'
import { MyAcknowledgements } from '../features/announcements/MyAcknowledgements'
import { Dashboard } from '../features/dashboard/Dashboard'
import { useEmployees } from '../features/employees/employeesContext'
import { EmployeesProvider } from '../features/employees/EmployeesProvider'
import { LocationsProvider } from '../features/locations/LocationsProvider'
import { canAccessAdministration, canManageAnnouncements } from '../utils/roles'
import { VIEW_TITLES } from './navigation'
import type { AppView } from './navigation'

function isViewAllowed(view: AppView, employee: EmployeeProfile): boolean {
  switch (view) {
    case 'manage':
    case 'create':
      return canManageAnnouncements(employee)
    case 'administration':
    case 'roles':
    case 'locations':
      return canAccessAdministration(employee)
    default:
      return true
  }
}

export function AppLayout({ employee }: { employee: EmployeeProfile }) {
  return (
    <EmployeesProvider currentEmployeeId={employee.id}>
      <LocationsProvider>
        <AnnouncementsProvider employee={employee}>
          <AppShell employee={employee} />
        </AnnouncementsProvider>
      </LocationsProvider>
    </EmployeesProvider>
  )
}

function AppShell({ employee }: { employee: EmployeeProfile }) {
  const { getEmployeeById } = useEmployees()
  const effectiveEmployee = getEmployeeById(employee.id) ?? employee

  const [view, setView] = useState<AppView>('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const activeView = isViewAllowed(view, effectiveEmployee) ? view : 'dashboard'

  const navigate = (next: AppView) => {
    setView(next)
    setDrawerOpen(false)
  }

  return (
    <div className={`app-shell${collapsed ? ' is-collapsed' : ''}`}>
      <Sidebar
        employee={effectiveEmployee}
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
          employee={effectiveEmployee}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((current) => !current)}
          onToggleDrawer={() => setDrawerOpen(true)}
        />

        <main className="app-content">
          {activeView === 'dashboard' && (
            <Dashboard employee={effectiveEmployee} onNavigate={navigate} />
          )}
          {activeView === 'announcements' && (
            <AnnouncementFeed employee={effectiveEmployee} />
          )}
          {activeView === 'acknowledgements' && (
            <MyAcknowledgements employee={effectiveEmployee} />
          )}
          {activeView === 'manage' && (
            <AnnouncementManagement employee={effectiveEmployee} />
          )}
          {activeView === 'create' && (
            <AnnouncementEditor
              employee={effectiveEmployee}
              onCancel={() => navigate('manage')}
              onSaved={() => navigate('manage')}
            />
          )}
          {activeView === 'administration' && (
            <EmployeeDirectory employee={effectiveEmployee} />
          )}
          {activeView === 'roles' && (
            <RoleManagement employee={effectiveEmployee} />
          )}
          {activeView === 'locations' && (
            <LocationManagement employee={effectiveEmployee} />
          )}
        </main>
      </div>
    </div>
  )
}
