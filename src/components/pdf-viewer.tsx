import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth as useOIDCAuth } from 'react-oidc-context';
import { getAbsoluteUrl } from '@/lib/queryClient';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Maximize2,
  Minimize2,
  FileText,
  Highlighter,
  Eye,
  X,
} from "lucide-react";
import { PDFEmbed } from './pdf-embed';

interface CourseSection {
  course_id: string;
  section_id?: string;
  section_name: string;
  description?: string;
  split_page_count?: number;
  [key: string]: any;
}

interface PdfViewerProps {
  courseSection: CourseSection;
  isOpen: boolean;
  onClose: () => void;
  isSummary?: boolean;
}

export function PdfViewer({ courseSection: course, isOpen, onClose, isSummary = false }: PdfViewerProps) {
  const auth = useOIDCAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('viewer');
  const [embedMode, setEmbedMode] = useState<'FULL_WINDOW' | 'IN_LINE' | 'SIZED_CONTAINER' | 'LIGHT_BOX'>('FULL_WINDOW');

  const [showTools, setShowTools] = useState(true);
  const [showZoomControl, setShowZoomControl] = useState(true);
  const [showDownloadPDF, setShowDownloadPDF] = useState(true);
  const [showPrintPDF, setShowPrintPDF] = useState(true);
  const [defaultViewMode, setDefaultViewMode] = useState<'FIT_PAGE' | 'FIT_WIDTH' | 'FIT_HEIGHT'>('FIT_WIDTH');
  const [annotations, setAnnotations] = useState<any[]>([]);

  // Load isFullscreen state from localStorage when dialog opens
  useEffect(() => {
    if (isOpen) {
      const savedFullscreenState = localStorage.getItem('pdf-viewer-fullscreen');
      if (savedFullscreenState !== null) {
        setIsFullscreen(JSON.parse(savedFullscreenState));
      }
    }
  }, [isOpen]);

  // Save isFullscreen state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pdf-viewer-fullscreen', JSON.stringify(isFullscreen));
  }, [isFullscreen]);

  // Fetch presigned URL for PDF - use section endpoint if available, otherwise course endpoint
  const { data: pdfUrl, isLoading: isLoadingPdf, error: pdfUrlError } = useQuery({
    queryKey: [course.section_id ? API_ENDPOINTS.COURSE_SECTION_PDF_URL(course.section_id) : API_ENDPOINTS.COURSE_PDF_URL(course.course_id)],
    queryFn: async () => {
      const endpoint = course.section_id
        ? API_ENDPOINTS.COURSE_SECTION_PDF_URL(course.section_id)
        : API_ENDPOINTS.COURSE_PDF_URL(course.course_id);
      const response = await fetch(getAbsoluteUrl(endpoint));
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.presignedUrl;
    },
    enabled: isOpen && (!!course.course_id || !!course.section_id),
    retry: false, // Don't retry on 404 errors
  });

  console.log('## course', course);
  console.log('## annotations', annotations);


  const handlePDFLoaded = () => {
    console.log('PDF loaded successfully');
  };

  const handlePDFError = (error: any) => {
    console.error('PDF loading error:', error);
  };

  const handleAnnotationEvent = (event: any) => {
    console.log('Annotation event:', event);

    switch (event.type) {
      case 'ANNOTATION_ADDED':
        setAnnotations(prev => [...prev, event.data]);
        break;
      case 'ANNOTATION_DELETED':
        setAnnotations(prev => prev.filter(ann => ann.id !== event.data.id));
        break;
      case 'ANNOTATION_UPDATED':
        setAnnotations(prev => prev.map(ann =>
          ann.id === event.data.id ? event.data : ann
        ));
        break;
      case 'ANNOTATION_SELECTED':
        // setSelectedAnnotation(event.data);
        console.log('Annotation selected:', event.data);
        break;
      case 'ANNOTATION_UNSELECTED':
        // setSelectedAnnotation(null);
        console.log('Annotation unselected');
        break;
    }
  };

  const handleAnnotationManagerReady = () => {
    // Annotation manager ready
    console.log('Annotation manager ready');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-full h-full' : 'max-w-7xl h-[90vh]'} p-0`}>

        <div className="flex-1 overflow-hidden">
          <div className=" p-6 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {isSummary ? `Résumé - ${course.section_name}` : course.section_name}
                </DialogTitle>
                <DialogDescription>
                  {isSummary ? 'Résumé du cours' : 'Cours'}
                </DialogDescription>
              </div>
              {course.split_page_count && (
                <Badge variant="secondary">
                  {course.split_page_count} pages
                </Badge>
              )}
              {annotations.length > 0 && (
                <Badge variant="outline">
                  {annotations.length} annotations
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              {/* Close Button */}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-6 mb-4">
              <TabsTrigger value="viewer" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Viewer
              </TabsTrigger>
              <TabsTrigger value="annotations" className="flex items-center gap-2">
                <Highlighter className="h-4 w-4" />
                Annotations ({annotations.length})
              </TabsTrigger>
              {/* <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="viewer" className="flex-1 overflow-hidden mx-6 mb-6">
              {isLoadingPdf ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading PDF...</p>
                  </div>
                </div>
              ) : pdfUrlError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">PDF Not Available</h3>
                    <p className="text-muted-foreground mb-4">
                      {pdfUrlError instanceof Error && pdfUrlError.message.includes('PDF file not found')
                        ? 'This PDF file is not available in our storage system.'
                        : 'Failed to load PDF. Please try again later.'}
                    </p>
                    {pdfUrlError instanceof Error && pdfUrlError.message.includes('PDF file not found') && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        <p className="font-medium">What you can do:</p>
                        <ul className="mt-2 space-y-1 text-left">
                          <li>• Contact support to report this issue</li>
                          <li>• Check if the course has been updated</li>
                          <li>• Try refreshing the page</li>
                        </ul>
                      </div>
                    )}
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="mt-4"
                    >
                      Refresh Page
                    </Button>
                  </div>
                </div>
              ) : pdfUrl ? (
                <div className={`h-full`}>
                  {embedMode === 'LIGHT_BOX' ? (
                    <div className="h-full flex items-center justify-center">
                      <Button onClick={() => setEmbedMode('FULL_WINDOW')} size="lg">
                        <Eye className="h-4 w-4 mr-2" />
                        View PDF
                      </Button>
                    </div>
                  ) : (
                    <PDFEmbed
                      pdfUrl={pdfUrl}
                      fileName={course.section_name}
                      fileId={course.section_id}
                      embedMode={embedMode}
                      showAnnotationTools={showTools}
                      showDownloadPDF={showDownloadPDF}
                      showPrintPDF={showPrintPDF}
                      showZoomControl={showZoomControl}
                      defaultViewMode={defaultViewMode}
                      className={embedMode === 'IN_LINE' ? 'in-line-container' : undefined}
                      accessToken={auth.user?.access_token}
                      onPDFLoaded={handlePDFLoaded}
                      onPDFError={handlePDFError}
                      onAnnotationEvent={handleAnnotationEvent}
                      onAnnotationManagerReady={handleAnnotationManagerReady}
                    />
                  )}
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="settings" className="flex-1 overflow-hidden mx-6 mb-6">
              <div className="h-full border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">PDF Settings</h3>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tools">Show Tools</Label>
                      <Switch
                        id="tools"
                        checked={showTools}
                        onCheckedChange={setShowTools}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="zoom-control">Show Zoom Control</Label>
                      <Switch
                        id="zoom-control"
                        checked={showZoomControl}
                        onCheckedChange={setShowZoomControl}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="download-pdf">Show Download PDF</Label>
                      <Switch
                        id="download-pdf"
                        checked={showDownloadPDF}
                        onCheckedChange={setShowDownloadPDF}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="print-pdf">Show Print PDF</Label>
                      <Switch
                        id="print-pdf"
                        checked={showPrintPDF}
                        onCheckedChange={setShowPrintPDF}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Default View Mode</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={defaultViewMode === 'FIT_PAGE' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDefaultViewMode('FIT_PAGE')}
                      >
                        Fit Page
                      </Button>
                      <Button
                        variant={defaultViewMode === 'FIT_WIDTH' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDefaultViewMode('FIT_WIDTH')}
                      >
                        Fit Width
                      </Button>
                      <Button
                        variant={defaultViewMode === 'FIT_HEIGHT' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDefaultViewMode('FIT_HEIGHT')}
                      >
                        Fit Height
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}