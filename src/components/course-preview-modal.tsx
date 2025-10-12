import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS, type CourseSectionStatisticsResponse } from "@/lib/apiConfig";
import { useAuth as useOIDCAuth } from "react-oidc-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  BookOpen,
  Clock,
  BarChart3,
  X,
  Play,
  Download,
  Share2,
  Save,
  Eye,
  CheckCircle,
  XCircle,
  Percent
} from "lucide-react";

interface CoursePreviewModalProps {
  course: any;
  isOpen: boolean;
  onClose: () => void;
  onViewPdf: () => void;
  onStartQuiz: () => void;
}

export function CoursePreviewModal({
  course: courseSection,
  isOpen,
  onClose,
  onViewPdf,
  onStartQuiz
}: CoursePreviewModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const oidcAuth = useOIDCAuth();

  // Fetch course section statistics
  const { data: statistics } = useQuery<CourseSectionStatisticsResponse>({
    queryKey: [API_ENDPOINTS.COURSE_SECTION_STATISTICS(courseSection.section_id || courseSection.id)],
    queryFn: async () => {
      const response = await authenticatedApiRequest(
        "GET",
        API_ENDPOINTS.COURSE_SECTION_STATISTICS(courseSection.section_id || courseSection.id),
        undefined,
        oidcAuth.user?.access_token
      );
      return await response.json();
    },
    enabled: isOpen && !!(courseSection.section_id || courseSection.id),
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCorrectPercentage = () => {
    if (!statistics || statistics.total_questions === 0) return 0;
    return statistics.accuracy_percentage;
  };

  // console.log("#statistics", statistics);
  // console.log("#course", courseSection);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {courseSection.section_name || courseSection.course_name || 'Aperçu du cours'}
              </DialogTitle>
              <DialogDescription>
                Aperçu détaillé du cours avec statistiques et informations sur les sections
              </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Close Button */}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{courseSection.section_name || courseSection.course_name}</h2>
              <div className="flex items-center gap-2">
                {courseSection.theme_name && (
                  <Badge variant="default">{courseSection.theme_name}</Badge>
                )}
                {courseSection.university && (
                  <Badge variant="outline">{courseSection.university}</Badge>
                )}
                {courseSection.cls && (
                  <Badge variant="outline">{courseSection.cls}</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onViewPdf}>
                <Eye className="w-4 h-4 mr-2" />
                Ouvrir PDF
              </Button>
              <Button onClick={onStartQuiz}>
                <Play className="w-4 h-4 mr-2" />
                Commencer Quiz
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="statistics">Statistiques</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Course Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Informations du cours
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {courseSection.course_name && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Nom du cours:</span>
                        <span>{courseSection.course_name}</span>
                      </div>
                    )}
                    {courseSection.section_name && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Section:</span>
                        <span>{courseSection.section_name}</span>
                      </div>
                    )}
                    {courseSection.theme_name && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Thème:</span>
                        <span>{courseSection.theme_name}</span>
                      </div>
                    )}
                    {courseSection.year && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Version:</span>
                        <span>{courseSection.year}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* File Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informations du fichier
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {courseSection.original_total_pages && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Pages:</span>
                        <span>{courseSection.original_total_pages}</span>
                      </div>
                    )}
                    {courseSection.size && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="font-medium">Taille:</span>
                        <span>{formatFileSize(courseSection.size)}</span>
                      </div>
                    )}
                    {courseSection.file_description && (
                      <div className="space-y-1">
                        <span className="font-medium">Description:</span>
                        <p className="text-sm text-muted-foreground">
                          {courseSection.file_description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" onClick={onViewPdf} className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Ouvrir PDF
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Sauvegarder
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Partager
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              {statistics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Questions totales</p>
                          <p className="text-2xl font-bold">{statistics.total_questions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Réponses correctes</p>
                          <p className="text-2xl font-bold">{statistics.correct_answers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-sm font-medium">Réponses incorrectes</p>
                          <p className="text-2xl font-bold">{statistics.answered_questions - statistics.correct_answers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium">Pourcentage</p>
                          <p className="text-2xl font-bold">{getCorrectPercentage().toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium">Temps d'étude</p>
                          <p className="text-2xl font-bold">{Math.floor(statistics.study_time / 60)}h {statistics.study_time % 60}m</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Aucune statistique disponible pour ce cours.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
