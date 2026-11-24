import { X } from 'lucide-react'
import type { EmployeeProfile } from '../../types/auth'
import {
  canAccessAdministration,
  canAccessEmployeeOverview,
  canManageAnnouncements,
} from '../../utils/roles'
import { ADMIN_NAV, MAIN_NAV, MANAGEMENT_NAV } from '../../layouts/navigation'
import type { AppView, NavItem } from '../../layouts/navigation'
import { BrandLockup } from '../auth/Brand'

interface SidebarProps {
  employee: EmployeeProfile
  activeView: AppView
  onNavigate: (view: AppView) => void
  open: boolean
  onClose: () => void
}

export function Sidebar({
  employee,
  activeView,
  onNavigate,
  open,
  onClose,
}: SidebarProps) {
  const mainItems = canAccessEmployeeOverview(employee)
    ? MAIN_NAV
    : MAIN_NAV.filter(
        (item) => item.view !== 'dashboard' && item.view !== 'acknowledgements',
      )
  const groups: { title: string; items: NavItem[] }[] = [
    { title: 'Main', items: mainItems },
  ]

  if (canManageAnnouncements(employee)) {
    groups.push({ title: 'Management', items: MANAGEMENT_NAV })
  }

  if (canAccessAdministration(employee)) {
    groups.push({ title: 'Administration', items: ADMIN_NAV })
  }

  return (
    <aside className={`app-sidebar${open ? ' is-open' : ''}`}>
      <div className="sidebar-brand">
        <BrandLockup tone="light" />
        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {groups.map((group) => (
          <div className="sidebar-group" key={group.title}>
            <p className="sidebar-group-title">{group.title}</p>
            {group.items.map((item) => {
              const active = activeView === item.view
              const Icon = item.icon

              return (
                <button
                  key={item.view}
                  type="button"
                  className={`sidebar-item${active ? ' is-active' : ''}`}
                  onClick={() => onNavigate(item.view)}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon aria-hidden="true" />
                  <span className="sidebar-item-label">{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">Lomeza Mining Services</div>
    </aside>
  )
}
