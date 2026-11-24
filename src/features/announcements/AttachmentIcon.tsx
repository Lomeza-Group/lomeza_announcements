import {
  File,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Presentation,
} from 'lucide-react'
import { getFileExtension, isImageFile, isPdfFile } from './attachmentUtils'
import type { AnnouncementAttachment } from './types'

export function AttachmentIcon({
  attachment,
}: {
  attachment: AnnouncementAttachment
}) {
  const extension = getFileExtension(attachment.fileName)

  if (isImageFile(attachment.fileName, attachment.fileType)) {
    return <ImageIcon aria-hidden="true" />
  }

  if (
    isPdfFile(attachment.fileName, attachment.fileType) ||
    extension === 'doc' ||
    extension === 'docx'
  ) {
    return <FileText aria-hidden="true" />
  }

  if (extension === 'xls' || extension === 'xlsx') {
    return <FileSpreadsheet aria-hidden="true" />
  }

  if (extension === 'ppt' || extension === 'pptx') {
    return <Presentation aria-hidden="true" />
  }

  return <File aria-hidden="true" />
}
