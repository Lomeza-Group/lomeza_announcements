import type { AnnouncementAcknowledgement } from './types'

function daysAgo(days: number, hour = 9): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

export const mockAcknowledgements: AnnouncementAcknowledgement[] = [
  // Quarterly Safety Briefing — November (ann-001, all locations)
  { id: 'ack-001', announcement_id: 'ann-001', employee_id: 'emp-nomvula', first_opened_at: daysAgo(0, 9) },
  { id: 'ack-002', announcement_id: 'ann-001', employee_id: 'emp-lerato', first_opened_at: daysAgo(0, 10) },
  { id: 'ack-003', announcement_id: 'ann-001', employee_id: 'emp-anelisa', first_opened_at: daysAgo(0, 11) },
  { id: 'ack-004', announcement_id: 'ann-001', employee_id: 'emp-pieter', first_opened_at: daysAgo(0, 8) },
  { id: 'ack-005', announcement_id: 'ann-001', employee_id: 'emp-sipho', first_opened_at: daysAgo(0, 12) },
  { id: 'ack-006', announcement_id: 'ann-001', employee_id: 'emp-michael', first_opened_at: daysAgo(0, 13) },
  { id: 'ack-007', announcement_id: 'ann-001', employee_id: 'emp-johan', first_opened_at: daysAgo(0, 14) },
  { id: 'ack-008', announcement_id: 'ann-001', employee_id: 'demo-publisher', first_opened_at: daysAgo(0, 15) },
  { id: 'ack-009', announcement_id: 'ann-001', employee_id: 'demo-super-admin', first_opened_at: daysAgo(0, 16) },

  // Updated Leave Policy (ann-004, all locations)
  { id: 'ack-010', announcement_id: 'ann-004', employee_id: 'emp-nomvula', first_opened_at: daysAgo(2, 9) },
  { id: 'ack-011', announcement_id: 'ann-004', employee_id: 'emp-anelisa', first_opened_at: daysAgo(2, 10) },
  { id: 'ack-012', announcement_id: 'ann-004', employee_id: 'emp-lerato', first_opened_at: daysAgo(2, 11) },

  // Devon Site Access (ann-005, Devon)
  { id: 'ack-013', announcement_id: 'ann-005', employee_id: 'emp-sipho', first_opened_at: daysAgo(4, 8) },
  { id: 'ack-014', announcement_id: 'ann-005', employee_id: 'emp-rethabile', first_opened_at: daysAgo(4, 9) },

  // Sundra Shift Change (ann-008, Sundra)
  { id: 'ack-015', announcement_id: 'ann-008', employee_id: 'emp-kabelo', first_opened_at: daysAgo(7, 7) },

  // Emergency Contact Numbers (ann-009, all locations)
  { id: 'ack-016', announcement_id: 'ann-009', employee_id: 'emp-pieter', first_opened_at: daysAgo(1, 16) },
  { id: 'ack-017', announcement_id: 'ann-009', employee_id: 'emp-nomvula', first_opened_at: daysAgo(1, 17) },
  { id: 'ack-018', announcement_id: 'ann-009', employee_id: 'demo-publisher', first_opened_at: daysAgo(1, 18) },
]
