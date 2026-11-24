import type { AnnouncementAttachment } from './types'

export const MAX_ATTACHMENTS = 10
export const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024

export const ACCEPTED_FILE_TYPES =
  '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

const SUPPORTED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
])

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

export function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : ''
}

export function isImageFile(fileName: string, fileType: string): boolean {
  return (
    fileType.startsWith('image/') ||
    IMAGE_EXTENSIONS.has(getFileExtension(fileName))
  )
}

export function isPdfFile(fileName: string, fileType: string): boolean {
  return (
    fileType === 'application/pdf' || getFileExtension(fileName) === 'pdf'
  )
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileTypeLabel(fileName: string, fileType: string): string {
  const extension = getFileExtension(fileName)

  if (isPdfFile(fileName, fileType)) {
    return 'PDF document'
  }

  if (isImageFile(fileName, fileType)) {
    return `${extension.toUpperCase()} image`
  }

  if (extension === 'doc' || extension === 'docx') {
    return 'Word document'
  }

  if (extension === 'xls' || extension === 'xlsx') {
    return 'Spreadsheet'
  }

  if (extension === 'ppt' || extension === 'pptx') {
    return 'Presentation'
  }

  return extension ? extension.toUpperCase() : 'Document'
}

export function validateAttachmentFile(file: File): string | null {
  const extension = getFileExtension(file.name)

  if (!extension || !SUPPORTED_EXTENSIONS.has(extension)) {
    return `"${file.name}" is not a supported file type.`
  }

  if (file.size === 0) {
    return `"${file.name}" is empty.`
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    return `"${file.name}" exceeds the 20 MB limit.`
  }

  const mimeSupported = IMAGE_EXTENSIONS.has(extension)
    ? IMAGE_MIME_TYPES.has(file.type)
    : DOCUMENT_MIME_TYPES.has(file.type)

  if (!mimeSupported) {
    return `"${file.name}" is not a supported file type.`
  }

  return null
}

export function isDuplicateAttachment(
  attachments: AnnouncementAttachment[],
  file: File,
): boolean {
  return attachments.some(
    (attachment) =>
      attachment.fileName === file.name &&
      attachment.fileSize === file.size &&
      (attachment.file
        ? attachment.file.lastModified === file.lastModified
        : true),
  )
}

export function createAttachment(
  file: File,
  uploadedBy: string,
  announcementId: string,
): AnnouncementAttachment {
  return {
    id: `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    announcementId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    uploadedBy,
    createdAt: new Date().toISOString(),
    filePath: null,
    file,
    previewUrl: isImageFile(file.name, file.type)
      ? URL.createObjectURL(file)
      : null,
  }
}

export function downloadAttachmentFile(
  attachment: AnnouncementAttachment,
): void {
  const url = attachment.file
    ? URL.createObjectURL(attachment.file)
    : (attachment.previewUrl ?? null)

  if (!url) {
    return
  }

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = attachment.fileName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  if (attachment.file) {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
