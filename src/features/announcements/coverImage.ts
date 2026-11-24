import {
  Factory,
  Megaphone,
  Monitor,
  Newspaper,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const COVER_ACCEPTED_TYPES: string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

export const COVER_MAX_BYTES = 5 * 1024 * 1024

const COVER_EXTENSION_MIME_TYPES: Record<string, string[]> = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : ''
}

export interface CategoryCoverStyle {
  gradient: string
  icon: LucideIcon
}

export function validateCoverFile(file: File): string | null {
  const extension = getExtension(file.name)
  const allowedMimeTypes = COVER_EXTENSION_MIME_TYPES[extension]

  if (!allowedMimeTypes) {
    return 'Cover image must be a JPG, PNG or WEBP file.'
  }

  if (file.size === 0) {
    return 'The selected cover image is empty.'
  }

  if (file.size > COVER_MAX_BYTES) {
    return 'Cover image must be 5 MB or smaller.'
  }

  if (
    !COVER_ACCEPTED_TYPES.includes(file.type) ||
    !allowedMimeTypes.includes(file.type)
  ) {
    return 'Cover image type does not match its file extension.'
  }

  return null
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Unable to read the selected cover image.'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Unable to read the selected cover image.'))
    }

    reader.readAsDataURL(file)
  })
}

export function getCategoryCoverStyle(
  category: string,
): CategoryCoverStyle {
  switch (category) {
    case 'Safety':
      return {
        gradient: 'linear-gradient(135deg, #15803D 0%, #14532D 100%)',
        icon: ShieldCheck,
      }
    case 'Operations':
      return {
        gradient: 'linear-gradient(135deg, #3D6F9C 0%, #233D59 100%)',
        icon: Factory,
      }
    case 'Human Resources':
      return {
        gradient: 'linear-gradient(135deg, #4B6C8A 0%, #315D86 100%)',
        icon: Users,
      }
    case 'IT':
      return {
        gradient: 'linear-gradient(135deg, #1D4ED8 0%, #1E3A8A 100%)',
        icon: Monitor,
      }
    case 'Maintenance':
      return {
        gradient: 'linear-gradient(135deg, #B45309 0%, #7C2D12 100%)',
        icon: Wrench,
      }
    case 'General':
      return {
        gradient: 'linear-gradient(135deg, #315D86 0%, #172B43 100%)',
        icon: Megaphone,
      }
    default:
      return {
        gradient: 'linear-gradient(135deg, #315D86 0%, #172B43 100%)',
        icon: Newspaper,
      }
  }
}
