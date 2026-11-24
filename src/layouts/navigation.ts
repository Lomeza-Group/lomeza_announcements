import {
  ClipboardCheck,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  MapPin,
  Megaphone,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AppView =
  | 'dashboard'
  | 'announcements'
  | 'acknowledgements'
  | 'manage'
  | 'create'
  | 'administration'
  | 'roles'
  | 'locations'

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
  { view: 'administration', label: 'Employee Directory', icon: Users },
  { view: 'roles', label: 'Role Management', icon: ShieldCheck },
  { view: 'locations', label: 'Location Management', icon: MapPin },
]

export const VIEW_TITLES: Record<AppView, string> = {
  dashboard: 'Dashboard',
  announcements: 'Announcements',
  acknowledgements: 'My Acknowledgements',
  manage: 'Manage Announcements',
  create: 'Create Announcement',
  administration: 'Employee Directory',
  roles: 'Role Management',
  locations: 'Location Management',
}
