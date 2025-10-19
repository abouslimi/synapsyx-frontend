import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth as useOIDCAuth } from 'react-oidc-context';
import { getAbsoluteUrl } from '@/lib/queryClient';
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
  [key: string]: any;
}

interface PdfViewerProps {
  courseSection: CourseSection;
  isOpen: boolean;
  onClose: () => void;
  isSummary?: boolean;
}

export function PdfViewer({ courseSection, isOpen, onClose, isSummary = false }: PdfViewerProps) {
  const auth = useOIDCAuth();
  const queryClient = useQueryClient();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('viewer');
  const [embedMode, setEmbedMode] = useState<'FULL_WINDOW' | 'IN_LINE' | 'SIZED_CONTAINER' | 'LIGHT_BOX'>('FULL_WINDOW');

  const [annotations, setAnnotations] = useState<PdfAnnotationResponse[]>([]);
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
    queryFn: async () => {
      const endpoint = courseSection.section_id
        ? API_ENDPOINTS.COURSE_SECTION_PDF_URL(courseSection.section_id)
        : API_ENDPOINTS.COURSE_PDF_URL(courseSection.course_id);
      const response = await fetch(getAbsoluteUrl(endpoint));
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.presignedUrl;
    },
    enabled: isOpen && (!!courseSection.course_id || !!courseSection.section_id),
    retry: false, // Don't retry on 404 errors
  });

  // Fetch annotations for the current course section
  const { data: annotationsData, isLoading: isLoadingAnnotationsData, refetch: refetchAnnotations, error: annotationsError } = useQuery({
    queryKey: ['pdf-annotations', courseSection.section_id, courseSection.course_id, courseSection.summary_id, isSummary],
    queryFn: async () => {
      if (!auth.user?.access_token) {
        throw new Error('No access token available');
      }
      
      const params: any = {};
      if (courseSection.section_id) {
        params.course_section_id = courseSection.section_id;
      }
      if (isSummary) {
        params.summary_id = courseSection.summary_id; 
      }
      
      console.log('Fetching annotations with params:', params);
      return pdfAnnotationService.getAnnotations(params, auth.user.access_token);
    },
    enabled: isOpen && !!auth.user?.access_token && (!!courseSection.section_id || !!courseSection.summary_id),
    retry: false,
  });

  // Mutation for creating annotations
  const createAnnotationMutation = useMutation({
    mutationFn: async (annotationData: AnnotationData) => {
      if (!auth.user?.access_token) {
        throw new Error('No access token available');
      }
      
      const request = {
        course_section_id: courseSection.section_id || null,
        summary_id: isSummary ? courseSection.summary_id : undefined,
        annotation: annotationData,
      };
      
      return pdfAnnotationService.createAnnotation(request, auth.user.access_token);
    },
    onSuccess: (newAnnotation) => {
      setAnnotations(prev => [...prev, newAnnotation]);
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
      setAnnotations(prev => prev.map(ann => 
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
      setAnnotations(prev => prev.filter(ann => ann.annotation_id !== annotationId));
      // Remove the deleted annotation ID from loaded set
      setLoadedAnnotationIds(prev => {
        const newSet = new Set(prev);
        const annotationToRemove = annotations.find(ann => ann.annotation_id === annotationId);
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
      setAnnotations(prev => prev.filter(ann => !orphanedIds.includes(ann.annotation_id)));
      // Remove the deleted annotation IDs from loaded set
      setLoadedAnnotationIds(prev => {
        const newSet = new Set(prev);
        orphanedIds.forEach(id => {
          const annotationToRemove = annotations.find(ann => ann.annotation_id === id);
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
    if (annotationsData?.annotations) {
      setAnnotations(annotationsData.annotations);
      console.log('###### annotationsData', annotationsData);
      // Reset loaded annotation IDs when annotations change
      // setLoadedAnnotationIds(new Set());
    }
  }, [annotationsData]);

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
    if (annotationManagerRef.current && annotations.length > 0 && showAnnotations) {
      loadAnnotationsSafely(annotationManagerRef.current, annotations);
    }
  }, [annotationManagerRef.current, annotations, showAnnotations, loadedAnnotationIds]);

  console.log('## course', courseSection);
  console.log('## annotations', annotations);
  console.log('## annotationsData', annotationsData);
  console.log('## isLoadingAnnotationsData', isLoadingAnnotationsData);
  console.log('## annotationsError', annotationsError);
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
        const existingAnnotation = annotations.find(ann => 
          ann.annotation.id === event.data.id
        );
        
        if (existingAnnotation) {
          console.log('Annotation already exists, skipping creation:', event.data.id);
          return;
        }
        
        // Convert Adobe annotation to API format and create via API
        const apiAnnotation = pdfAnnotationService.convertAdobeAnnotationToApi(
          event.data,
          courseSection.section_id,
          isSummary ? courseSection.summary_id : undefined
        );
        createAnnotationMutation.mutate(apiAnnotation);
        break;
        
      case 'ANNOTATION_DELETED':
        // Find the annotation in our local state and delete via API
        const annotationToDelete = annotations.find(ann => ann.annotation.id === event.data.id);
        if (annotationToDelete) {
          deleteAnnotationMutation.mutate(annotationToDelete.annotation_id);
        }
        break;
        
      case 'ANNOTATION_UPDATED':
        // Find the annotation in our local state and update via API
        const annotationToUpdate = annotations.find(ann => ann.annotation.id === event.data.id);
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
    
    // Load existing annotations if any
    if (annotations.length > 0 && showAnnotations) {
      loadAnnotationsSafely(manager, annotations);
    }
  };


  const handleAnnotationSelect = (annotationId: string) => {
    setSelectedAnnotationId(annotationId);
    // You can add additional logic here to highlight the annotation in the PDF viewer
    console.log('Annotation selected:', annotationId);
  };

  const handleAnnotationEdit = (annotationId: string, newBodyValue: string) => {
    const annotationToUpdate = annotations.find(ann => ann.annotation_id === annotationId);
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
              {annotations.length > 0 && (
                <Badge variant="outline">
                  {annotations.length} annotations
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">

              {/* Refresh Annotations */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchAnnotations()}
                title="Actualiser les annotations"
                disabled={isLoadingAnnotationsData}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingAnnotationsData ? 'animate-spin' : ''}`} />
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-6 mb-4">
              <TabsTrigger value="viewer" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {isSummary ? 'Résumé' : 'Cours'}
              </TabsTrigger>
              <TabsTrigger value="annotations" className="flex items-center gap-2">
                <Highlighter className="h-4 w-4" />
                Annotations ({annotations.length})
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
                      pdfUrl={pdfUrl}
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

            <TabsContent value="annotations" className="flex-1 overflow-hidden mx-6 mb-6">
              <div className="h-full border rounded-lg">
                {isLoadingAnnotationsData ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Chargement des annotations...</p>
                    </div>
                  </div>
                ) : annotations.length === 0 ? (
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
                  <CustomAnnotationList
                    annotations={annotations}
                    onEditAnnotation={handleAnnotationEdit}
                    onDeleteAnnotation={handleAnnotationDelete}
                    onAnnotationSelect={handleAnnotationSelect}
                    selectedAnnotationId={selectedAnnotationId}
                    onCleanupOrphaned={handleCleanupOrphaned}
                    accessToken={auth.user?.access_token}
                    className="h-full"
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}