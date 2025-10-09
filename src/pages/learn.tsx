import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { authenticatedApiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { 
  Search, 
  BookOpen, 
  Download, 
  Eye, 
  FileText, 
  Share2, 
  Save, 
  Play, 
  Filter,
  SortAsc,
  SortDesc,
  Clock,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CoursePreviewModal } from "@/components/course-preview-modal";
import { PdfViewer } from "@/components/pdf-viewer";
import { QuizModal } from "@/components/quiz-modal";

export default function Learn() {
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all"); // all, platform, user, shared
  const [sortBy, setSortBy] = useState("name"); // name, theme, courseName, sectionName
  const [sortOrder, setSortOrder] = useState("asc"); // asc, desc
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showSummaryViewer, setShowSummaryViewer] = useState(false);

  // Fetch user preferences
  const { data: userPreferences } = useQuery({
    queryKey: [API_ENDPOINTS.USER_PREFERENCES],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", API_ENDPOINTS.USER_PREFERENCES);
      return await response.json();
    },
    enabled: !!user,
  });

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await authenticatedApiRequest("POST", API_ENDPOINTS.USER_PREFERENCES, { preferences });
      return await response.json();
    },
  });

  // Initialize filters from user profile and saved preferences
  useEffect(() => {
    if (user && userPreferences) {
      // Use saved preferences if available, otherwise use user profile defaults
      const savedUniversity = userPreferences.universityFilter;
      const savedYear = userPreferences.yearFilter;
      const savedSemester = userPreferences.semesterFilter;
      const savedSource = userPreferences.sourceFilter;
      const savedSortBy = userPreferences.sortBy;
      const savedSortOrder = userPreferences.sortOrder;
      
      if (savedUniversity && savedUniversity !== "all") {
        setUniversityFilter(savedUniversity);
      } else if ((user as any).university) {
        setUniversityFilter((user as any).university);
      }
      
      if (savedYear && savedYear !== "all") {
        setYearFilter(savedYear);
      } else if ((user as any).cls) {
        setYearFilter((user as any).cls);
      }

      if (savedSemester) {
        setSemesterFilter(savedSemester);
      }

      if (savedSource) {
        setSourceFilter(savedSource);
      }

      if (savedSortBy) {
        setSortBy(savedSortBy);
      }

      if (savedSortOrder) {
        setSortOrder(savedSortOrder);
      }
    } else if (user && !userPreferences) {
      // If no saved preferences, use user profile defaults
      if ((user as any).university) {
        setUniversityFilter((user as any).university);
      }
      if ((user as any).cls) {
        setYearFilter((user as any).cls);
      }
    }
  }, [user, userPreferences]);

  // Save preferences when filters change
  const savePreferences = (newPreferences: any) => {
    if (user) {
      savePreferencesMutation.mutate(newPreferences);
    }
  };

  const handleUniversityChange = (value: string) => {
    setUniversityFilter(value);
    savePreferences({
      ...userPreferences,
      universityFilter: value,
    });
  };

  const handleYearChange = (value: string) => {
    setYearFilter(value);
    savePreferences({
      ...userPreferences,
      yearFilter: value,
    });
  };

  const handleSemesterChange = (value: string) => {
    setSemesterFilter(value);
    savePreferences({
      ...userPreferences,
      semesterFilter: value,
    });
  };

  const handleSourceChange = (value: string) => {
    setSourceFilter(value);
    savePreferences({
      ...userPreferences,
      sourceFilter: value,
    });
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    savePreferences({
      ...userPreferences,
      sortBy: value,
    });
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
    savePreferences({
      ...userPreferences,
      sortOrder: value,
    });
  };

  const { data: courses, isLoading } = useQuery({
    queryKey: [
      API_ENDPOINTS.COURSES,
      { 
        type: "University",
        university: universityFilter !== "all" ? universityFilter : undefined,
        year: yearFilter !== "all" ? yearFilter : undefined,
        semester: semesterFilter !== "all" ? semesterFilter : undefined,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }
    ],
    queryFn: async ({ queryKey }) => {
      const [url, filters] = queryKey;
      const params = new URLSearchParams();
      
      if (filters && typeof filters === 'object') {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, value as string);
          }
        });
      }
      
      const response = await fetch(`${url}?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    },
  });

  const filteredCourses = courses?.filter((course: any) => 
    course.sectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.themeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.fileDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const universityCourses = filteredCourses.filter((course: any) => course.type === "University");

  return (
    <div className="py-6" data-testid="courses-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Cours</h1>
          <p className="text-lg text-muted-foreground">
            Accédez aux cours organisés par cycles universitaires
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres et tri
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setUniversityFilter("all");
                  setYearFilter("all");
                  setSemesterFilter("all");
                  setSourceFilter("all");
                  setSortBy("name");
                  setSortOrder("asc");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Réinitialiser
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un cours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              
              {/* Filter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Université</label>
                  <Select value={universityFilter} onValueChange={handleUniversityChange} data-testid="university-filter">
                    <SelectTrigger className={universityFilter !== "all" ? "border-primary" : ""}>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les universités</SelectItem>
                      <SelectItem value="FMT">F.M. Tunis</SelectItem>
                      <SelectItem value="FMS">F.M. Sousse</SelectItem>
                      <SelectItem value="FMM">F.M. Monastir</SelectItem>
                      <SelectItem value="FMSfax">F.M. Sfax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Niveau</label>
                  <Select value={yearFilter} onValueChange={handleYearChange} data-testid="year-filter">
                    <SelectTrigger className={yearFilter !== "all" ? "border-primary" : ""}>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les niveaux</SelectItem>
                      <SelectItem value="PCEM1">PCEM1</SelectItem>
                      <SelectItem value="PCEM2">PCEM2</SelectItem>
                      <SelectItem value="DCEM1">DCEM1</SelectItem>
                      <SelectItem value="DCEM2">DCEM2</SelectItem>
                      <SelectItem value="DCEM3">DCEM3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Semestre</label>
                  <Select value={semesterFilter} onValueChange={handleSemesterChange} data-testid="semester-filter">
                    <SelectTrigger className={semesterFilter !== "all" ? "border-primary" : ""}>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les semestres</SelectItem>
                      <SelectItem value="s1">Semestre 1</SelectItem>
                      <SelectItem value="s2">Semestre 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Source</label>
                  <Select value={sourceFilter} onValueChange={handleSourceChange}>
                    <SelectTrigger className={sourceFilter !== "all" ? "border-primary" : ""}>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les sources</SelectItem>
                      <SelectItem value="platform">Plateforme</SelectItem>
                      <SelectItem value="user">Mes fichiers</SelectItem>
                      <SelectItem value="shared">Partagés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Trier par</label>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={handleSortByChange}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Critère" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nom</SelectItem>
                        <SelectItem value="theme">Thème</SelectItem>
                        <SelectItem value="courseName">Nom du cours</SelectItem>
                        <SelectItem value="sectionName">Section</SelectItem>
                        <SelectItem value="createdAt">Date de création</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
                      className="px-3"
                      title={sortOrder === "asc" ? "Trier par ordre décroissant" : "Trier par ordre croissant"}
                    >
                      {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(universityFilter !== "all" || yearFilter !== "all" || semesterFilter !== "all" || sourceFilter !== "all") && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Filtres actifs:</span>
                  {universityFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Université: {universityFilter}
                    </Badge>
                  )}
                  {yearFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Niveau: {yearFilter}
                    </Badge>
                  )}
                  {semesterFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Semestre: {semesterFilter === "s1" ? "Semestre 1" : "Semestre 2"}
                    </Badge>
                  )}
                  {sourceFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Source: {sourceFilter === "platform" ? "Plateforme" : sourceFilter === "user" ? "Mes fichiers" : "Partagés"}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Course Tabs */}
        <Tabs defaultValue="university">
          

          <TabsContent value="university" className="space-y-4">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Organisation par cycles universitaires</h3>
                  <p className="text-sm text-muted-foreground">
                    Cours organisés par cycles PCEM1, PCEM2, DCEM1-3
                  </p>
                </div>
                {!isLoading && (
                  <div className="text-sm text-muted-foreground">
                    {universityCourses.length} cours trouvé{universityCourses.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            <GroupedCourseGrid 
              courses={universityCourses} 
              isLoading={isLoading}
              onPreview={(course) => {
                setSelectedCourse(course);
                setShowPreview(true);
              }}
              onViewPdf={(course) => {
                setSelectedCourse(course);
                setShowPdfViewer(true);
              }}
              onStartQuiz={(course) => {
                setSelectedCourse(course);
                setShowQuiz(true);
              }}
              onViewSummary={(course) => {
                setSelectedCourse(course);
                setShowSummaryViewer(true);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {showPreview && selectedCourse && (
          <CoursePreviewModal
            course={selectedCourse}
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            onViewPdf={() => {
              setShowPreview(false);
              setShowPdfViewer(true);
            }}
            onStartQuiz={() => {
              setShowPreview(false);
              setShowQuiz(true);
            }}
          />
        )}

        {showPdfViewer && selectedCourse && (
          <PdfViewer
            course={selectedCourse}
            isOpen={showPdfViewer}
            onClose={() => setShowPdfViewer(false)}
          />
        )}

        {showQuiz && selectedCourse && (
          <QuizModal
            course={selectedCourse}
            isOpen={showQuiz}
            onClose={() => setShowQuiz(false)}
          />
        )}

        {showSummaryViewer && selectedCourse && (
          <PdfViewer
            course={selectedCourse}
            isOpen={showSummaryViewer}
            onClose={() => setShowSummaryViewer(false)}
            isSummary={true}
          />
        )}
      </div>
    </div>
  );
}

// CourseGrid function removed as it was unused
/*
function CourseGrid({ 
  courses, 
  isLoading, 
  onPreview, 
  onViewPdf, 
  onStartQuiz 
}: { 
  courses: any[]; 
  isLoading: boolean;
  onPreview: (course: any) => void;
  onViewPdf: (course: any) => void;
  onStartQuiz: (course: any) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-4/5"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun cours trouvé</h3>
          <p className="text-muted-foreground">
            Essayez de modifier vos filtres ou ajoutez de nouveaux cours
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="hover:shadow-lg transition-shadow flex flex-col h-full" data-testid={`course-${course.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg line-clamp-2">{course.sectionName || course.courseName || 'Sans titre'}</CardTitle>
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  {course.themeName && (
                    <Badge variant='default' className="text-xs">
                      {course.themeName}
                    </Badge>
                  )}
                  {course.university && (
                    <Badge variant="outline" className="text-xs">{course.university}</Badge>
                  )}
                  {course.cls && (
                    <Badge variant="outline" className="text-xs">{course.cls}</Badge>
                  )}
                  {course.semester && (
                    <Badge variant="secondary" className="text-xs">{course.semester.toUpperCase()}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-0">
            <div className="space-y-3 flex-1">
              <div className="text-sm text-muted-foreground space-y-1">
                {course.courseName && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{course.courseName}</span>
                  </div>
                )}
                {course.sectionName && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{course.sectionName}</span>
                  </div>
                )}
                {course.originalTotalPages && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{course.originalTotalPages} pages</span>
                  </div>
                )}
                {course.size && (
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 flex-shrink-0" />
                    <span>{(course.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onPreview(course)}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Aperçu</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onViewPdf(course)}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Ouvrir</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onStartQuiz(course)}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Quiz</span>
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-auto">
                    <Download className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Télécharger</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-auto">
                    <Save className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Sauvegarder</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-auto">
                    <Share2 className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Partager</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
*/

function GroupedCourseGrid({ 
  courses, 
  isLoading, 
  onPreview, 
  onViewPdf, 
  onStartQuiz,
  onViewSummary
}: { 
  courses: any[]; 
  isLoading: boolean;
  onPreview: (course: any) => void;
  onViewPdf: (course: any) => void;
  onStartQuiz: (course: any) => void;
  onViewSummary: (course: any) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-4/5"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun cours trouvé</h3>
          <p className="text-muted-foreground">
            Essayez de modifier vos filtres ou ajoutez de nouveaux cours
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group courses by theme, then by course name
  // Handle full documents as themes and single-section courses properly
  const groupedCourses = courses.reduce((acc: Record<string, Record<string, any[]>>, course: any) => {
    // If it's a full document, treat it as a theme
    if (course.isFullDocument) {
      const themeName = course.themeName || course.courseName || 'Document complet';
      if (!acc[themeName]) {
        acc[themeName] = {};
      }
      if (!acc[themeName]['Document complet']) {
        acc[themeName]['Document complet'] = [];
      }
      acc[themeName]['Document complet'].push(course);
    } else {
      const themeName = course.themeName || 'Sans thème';
      
      // Check if this course has only one section
      const courseSections = courses.filter((c: any) => 
        !c.isFullDocument && 
        c.courseName === course.courseName && 
        c.themeName === course.themeName
      );
      
      if (courseSections.length === 1) {
        // Single section course - group by theme with other single-section courses
        if (!acc[themeName]) {
          acc[themeName] = {};
        }
        if (!acc[themeName]['Cours individuels']) {
          acc[themeName]['Cours individuels'] = [];
        }
        acc[themeName]['Cours individuels'].push(course);
      } else {
        // Multi-section course - group by course name
        const courseName = course.courseName || 'Sans nom de cours';
        
        if (!acc[themeName]) {
          acc[themeName] = {};
        }
        
        if (!acc[themeName][courseName]) {
          acc[themeName][courseName] = [];
        }
        
        acc[themeName][courseName].push(course);
      }
    }
    
    return acc;
  }, {} as Record<string, Record<string, any[]>>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedCourses).map(([themeName, coursesByCourseName]: [string, Record<string, any[]>]) => {
        const courseCount = Object.keys(coursesByCourseName).length;
        const totalSections = Object.values(coursesByCourseName).reduce((sum: number, sections: any[]) => sum + sections.length, 0);
        
        return (
          <Card key={themeName} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{themeName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {courseCount} cours • {totalSections} sections
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Accordion type="multiple" className="w-full">
                {Object.entries(coursesByCourseName).map(([courseName, sections]: [string, any[]]) => (
                  <AccordionItem key={courseName} value={courseName}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center justify-between w-full mr-4">
                        <span className="font-medium">{courseName}</span>
                        <Badge variant="secondary" className="ml-2">
                          {sections.length} section{sections.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4">
                        {sections.map((section: any) => (
                          <CourseCard
                            key={section.id}
                            course={section}
                            onPreview={onPreview}
                            onViewPdf={onViewPdf}
                            onStartQuiz={onStartQuiz}
                            onViewSummary={onViewSummary}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CourseCard({ 
  course, 
  onPreview, 
  onViewPdf, 
  onStartQuiz,
  onViewSummary
}: { 
  course: any;
  onPreview: (course: any) => void;
  onViewPdf: (course: any) => void;
  onStartQuiz: (course: any) => void;
  onViewSummary: (course: any) => void;
}) {
  // Determine the title to display
  const getCardTitle = () => {
    if (course.sectionName && course.courseName && course.sectionName !== course.courseName) {
      return course.sectionName; // Show section name when different from course name
    }
    return course.sectionName || course.courseName || 'Sans titre';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col h-full" data-testid={`course-${course.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg line-clamp-2">{getCardTitle()}</CardTitle>
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {course.university && (
                <Badge variant="outline" className="text-xs">
                  {course.university === 'FMT' ? 'F.M. Tunis' :
                   course.university === 'FMS' ? 'F.M. Sousse' :
                   course.university === 'FMM' ? 'F.M. Monastir' :
                   course.university === 'FMSfax' ? 'F.M. Sfax' :
                   course.university}
                </Badge>
              )}
              {course.cls && (
                <Badge variant="outline" className="text-xs">{course.cls}</Badge>
              )}
              {course.semester && (
                <Badge variant="secondary" className="text-xs">
                  {course.semester === 's1' ? 'S1' : 'S2'}
                </Badge>
              )}
              {course.type && (
                <Badge variant="default" className="text-xs">
                  {course.type === 'University' ? 'Université' : course.type}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        <div className="space-y-3 flex-1">
          <div className="text-sm text-muted-foreground space-y-1">
            {course.courseName && course.sectionName && course.courseName !== course.sectionName && (
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{course.courseName}</span>
              </div>
            )}
            {course.sectionName && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{course.sectionName}</span>
              </div>
            )}
            {course.originalTotalPages && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                  {course.originalTotalPages} pages
                  {course.sectionStart && course.sectionEnd && (
                    <span className="text-muted-foreground">
                      {' '}({course.sectionEnd - course.sectionStart + 1} pages de section)
                    </span>
                  )}
                </span>
              </div>
            )}
            {course.size && (
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span>{(course.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onPreview(course)}
                className="text-xs px-2 py-1 h-auto"
              >
                <Eye className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Aperçu</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onViewPdf(course)}
                className="text-xs px-2 py-1 h-auto"
              >
                <FileText className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Ouvrir</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStartQuiz(course)}
                className="text-xs px-2 py-1 h-auto"
              >
                <Play className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Quiz</span>
              </Button>
              {course.summaryFilePath && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onViewSummary(course)}
                  className="text-xs px-2 py-1 h-auto"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Résumé</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1">
              <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-auto" title="Télécharger">
                <Download className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-auto" title="Sauvegarder">
                <Save className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-auto" title="Partager">
                <Share2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
