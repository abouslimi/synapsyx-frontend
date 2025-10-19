import { SharedPdfViewer } from './shared-pdf-viewer';

interface CourseSection {
  course_id: string;
  section_id?: string;
  section_name: string;
  description?: string;
  split_page_count?: number;
  summary_id?: string;
  summary_file_path?: string;
  [key: string]: any;
}

interface PdfViewerProps {
  courseSection: CourseSection;
  isOpen: boolean;
  onClose: () => void;
  isSummary?: boolean;
}

export function PdfViewer({ courseSection, isOpen, onClose, isSummary = false }: PdfViewerProps) {
  return (
    <SharedPdfViewer
      courseSection={courseSection}
      isOpen={isOpen}
      onClose={onClose}
      isSummary={isSummary}
      isModal={true}
    />
  );
}