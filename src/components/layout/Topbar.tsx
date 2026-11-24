import { Bell, MapPin, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { EmployeeProfile } from '../../types/auth'
import { useLocations } from '../../features/locations/locationsContext'
import { EmployeeMenu } from './EmployeeMenu'

interface TopbarProps {
  title: string
  employee: EmployeeProfile
  collapsed: boolean
  onToggleCollapse: () => void
  onToggleDrawer: () => void
}

export function Topbar({
  title,
  employee,
  collapsed,
  onToggleCollapse,
  onToggleDrawer,
}: TopbarProps) {
  const { getLocationName } = useLocations()
  const locationName =
    getLocationName(employee.location_id) ?? employee.locationName

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn topbar-menu-btn"
          onClick={onToggleDrawer}
          aria-label="Open navigation"
        >
          <Menu aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-btn sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" />
          ) : (
            <PanelLeftClose aria-hidden="true" />
          )}
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-right">
        {locationName && (
          <span className="topbar-location">
            <MapPin aria-hidden="true" />
            {locationName}
          </span>
        )}
        <button
          type="button"
          className="icon-btn"
          aria-label="Notifications"
        >
          <Bell aria-hidden="true" />
        </button>
        <EmployeeMenu employee={employee} />
      </div>
    </header>
  )
}
