import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth as useOIDCAuth } from "react-oidc-context";
import { getQueryFn } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
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
  const [showPdfViewer, setShowPdfViewer] = useState(true);

  // Get page parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  const initialPage = pageParam ? parseInt(pageParam, 10) : null;

  // const courseId = params?.course_id;
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
        {/* PDF Viewer Full Page */}
        {showPdfViewer && courseSection && (
          <SharedPdfViewer
            courseSection={courseSection}
            isOpen={showPdfViewer}
            onClose={() => setShowPdfViewer(false)}
            isModal={false}
            initialPage={initialPage}
          />
        )}
      </div>
    </div>
  );
}
