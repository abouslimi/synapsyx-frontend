import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth as useOIDCAuth } from 'react-oidc-context';
import { getAbsoluteUrl } from '@/lib/queryClient';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Download, 
  Printer, 
  Sun, 
  Moon,
  Maximize2,
  Minimize2,
  FileText,
  Highlighter,
  Eye,
  X,
  Settings,
  MessageSquare,
  Search,
  ChevronLeft,
  // ChevronRight,
  Layers,
  StickyNote,
  Square
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [activeTab, setActiveTab] = useState('viewer');
  const [embedMode, setEmbedMode] = useState<'FULL_WINDOW' | 'IN_LINE' | 'SIZED_CONTAINER' | 'LIGHT_BOX'>('FULL_WINDOW');
  const [enableAnnotations, setEnableAnnotations] = useState(true);
  const [showTools, setShowTools] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showPageControls, setShowPageControls] = useState(true);
  const [showZoomControl, setShowZoomControl] = useState(true);
  const [showDownloadPDF, setShowDownloadPDF] = useState(true);
  const [showPrintPDF, setShowPrintPDF] = useState(true);
  const [defaultViewMode, setDefaultViewMode] = useState<'FIT_PAGE' | 'FIT_WIDTH' | 'FIT_HEIGHT'>('FIT_WIDTH');
  const [searchTerm, setSearchTerm] = useState('');
  const [annotations, setAnnotations] = useState<any[]>([]);
  // const [selectedAnnotation, setSelectedAnnotation] = useState<any>(null);
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);

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
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const downloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${course.section_name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const printPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  // const addAnnotation = () => {
  //   if (annotationManager) {
  //     // Add a sample annotation
  //     const sampleAnnotation = {
  //       id: `annotation-${Date.now()}`,
  //       type: 'highlight',
  //       pageNumber: 1,
  //       bodyValue: 'Sample annotation',
  //       position: { x: 100, y: 100 }
  //     };
  //     
  //     annotationManager.addAnnotations([sampleAnnotation])
  //       .then(() => {
  //         console.log('Annotation added');
  //       })
  //       .catch((error: any) => {
  //         console.error('Failed to add annotation:', error);
  //       });
  //   }
  // };

  // const deleteAnnotation = (annotationId: string) => {
  //   if (annotationManager) {
  //     annotationManager.deleteAnnotations({ annotationIds: [annotationId] })
  //       .then(() => {
  //         console.log('Annotation deleted');
  //       })
  //       .catch((error: any) => {
  //         console.error('Failed to delete annotation:', error);
  //       });
  //   }
  // };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-full h-full' : 'max-w-7xl h-[90vh]'} p-0`}>
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
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
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-pdf"
                  placeholder="Search PDF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={embedMode === 'FULL_WINDOW' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setEmbedMode('FULL_WINDOW')}
                  title="Full Window"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={embedMode === 'IN_LINE' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setEmbedMode('IN_LINE')}
                  title="In Line"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant={embedMode === 'SIZED_CONTAINER' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setEmbedMode('SIZED_CONTAINER')}
                  title="Sized Container"
                >
                  <Square className="h-4 w-4" />
                </Button>
                <Button
                  variant={embedMode === 'LIGHT_BOX' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setEmbedMode('LIGHT_BOX')}
                  title="Light Box"
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </div>

              {/* Feature Toggles */}
              <div className="flex items-center gap-1">
                <Button
                  variant={enableAnnotations ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setEnableAnnotations(!enableAnnotations)}
                  title="Toggle Annotations"
                >
                  <Highlighter className="h-4 w-4" />
                </Button>
                <Button
                  variant={showTools ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowTools(!showTools)}
                  title="Toggle Tools"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant={showComments ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  title="Toggle Comments"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant={showAnnotationPanel ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowAnnotationPanel(!showAnnotationPanel)}
                  title="Toggle Annotation Panel"
                >
                  <StickyNote className="h-4 w-4" />
                </Button>
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

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
              {/* <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button> */}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
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
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
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
                <div className={`h-full ${isDarkMode ? 'dark' : ''}`}>
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
                      enableAnnotations={enableAnnotations}
                      showAnnotationTools={showTools}
                      showDownloadPDF={showDownloadPDF}
                      showPrintPDF={showPrintPDF}
                      showLeftHandPanel={showLeftPanel}
                      showPageControls={showPageControls}
                      showZoomControl={showZoomControl}
                      defaultViewMode={defaultViewMode}
                      className={embedMode === 'IN_LINE' ? 'in-line-container' : undefined}
                      width={embedMode === 'SIZED_CONTAINER' ? '100%' : undefined}
                      height={embedMode === 'SIZED_CONTAINER' ? 600 : 600}
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

            <TabsContent value="tools" className="flex-1 overflow-hidden mx-6 mb-6">
              <div className="h-full border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">PDF Tools</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={downloadPDF} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button onClick={printPDF} className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Print PDF
                  </Button>
                  <Button 
                    onClick={() => setEnableAnnotations(!enableAnnotations)}
                    variant={enableAnnotations ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Highlighter className="h-4 w-4" />
                    {enableAnnotations ? 'Disable' : 'Enable'} Annotations
                  </Button>
                  <Button 
                    onClick={() => setShowTools(!showTools)}
                    variant={showTools ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {showTools ? 'Hide' : 'Show'} Tools
                  </Button>
                  <Button 
                    onClick={() => setShowLeftPanel(!showLeftPanel)}
                    variant={showLeftPanel ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Layers className="h-4 w-4" />
                    {showLeftPanel ? 'Hide' : 'Show'} Left Panel
                  </Button>
                  <Button 
                    onClick={() => setShowPageControls(!showPageControls)}
                    variant={showPageControls ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {showPageControls ? 'Hide' : 'Show'} Page Controls
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 overflow-hidden mx-6 mb-6">
              <div className="h-full border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">PDF Settings</h3>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <Switch
                        id="dark-mode"
                        checked={isDarkMode}
                        onCheckedChange={setIsDarkMode}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="annotations">Enable Annotations</Label>
                      <Switch
                        id="annotations"
                        checked={enableAnnotations}
                        onCheckedChange={setEnableAnnotations}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tools">Show Tools</Label>
                      <Switch
                        id="tools"
                        checked={showTools}
                        onCheckedChange={setShowTools}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="comments">Show Comments</Label>
                      <Switch
                        id="comments"
                        checked={showComments}
                        onCheckedChange={setShowComments}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="left-panel">Show Left Panel</Label>
                      <Switch
                        id="left-panel"
                        checked={showLeftPanel}
                        onCheckedChange={setShowLeftPanel}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="page-controls">Show Page Controls</Label>
                      <Switch
                        id="page-controls"
                        checked={showPageControls}
                        onCheckedChange={setShowPageControls}
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