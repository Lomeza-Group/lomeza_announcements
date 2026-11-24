import {
  ClipboardCheck,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  Megaphone,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AppView =
  | 'dashboard'
  | 'announcements'
  | 'acknowledgements'
  | 'manage'
  | 'create'
  | 'administration'

export interface NavItem {
  view: AppView
  label: string
  icon: LucideIcon
}

export const MAIN_NAV: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'announcements', label: 'Announcements', icon: Megaphone },
  { view: 'acknowledgements', label: 'My Acknowledgements', icon: ClipboardCheck },
]

export const MANAGEMENT_NAV: NavItem[] = [
  { view: 'manage', label: 'Manage Announcements', icon: FolderOpen },
  { view: 'create', label: 'Create Announcement', icon: FilePlus2 },
]

export const ADMIN_NAV: NavItem[] = [
  { view: 'administration', label: 'Administration', icon: Settings },
]

export const VIEW_TITLES: Record<AppView, string> = {
  dashboard: 'Dashboard',
  announcements: 'Announcements',
  acknowledgements: 'My Acknowledgements',
  manage: 'Manage Announcements',
  create: 'Create Announcement',
  administration: 'Administration',
}
