import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth as useOIDCAuth } from "react-oidc-context";
import { getQueryFn } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, BookOpen, Clock, BarChart3 } from "lucide-react";
import { SharedPdfViewer } from "@/components/shared-pdf-viewer";

interface CourseSection {
  course_id: string;
  section_id: string;
  section_name: string;
  description?: string;
  split_page_count?: number;
  summary_id?: string;
  summary_file_path?: string;
  course_name?: string;
  theme_name?: string;
  university?: string;
  cls?: string;
  semester?: string;
  year?: string;
  version?: string;
  questions_count?: number;
  [key: string]: any;
}

export default function CourseSection() {
  const [, params] = useRoute("/courses/:course_id/:course_section_id");
  const auth = useOIDCAuth();
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showSummaryViewer, setShowSummaryViewer] = useState(false);

  const courseId = params?.course_id;
  const sectionId = params?.course_section_id;

  // Fetch course section details
  const { data: courseSectionData, isLoading, error } = useQuery({
    queryKey: [API_ENDPOINTS.COURSE_SECTION_DETAILS(sectionId!)],
    queryFn: getQueryFn<CourseSection>({ 
      on401: "throw",
      token: auth.user?.access_token 
    }),
    enabled: !!sectionId && auth.isAuthenticated,
    retry: false,
  });

  const courseSection = courseSectionData;

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement du cours...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !courseSection) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Cours non trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Le cours demandé n'existe pas ou n'est pas accessible.
              </p>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {courseSection.section_name}
              </h1>
              {courseSection.course_name && (
                <p className="text-lg text-muted-foreground mb-4">
                  {courseSection.course_name}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {courseSection.theme_name && (
                  <Badge variant="default">
                    {courseSection.theme_name}
                  </Badge>
                )}
                {courseSection.university && (
                  <Badge variant="outline">
                    {courseSection.university === 'FMT' ? 'F.M. Tunis' :
                      courseSection.university === 'FMS' ? 'F.M. Sousse' :
                        courseSection.university === 'FMM' ? 'F.M. Monastir' :
                          courseSection.university === 'FMSfax' ? 'F.M. Sfax' :
                            courseSection.university}
                  </Badge>
                )}
                {courseSection.cls && (
                  <Badge variant="outline">{courseSection.cls}</Badge>
                )}
                {courseSection.semester && (
                  <Badge variant="secondary">
                    {courseSection.semester === '1' ? 'S1' : 'S2'}
                  </Badge>
                )}
                {courseSection.year && (
                  <Badge variant="secondary">Année {courseSection.year}</Badge>
                )}
                {courseSection.version && (
                  <Badge variant="secondary">Version {courseSection.version}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Détails du cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseSection.description && (
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-muted-foreground">{courseSection.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {courseSection.split_page_count && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{courseSection.split_page_count} pages</span>
                      </div>
                    )}
                    {courseSection.questions_count !== null && courseSection.questions_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{courseSection.questions_count} questions</span>
                      </div>
                    )}
                    {courseSection.year && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Année {courseSection.year}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setShowPdfViewer(true)}
                  className="w-full"
                  size="lg"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ouvrir le cours
                </Button>
                
                {courseSection.summary_file_path && (
                  <Button
                    onClick={() => setShowSummaryViewer(true)}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Voir le résumé
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* PDF Viewer Full Page */}
        {showPdfViewer && courseSection && (
          <SharedPdfViewer
            courseSection={courseSection}
            isOpen={showPdfViewer}
            onClose={() => setShowPdfViewer(false)}
            isModal={false}
          />
        )}

        {/* Summary Viewer Full Page */}
        {showSummaryViewer && courseSection && (
          <SharedPdfViewer
            courseSection={courseSection}
            isOpen={showSummaryViewer}
            onClose={() => setShowSummaryViewer(false)}
            isSummary={true}
            isModal={false}
          />
        )}
      </div>
    </div>
  );
}
