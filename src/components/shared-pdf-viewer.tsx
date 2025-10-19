import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth as useOIDCAuth } from 'react-oidc-context';
import { getQueryFn } from '@/lib/queryClient';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { pdfAnnotationService, type PdfAnnotationResponse, type AnnotationData } from '@/lib/pdfAnnotationService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Maximize2,
  Minimize2,
  FileText,
  Highlighter,
  Eye,
  X,
  RefreshCw,
} from "lucide-react";
import { PDFEmbed } from './pdf-embed';
import CustomAnnotationList from './pdf-embed/CustomAnnotationList';

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

interface SharedPdfViewerProps {
  courseSection: CourseSection;
  isOpen: boolean;
  onClose: () => void;
  isSummary?: boolean;
  isModal?: boolean; // New prop to control modal vs full-page display
}

export function SharedPdfViewer({ 
  courseSection, 
  isOpen, 
  onClose, 
  isSummary = false, 
  isModal = true 
}: SharedPdfViewerProps) {
  const auth = useOIDCAuth();
  const queryClient = useQueryClient();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState(isSummary? 'summary' : 'viewer');
  const [embedMode, setEmbedMode] = useState<'FULL_WINDOW' | 'IN_LINE' | 'SIZED_CONTAINER' | 'LIGHT_BOX'>('FULL_WINDOW');

  const [courseAnnotations, setCourseAnnotations] = useState<PdfAnnotationResponse[]>([]);
  const [summaryAnnotations, setSummaryAnnotations] = useState<PdfAnnotationResponse[]>([]);
  const [showAnnotations] = useState(true);
  const [loadedAnnotationIds, setLoadedAnnotationIds] = useState<Set<string>>(new Set());
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | undefined>();
  const annotationManagerRef = useRef<any>(null);
  const activeTabRef = useRef<string>(activeTab);

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

  // Track activeTab changes and reset loadedAnnotationIds when switching to viewer
  useEffect(() => {
    const handleTabChange = () => {
      // Get the current activeTab value from the state
      // Since we can't directly access the previous value, we'll use a ref to track it
      const previousTab = activeTabRef.current;
      if (activeTab === 'viewer' && previousTab && previousTab !== 'viewer') {
        setLoadedAnnotationIds(new Set());
      }
      activeTabRef.current = activeTab;
    };

    handleTabChange();
  }, [activeTab]);

  // Fetch presigned URL for PDF - use section endpoint if available, otherwise course endpoint
  const { data: pdfUrl, isLoading: isLoadingPdf, error: pdfUrlError } = useQuery({
    queryKey: [courseSection.section_id ? API_ENDPOINTS.COURSE_SECTION_PDF_URL(courseSection.section_id) : API_ENDPOINTS.COURSE_PDF_URL(courseSection.course_id)],
    queryFn: getQueryFn<{ presignedUrl: string }>({ 
      on401: "throw",
      token: auth.user?.access_token 
    }),
    enabled: isOpen && (!!courseSection.course_id || !!courseSection.section_id) && auth.isAuthenticated,
    retry: false, // Don't retry on 404 errors
  });

  // Fetch presigned URL for summary PDF
  const { data: summaryPdfUrl, isLoading: isLoadingSummaryPdf, error: summaryPdfUrlError } = useQuery({
    queryKey: [API_ENDPOINTS.COURSE_SECTION_SUMMARY_URL(courseSection.section_id!)],
    queryFn: getQueryFn<{ presignedUrl: string }>({ 
      on401: "throw",
      token: auth.user?.access_token 
    }),
    enabled: isOpen && !!courseSection.section_id && !!courseSection.summary_file_path && auth.isAuthenticated,
    retry: false, // Don't retry on 404 errors
  });

  // Fetch course annotations (is_summary = false)
  const { data: courseAnnotationsData, isLoading: isLoadingCourseAnnotations, refetch: refetchCourseAnnotations, error: courseAnnotationsError } = useQuery({
    queryKey: ['pdf-annotations-course', courseSection.section_id, courseSection.course_id],
    queryFn: async () => {
      if (!auth.user?.access_token) {
        throw new Error('No access token available');
      }
      
      const params: any = {
        is_summary: false
      };
      if (courseSection.section_id) {
        params.course_section_id = courseSection.section_id;
      }
      
      console.log('Fetching course annotations with params:', params);
      return pdfAnnotationService.getAnnotations(params, auth.user.access_token);
    },
    enabled: isOpen && !!auth.user?.access_token && !!courseSection.section_id,
    retry: false,
  });

  // Fetch summary annotations (is_summary = true)
  const { data: summaryAnnotationsData, isLoading: isLoadingSummaryAnnotations, refetch: refetchSummaryAnnotations, error: summaryAnnotationsError } = useQuery({
    queryKey: ['pdf-annotations-summary', courseSection.section_id, courseSection.summary_id],
    queryFn: async () => {
      if (!auth.user?.access_token) {
        throw new Error('No access token available');
      }
      
      const params: any = {
        is_summary: true
      };
      if (courseSection.section_id) {
        params.course_section_id = courseSection.section_id;
      }
      
      console.log('Fetching summary annotations with params:', params);
      return pdfAnnotationService.getAnnotations(params, auth.user.access_token);
    },
    enabled: isOpen && !!auth.user?.access_token && !!courseSection.section_id,
    retry: false,
  });

  // Mutation for creating annotations
  const createAnnotationMutation = useMutation({
    mutationFn: async (annotationData: AnnotationData) => {
      if (!auth.user?.access_token) {
        throw new Error('No access token available');
      }
      
      // Determine if this is a summary annotation based on the current active tab
      const isSummaryAnnotation = activeTab === 'summary';
      
      const request = {
        course_section_id: courseSection.section_id || null,
        is_summary: isSummaryAnnotation,
        annotation: annotationData,
      };
      
      return pdfAnnotationService.createAnnotation(request, auth.user.access_token);
    },
    onSuccess: (newAnnotation) => {
      // Determine which annotation list to add to based on the current active tab
      const isSummaryAnnotation = activeTab === 'summary';
      
      if (isSummaryAnnotation) {
        setSummaryAnnotations(prev => [...prev, newAnnotation]);
      } else {
        setCourseAnnotations(prev => [...prev, newAnnotation]);
      }
      // Add the new annotation ID to loaded set
      setLoadedAnnotationIds(prev => new Set(prev).add(newAnnotation.annotation.id));
      queryClient.invalidateQueries({ queryKey: ['pdf-annotations'] });
    },
    onError: (error) => {
      console.error('Failed to create annotation:', error);
    },
  });

  // Mutation for updating annotations
  const updateAnnotationMutation = useMutation({
    mutationFn: async ({ annotationId, annotationData }: { annotationId: string; annotationData: AnnotationData }) => {
      if (!auth.user?.access_token) {
        throw new Error('No access token available');
      }
      
      const request = {
        annotation: annotationData,
      };
      
      return pdfAnnotationService.updateAnnotation(annotationId, request, auth.user.access_token);
    },
    onSuccess: (updatedAnnotation) => {
      // Update in the appropriate annotation list
      setCourseAnnotations(prev => prev.map(ann => 
        ann.annotation_id === updatedAnnotation.annotation_id ? updatedAnnotation : ann
      ));
      setSummaryAnnotations(prev => prev.map(ann => 
        ann.annotation_id === updatedAnnotation.annotation_id ? updatedAnnotation : ann
      ));
      queryClient.invalidateQueries({ queryKey: ['pdf-annotations'] });
    },
    onError: (error) => {
      console.error('Failed to update annotation:', error);
    },
  });

  // Mutation for deleting annotations
  const deleteAnnotationMutation = useMutation({
    mutationFn: async (annotationId: string) => {
      if (!auth.user?.access_token) {
        throw new Error('No access token available');
      }
      
      return pdfAnnotationService.deleteAnnotation(annotationId, auth.user.access_token);
    },
    onSuccess: (_, annotationId) => {
      // Remove from both annotation lists
      setCourseAnnotations(prev => prev.filter(ann => ann.annotation_id !== annotationId));
      setSummaryAnnotations(prev => prev.filter(ann => ann.annotation_id !== annotationId));
      // Remove the deleted annotation ID from loaded set
      setLoadedAnnotationIds(prev => {
        const newSet = new Set(prev);
        const courseAnnotationToRemove = courseAnnotations.find(ann => ann.annotation_id === annotationId);
        const summaryAnnotationToRemove = summaryAnnotations.find(ann => ann.annotation_id === annotationId);
        const annotationToRemove = courseAnnotationToRemove || summaryAnnotationToRemove;
        if (annotationToRemove) {
          newSet.delete(annotationToRemove.annotation.id);
        }
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['pdf-annotations'] });
    },
    onError: (error) => {
      console.error('Failed to delete annotation:', error);
    },
  });

  // Mutation for cleaning up orphaned annotations
  const cleanupOrphanedMutation = useMutation({
    mutationFn: async (orphanedIds: string[]) => {
      if (!auth.user?.access_token) {
        throw new Error('No access token available');
      }
      
      return pdfAnnotationService.bulkDeleteAnnotations(orphanedIds, auth.user.access_token);
    },
    onSuccess: (_, orphanedIds) => {
      // Remove from both annotation lists
      setCourseAnnotations(prev => prev.filter(ann => !orphanedIds.includes(ann.annotation_id)));
      setSummaryAnnotations(prev => prev.filter(ann => !orphanedIds.includes(ann.annotation_id)));
      // Remove the deleted annotation IDs from loaded set
      setLoadedAnnotationIds(prev => {
        const newSet = new Set(prev);
        orphanedIds.forEach(id => {
          const courseAnnotationToRemove = courseAnnotations.find(ann => ann.annotation_id === id);
          const summaryAnnotationToRemove = summaryAnnotations.find(ann => ann.annotation_id === id);
          const annotationToRemove = courseAnnotationToRemove || summaryAnnotationToRemove;
          if (annotationToRemove) {
            newSet.delete(annotationToRemove.annotation.id);
          }
        });
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['pdf-annotations'] });
    },
    onError: (error) => {
      console.error('Failed to cleanup orphaned annotations:', error);
    },
  });

  // Update local annotations state when API data changes
  useEffect(() => {
    if (courseAnnotationsData?.annotations) {
      setCourseAnnotations(courseAnnotationsData.annotations);
      console.log('###### courseAnnotationsData', courseAnnotationsData);
    }
  }, [courseAnnotationsData]);

  useEffect(() => {
    if (summaryAnnotationsData?.annotations) {
      setSummaryAnnotations(summaryAnnotationsData.annotations);
      console.log('###### summaryAnnotationsData', summaryAnnotationsData);
    }
  }, [summaryAnnotationsData]);

  // Helper function to safely load annotations
  const loadAnnotationsSafely = async (manager: any, annotationsToLoad: PdfAnnotationResponse[]) => {
    if (!manager || annotationsToLoad.length === 0) return;
    // console.log('## annotationsToLoad', annotationsToLoad);
    // console.log('## loadedAnnotationIds', loadedAnnotationIds);

    // Filter out annotations that are already loaded
    const newAnnotations = annotationsToLoad.filter(ann => !loadedAnnotationIds.has(ann.annotation.id));
    // console.log('## newAnnotations', newAnnotations);
    
    if (newAnnotations.length === 0) {
      console.log('All annotations already loaded, skipping');
      return;
    }

    try {
      const adobeAnnotations = newAnnotations.map(ann => 
        pdfAnnotationService.convertApiAnnotationToAdobe(ann)
      );
      
      await manager.addAnnotations(adobeAnnotations);
      
      // Update the loaded annotation IDs
      setLoadedAnnotationIds(prev => {
        const newSet = new Set(prev);
        newAnnotations.forEach(ann => newSet.add(ann.annotation.id));
        return newSet;
      });
      
      console.log(`Loaded ${newAnnotations.length} new annotations into PDF viewer`);
    } catch (error: any) {
      console.error('Failed to load annotations into PDF viewer:', error);
    }
  };

  // Load annotations into PDF viewer when annotation manager is ready
  useEffect(() => {
    if (annotationManagerRef.current && showAnnotations) {
      // Load course annotations when in viewer tab
      if (activeTab === 'viewer' && courseAnnotations.length > 0) {
        loadAnnotationsSafely(annotationManagerRef.current, courseAnnotations);
      }
      // Load summary annotations when in summary tab
      else if (activeTab === 'summary' && summaryAnnotations.length > 0) {
        loadAnnotationsSafely(annotationManagerRef.current, summaryAnnotations);
      }
    }
  }, [annotationManagerRef.current, courseAnnotations, summaryAnnotations, showAnnotations, loadedAnnotationIds, activeTab]);

  console.log('## course', courseSection);
  console.log('## courseAnnotations', courseAnnotations);
  console.log('## summaryAnnotations', summaryAnnotations);
  console.log('## courseAnnotationsData', courseAnnotationsData);
  console.log('## summaryAnnotationsData', summaryAnnotationsData);
  console.log('## isLoadingCourseAnnotations', isLoadingCourseAnnotations);
  console.log('## isLoadingSummaryAnnotations', isLoadingSummaryAnnotations);
  console.log('## courseAnnotationsError', courseAnnotationsError);
  console.log('## summaryAnnotationsError', summaryAnnotationsError);
  console.log('## auth.user?.access_token exists:', !!auth.user?.access_token);
  console.log('## isOpen:', isOpen);
  console.log('## courseSection.section_id:', courseSection.section_id);
  console.log('## courseSection.summary_id:', courseSection.summary_id);
  console.log('## isSummary:', isSummary);

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
        // Check if annotation already exists before creating
        const existingCourseAnnotation = courseAnnotations.find(ann => 
          ann.annotation.id === event.data.id
        );
        const existingSummaryAnnotation = summaryAnnotations.find(ann => 
          ann.annotation.id === event.data.id
        );
        
        if (existingCourseAnnotation || existingSummaryAnnotation) {
          console.log('Annotation already exists, skipping creation:', event.data.id);
          return;
        }
        
        // Convert Adobe annotation to API format and create via API
        const apiAnnotation = pdfAnnotationService.convertAdobeAnnotationToApi(
          event.data,
          courseSection.section_id,
          undefined
        );
        createAnnotationMutation.mutate(apiAnnotation);
        break;
        
      case 'ANNOTATION_DELETED':
        // Find the annotation in our local state and delete via API
        const courseAnnotationToDelete = courseAnnotations.find(ann => ann.annotation.id === event.data.id);
        const summaryAnnotationToDelete = summaryAnnotations.find(ann => ann.annotation.id === event.data.id);
        const annotationToDelete = courseAnnotationToDelete || summaryAnnotationToDelete;
        if (annotationToDelete) {
          deleteAnnotationMutation.mutate(annotationToDelete.annotation_id);
        }
        break;
        
      case 'ANNOTATION_UPDATED':
        // Find the annotation in our local state and update via API
        const courseAnnotationToUpdate = courseAnnotations.find(ann => ann.annotation.id === event.data.id);
        const summaryAnnotationToUpdate = summaryAnnotations.find(ann => ann.annotation.id === event.data.id);
        const annotationToUpdate = courseAnnotationToUpdate || summaryAnnotationToUpdate;
        if (annotationToUpdate) {
          const apiAnnotation = pdfAnnotationService.convertAdobeAnnotationToApi(event.data);
          updateAnnotationMutation.mutate({
            annotationId: annotationToUpdate.annotation_id,
            annotationData: apiAnnotation,
          });
        }
        break;
        
      case 'ANNOTATION_SELECTED':
        console.log('Annotation selected:', event.data);
        break;
        
      case 'ANNOTATION_UNSELECTED':
        console.log('Annotation unselected');
        break;
    }
  };

  const handleAnnotationManagerReady = (manager: any) => {
    console.log('Annotation manager ready');
    annotationManagerRef.current = manager;
    
    // Load existing annotations if any based on current tab
    if (showAnnotations) {
      if (activeTab === 'viewer' && courseAnnotations.length > 0) {
        loadAnnotationsSafely(manager, courseAnnotations);
      } else if (activeTab === 'summary' && summaryAnnotations.length > 0) {
        loadAnnotationsSafely(manager, summaryAnnotations);
      }
    }
  };

  const handleAnnotationSelect = (annotationId: string) => {
    setSelectedAnnotationId(annotationId);
    // You can add additional logic here to highlight the annotation in the PDF viewer
    console.log('Annotation selected:', annotationId);
  };

  const handleAnnotationEdit = (annotationId: string, newBodyValue: string) => {
    const courseAnnotationToUpdate = courseAnnotations.find(ann => ann.annotation_id === annotationId);
    const summaryAnnotationToUpdate = summaryAnnotations.find(ann => ann.annotation_id === annotationId);
    const annotationToUpdate = courseAnnotationToUpdate || summaryAnnotationToUpdate;
    
    if (annotationToUpdate) {
      const updatedAnnotationData = {
        ...annotationToUpdate.annotation,
        bodyValue: newBodyValue,
        modified: new Date().toISOString()
      };
      
      updateAnnotationMutation.mutate({
        annotationId: annotationToUpdate.annotation_id,
        annotationData: updatedAnnotationData,
      });
    }
  };

  const handleAnnotationDelete = (annotationId: string) => {
    deleteAnnotationMutation.mutate(annotationId);
  };

  const handleCleanupOrphaned = (orphanedIds: string[]) => {
    cleanupOrphanedMutation.mutate(orphanedIds);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  // Render as modal or full page based on isModal prop
  if (isModal) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`${isFullscreen ? 'max-w-full h-full' : 'max-w-7xl h-[90vh]'} p-0`}>
          <div className="flex-1 overflow-hidden">
            <div className=" p-6 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {isSummary ? `Résumé - ${courseSection.section_name}` : courseSection.section_name}
                  </DialogTitle>
                  <DialogDescription>
                    {isSummary ? 'Résumé du cours' : 'Cours'}
                  </DialogDescription>
                </div>
                {courseSection.split_page_count && (
                  <Badge variant="secondary">
                    {courseSection.split_page_count} pages
                  </Badge>
                )}
                {(courseAnnotations.length > 0 || summaryAnnotations.length > 0) && (
                  <Badge variant="outline">
                    {courseAnnotations.length + summaryAnnotations.length} annotations
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Refresh Annotations */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    refetchCourseAnnotations();
                    refetchSummaryAnnotations();
                  }}
                  title="Actualiser les annotations"
                  disabled={isLoadingCourseAnnotations || isLoadingSummaryAnnotations}
                >
                  <RefreshCw className={`h-4 w-4 ${(isLoadingCourseAnnotations || isLoadingSummaryAnnotations) ? 'animate-spin' : ''}`} />
                </Button>

                {/* Fullscreen Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>

                {/* Close Button */}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>
    );
  } else {
    // Full page layout
    return (
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold">
                {isSummary ? `Résumé - ${courseSection.section_name}` : courseSection.section_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isSummary ? 'Résumé du cours' : 'Cours'}
              </p>
            </div>
            {courseSection.split_page_count && (
              <Badge variant="secondary">
                {courseSection.split_page_count} pages
              </Badge>
            )}
            {(courseAnnotations.length > 0 || summaryAnnotations.length > 0) && (
              <Badge variant="outline">
                {courseAnnotations.length + summaryAnnotations.length} annotations
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Annotations */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                refetchCourseAnnotations();
                refetchSummaryAnnotations();
              }}
              title="Actualiser les annotations"
              disabled={isLoadingCourseAnnotations || isLoadingSummaryAnnotations}
            >
              <RefreshCw className={`h-4 w-4 ${(isLoadingCourseAnnotations || isLoadingSummaryAnnotations) ? 'animate-spin' : ''}`} />
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            {/* Close Button */}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    );
  }

  function renderContent() {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="mx-6 mb-4">
          <TabsTrigger value="viewer" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Cours
          </TabsTrigger>
          {courseSection.summary_file_path && (
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Résumé
            </TabsTrigger>
          )}
          <TabsTrigger value="annotations" className="flex items-center gap-2">
            <Highlighter className="h-4 w-4" />
            Annotations ({courseAnnotations.length + summaryAnnotations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="viewer" className="flex-1 overflow-hidden mx-6 mb-6">
          {isLoadingPdf ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement du PDF...</p>
              </div>
            </div>
          ) : pdfUrlError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">PDF non disponible</h3>
                <p className="text-muted-foreground mb-4">
                  {pdfUrlError instanceof Error && pdfUrlError.message.includes('PDF file not found')
                    ? 'Ce fichier PDF n\'est pas disponible dans notre système de stockage.'
                    : 'Échec du chargement du PDF. Veuillez réessayer plus tard.'}
                </p>
                {pdfUrlError instanceof Error && pdfUrlError.message.includes('PDF file not found') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    <p className="font-medium">Ce que vous pouvez faire :</p>
                    <ul className="mt-2 space-y-1 text-left">
                      <li>• Contactez le support pour signaler ce problème</li>
                      <li>• Vérifiez si le cours a été mis à jour</li>
                      <li>• Essayez de rafraîchir la page</li>
                    </ul>
                  </div>
                )}
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="mt-4"
                >
                  Actualiser la page
                </Button>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className={`h-full`}>
              {embedMode === 'LIGHT_BOX' ? (
                <div className="h-full flex items-center justify-center">
                  <Button onClick={() => setEmbedMode('FULL_WINDOW')} size="lg">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir le PDF
                  </Button>
                </div>
              ) : (
                <PDFEmbed
                  pdfUrl={pdfUrl.presignedUrl}
                  fileName={courseSection.section_name}
                  fileId={courseSection.section_id}
                  embedMode={embedMode}
                  showAnnotationTools={true}
                  showDownloadPDF={true}
                  showPrintPDF={true}
                  showZoomControl={true}
                  includePDFAnnotations={true}
                  defaultViewMode="FIT_WIDTH"
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

        {courseSection.summary_file_path && (
          <TabsContent value="summary" className="flex-1 overflow-hidden mx-6 mb-6">
            {isLoadingSummaryPdf ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Chargement du résumé...</p>
                </div>
              </div>
            ) : summaryPdfUrlError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Résumé non disponible</h3>
                  <p className="text-muted-foreground mb-4">
                    {summaryPdfUrlError instanceof Error && summaryPdfUrlError.message.includes('PDF file not found')
                      ? 'Ce résumé n\'est pas disponible dans notre système de stockage.'
                      : 'Échec du chargement du résumé. Veuillez réessayer plus tard.'}
                  </p>
                  {summaryPdfUrlError instanceof Error && summaryPdfUrlError.message.includes('PDF file not found') && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      <p className="font-medium">Ce que vous pouvez faire :</p>
                      <ul className="mt-2 space-y-1 text-left">
                        <li>• Contactez le support pour signaler ce problème</li>
                        <li>• Vérifiez si le cours a été mis à jour</li>
                        <li>• Essayez de rafraîchir la page</li>
                      </ul>
                    </div>
                  )}
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mt-4"
                  >
                    Actualiser la page
                  </Button>
                </div>
              </div>
            ) : summaryPdfUrl ? (
              <div className={`h-full`}>
                <PDFEmbed
                  pdfUrl={summaryPdfUrl.presignedUrl}
                  fileName={`Résumé - ${courseSection.section_name}`}
                  fileId={courseSection.section_id}
                  embedMode={embedMode}
                  showAnnotationTools={true}
                  showDownloadPDF={true}
                  showPrintPDF={true}
                  showZoomControl={true}
                  includePDFAnnotations={true}
                  defaultViewMode="FIT_WIDTH"
                  className={embedMode === 'IN_LINE' ? 'in-line-container' : undefined}
                  accessToken={auth.user?.access_token}
                  onPDFLoaded={handlePDFLoaded}
                  onPDFError={handlePDFError}
                  onAnnotationEvent={handleAnnotationEvent}
                  onAnnotationManagerReady={handleAnnotationManagerReady}
                />
              </div>
            ) : null}
          </TabsContent>
        )}

        <TabsContent value="annotations" className="flex-1 overflow-hidden mx-6 mb-6">
          <div className="h-full border rounded-lg">
            {isLoadingCourseAnnotations || isLoadingSummaryAnnotations ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Chargement des annotations...</p>
                </div>
              </div>
            ) : (courseAnnotations.length === 0 && summaryAnnotations.length === 0) ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Highlighter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune annotation pour le moment</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ajoutez des annotations en surlignant le texte dans la visionneuse PDF
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold mb-2">Annotations du cours et du résumé</h3>
                  <p className="text-sm text-muted-foreground">
                    {courseAnnotations.length} annotation(s) du cours • {summaryAnnotations.length} annotation(s) du résumé
                  </p>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Tabs defaultValue="course" className="h-full flex flex-col">
                    <TabsList className="mx-4 mt-4">
                      <TabsTrigger value="course" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Cours ({courseAnnotations.length})
                      </TabsTrigger>
                      <TabsTrigger value="summary" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Résumé ({summaryAnnotations.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="course" className="flex-1 overflow-hidden">
                      <CustomAnnotationList
                        annotations={courseAnnotations}
                        onEditAnnotation={handleAnnotationEdit}
                        onDeleteAnnotation={handleAnnotationDelete}
                        onAnnotationSelect={handleAnnotationSelect}
                        selectedAnnotationId={selectedAnnotationId}
                        onCleanupOrphaned={handleCleanupOrphaned}
                        accessToken={auth.user?.access_token}
                        className="h-full"
                        annotationType="course"
                      />
                    </TabsContent>
                    <TabsContent value="summary" className="flex-1 overflow-hidden">
                      <CustomAnnotationList
                        annotations={summaryAnnotations}
                        onEditAnnotation={handleAnnotationEdit}
                        onDeleteAnnotation={handleAnnotationDelete}
                        onAnnotationSelect={handleAnnotationSelect}
                        selectedAnnotationId={selectedAnnotationId}
                        onCleanupOrphaned={handleCleanupOrphaned}
                        accessToken={auth.user?.access_token}
                        className="h-full"
                        annotationType="summary"
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    );
  }
}
