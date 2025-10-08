import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAbsoluteUrl } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  BookOpen, 
  Clock, 
  BarChart3,
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
  course, 
  isOpen, 
  onClose, 
  onViewPdf, 
  onStartQuiz 
}: CoursePreviewModalProps) {
  const [activeTab, setActiveTab] = useState("details");

  // Fetch course statistics
  const { data: statistics } = useQuery({
    queryKey: [`/api/courses/${course.id}/statistics`],
    queryFn: async () => {
      const response = await fetch(getAbsoluteUrl(`/api/courses/${course.id}/statistics`), {
        credentials: "include",
      });
      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    },
    enabled: isOpen && !!course.id,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCorrectPercentage = () => {
    if (!statistics || statistics.totalQuestions === 0) return 0;
    return Math.round((statistics.correctAnswers / statistics.totalQuestions) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {course.sectionName || course.courseName || 'Aperçu du cours'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{course.sectionName || course.courseName}</h2>
              <div className="flex items-center gap-2">
                {course.themeName && (
                  <Badge variant="default">{course.themeName}</Badge>
                )}
                {course.university && (
                  <Badge variant="outline">{course.university}</Badge>
                )}
                {course.cls && (
                  <Badge variant="outline">{course.cls}</Badge>
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
                    {course.courseName && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Nom du cours:</span>
                        <span>{course.courseName}</span>
                      </div>
                    )}
                    {course.sectionName && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Section:</span>
                        <span>{course.sectionName}</span>
                      </div>
                    )}
                    {course.themeName && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Thème:</span>
                        <span>{course.themeName}</span>
                      </div>
                    )}
                    {course.version && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Version:</span>
                        <span>{course.version}</span>
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
                    {course.originalTotalPages && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Pages:</span>
                        <span>{course.originalTotalPages}</span>
                      </div>
                    )}
                    {course.size && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="font-medium">Taille:</span>
                        <span>{formatFileSize(course.size)}</span>
                      </div>
                    )}
                    {course.fileDescription && (
                      <div className="space-y-1">
                        <span className="font-medium">Description:</span>
                        <p className="text-sm text-muted-foreground">
                          {course.fileDescription}
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
                          <p className="text-2xl font-bold">{statistics.totalQuestions}</p>
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
                          <p className="text-2xl font-bold">{statistics.correctAnswers}</p>
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
                          <p className="text-2xl font-bold">{statistics.incorrectAnswers}</p>
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
                          <p className="text-2xl font-bold">{getCorrectPercentage()}%</p>
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
