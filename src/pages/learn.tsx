import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { authenticatedApiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { useAuthQuery, useAuth } from "@/hooks/useAuth";
import { useAuth as useOIDCAuth } from "react-oidc-context";
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
  BarChart3,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from "lucide-react";
import { CoursePreviewModal } from "@/components/course-preview-modal";
import { PdfViewer } from "@/components/pdf-viewer";
import { QuizModal } from "@/components/quiz-modal";

export default function Learn() {
  const { user } = useAuth();
  const oidcAuth = useOIDCAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all"); // all, platform, user, shared
  const [sortBy, setSortBy] = useState("course_name"); // name, theme, courseName, sectionName
  const [sortOrder, setSortOrder] = useState("asc"); // asc, desc
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showSummaryViewer, setShowSummaryViewer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch user preferences
  const { data: userPreferences } = useAuthQuery([API_ENDPOINTS.USER_PREFERENCES], {
    enabled: !!user,
  });

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await authenticatedApiRequest("POST", API_ENDPOINTS.USER_PREFERENCES, { preferences }, oidcAuth.user?.access_token);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the user preferences query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.USER_PREFERENCES] });
    },
  });

  // Initialize filters from user profile and saved preferences (only once)
  useEffect(() => {
    if (user && (userPreferences as any)?.preferences) {
      // Extract preferences from the flat structure: userPreferences.preferences
      const actualPreferences = (userPreferences as any)?.preferences || {};

      // Use saved preferences if available, otherwise use user profile defaults
      const savedUniversity = actualPreferences.universityFilter;
      const savedLevel = actualPreferences.levelFilter;
      const savedSemester = actualPreferences.semesterFilter;
      const savedSource = actualPreferences.sourceFilter;
      const savedSortBy = actualPreferences.sortBy;
      const savedSortOrder = actualPreferences.sortOrder;

      if (savedUniversity) {
        setUniversityFilter(savedUniversity);
      }

      if (savedLevel) {
        setLevelFilter(savedLevel);
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
        setLevelFilter((user as any).cls);
      }
    }
  }, [user, userPreferences]);

  // Save preferences when filters change
  const savePreferences = (newPreferences: any) => {
    if (user) {
      // First invalidate and refetch courses with new filters
      queryClient.invalidateQueries({
        queryKey: [
          API_ENDPOINTS.COURSES,
          {
            type: "University",
            university: newPreferences.universityFilter !== "all" ? newPreferences.universityFilter : undefined,
            level: newPreferences.levelFilter !== "all" ? newPreferences.levelFilter : undefined,
            semester: newPreferences.semesterFilter !== "all" ? newPreferences.semesterFilter : undefined,
            source: newPreferences.sourceFilter !== "all" ? newPreferences.sourceFilter : undefined,
            sort_by: newPreferences.sortBy,
            sort_order: newPreferences.sortOrder,
            search: searchTerm || undefined,
          }
        ]
      });

      // Then save the preferences
      savePreferencesMutation.mutate(newPreferences);
    }
  };

  const handleUniversityChange = (value: string) => {
    setUniversityFilter(value);
    savePreferences({
      universityFilter: value,
      levelFilter,
      semesterFilter,
      sourceFilter,
      sortBy,
      sortOrder,
    });
  };

  const handleLevelChange = (value: string) => {
    setLevelFilter(value);
    savePreferences({
      universityFilter,
      levelFilter: value,
      semesterFilter,
      sourceFilter,
      sortBy,
      sortOrder,
    });
  };

  const handleSemesterChange = (value: string) => {
    setSemesterFilter(value);
    savePreferences({
      universityFilter,
      levelFilter,
      semesterFilter: value,
      sourceFilter,
      sortBy,
      sortOrder,
    });
  };

  const handleSourceChange = (value: string) => {
    setSourceFilter(value);
    savePreferences({
      universityFilter,
      levelFilter,
      semesterFilter,
      sourceFilter: value,
      sortBy,
      sortOrder,
    });
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    savePreferences({
      universityFilter,
      levelFilter,
      semesterFilter,
      sourceFilter,
      sortBy: value,
      sortOrder,
    });
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
    savePreferences({
      universityFilter,
      levelFilter,
      semesterFilter,
      sourceFilter,
      sortBy,
      sortOrder: value,
    });
  };

  const { data: coursesData, isLoading } = useQuery({
    queryKey: [
      API_ENDPOINTS.COURSES,
      {
        type: "University",
        university: universityFilter !== "all" ? universityFilter : undefined,
        level: levelFilter !== "all" ? levelFilter : undefined,
        semester: semesterFilter !== "all" ? semesterFilter : undefined,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        include_sections: true,
        page: 1,
        per_page: 100,
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

      const response = await authenticatedApiRequest(
        "GET",
        `${url}?${params.toString()}`,
        undefined,
        oidcAuth.user?.access_token
      );
      return await response.json();
    },
  });

  // Search query for when search term is provided
  const { data: searchData, isLoading: isSearching } = useQuery({
    queryKey: [
      API_ENDPOINTS.COURSES_SEARCH,
      {
        keyword: searchTerm,
        type: "University",
        university: universityFilter !== "all" ? universityFilter : undefined,
        level: levelFilter !== "all" ? levelFilter : undefined,
        semester: semesterFilter !== "all" ? semesterFilter : undefined,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        include_sections: true,
        page: 1,
        per_page: 100,
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

      const response = await authenticatedApiRequest(
        "GET",
        `${url}?${params.toString()}`,
        undefined,
        oidcAuth.user?.access_token
      );
      return await response.json();
    },
    enabled: !!searchTerm && searchTerm.length > 0,
  });

  // Use search results if search term exists, otherwise use regular courses
  const courses = searchTerm && searchTerm.length > 0
    ? (searchData?.courses || [])
    : (coursesData?.courses || []);

  const filteredCourses = courses;

  const universityCourses = filteredCourses.filter((course: any) => course.type === "University");

  return (
    <div className="py-6" data-testid="courses-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Cours</h1>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-muted/30 border-muted-foreground/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4" />
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un cours..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm bg-background/50 border-muted-foreground/30 focus:border-muted-foreground/50"
                    data-testid="search-input"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setUniversityFilter("all");
                          setLevelFilter("all");
                          setSemesterFilter("all");
                          setSourceFilter("all");
                          setSortBy("course_name");
                          setSortOrder("asc");

                          // Save the reset preferences
                          savePreferences({
                            universityFilter: "all",
                            levelFilter: "all",
                            semesterFilter: "all",
                            sourceFilter: "all",
                            sortBy: "course_name",
                            sortOrder: "asc",
                          });
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Réinitialiser</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{showFilters ? "Masquer" : "Afficher"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardTitle>
          </CardHeader>
          {showFilters && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Filter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Université</label>
                    <Select value={universityFilter} onValueChange={handleUniversityChange} data-testid="university-filter">
                      <SelectTrigger className={`h-8 text-sm bg-background/50 border-muted-foreground/30 focus:border-muted-foreground/50 ${universityFilter !== "all" ? "border-muted-foreground/60 bg-muted/50" : ""}`}>
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Niveau</label>
                    <Select value={levelFilter} onValueChange={handleLevelChange} data-testid="level-filter">
                      <SelectTrigger className={`h-8 text-sm bg-background/50 border-muted-foreground/30 focus:border-muted-foreground/50 ${levelFilter !== "all" ? "border-muted-foreground/60 bg-muted/50" : ""}`}>
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Semestre</label>
                    <Select value={semesterFilter} onValueChange={handleSemesterChange} data-testid="semester-filter">
                      <SelectTrigger className={`h-8 text-sm bg-background/50 border-muted-foreground/30 focus:border-muted-foreground/50 ${semesterFilter !== "all" ? "border-muted-foreground/60 bg-muted/50" : ""}`}>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les semestres</SelectItem>
                        <SelectItem value="1">Semestre 1</SelectItem>
                        <SelectItem value="2">Semestre 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</label>
                    <Select value={sourceFilter} onValueChange={handleSourceChange}>
                      <SelectTrigger className={`h-8 text-sm bg-background/50 border-muted-foreground/30 focus:border-muted-foreground/50 ${sourceFilter !== "all" ? "border-muted-foreground/60 bg-muted/50" : ""}`}>
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trier par</label>
                    <div className="flex gap-1.5">
                      <Select value={sortBy} onValueChange={handleSortByChange}>
                        <SelectTrigger className="flex-1 h-8 text-sm bg-background/50 border-muted-foreground/30 focus:border-muted-foreground/50">
                          <SelectValue placeholder="Critère" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="course_name">Nom du cours</SelectItem>
                          <SelectItem value="theme_name">Thème</SelectItem>
                          <SelectItem value="university">Université</SelectItem>
                          <SelectItem value="cls">Niveau</SelectItem>
                          <SelectItem value="created_at">Date de création</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
                        className="h-8 w-8 p-0 border-muted-foreground/30 hover:bg-muted/50 hover:border-muted-foreground/50"
                        title={sortOrder === "asc" ? "Trier par ordre décroissant" : "Trier par ordre croissant"}
                      >
                        {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Active Filters Summary */}
                {(universityFilter !== "all" || levelFilter !== "all" || semesterFilter !== "all" || sourceFilter !== "all") && (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-muted-foreground/20">
                    <span className="text-xs text-muted-foreground font-medium">Filtres actifs:</span>
                    {universityFilter !== "all" && (
                      <Badge variant="outline" className="text-xs h-5 px-2 bg-muted/50 border-muted-foreground/30">
                        {universityFilter}
                      </Badge>
                    )}
                    {levelFilter !== "all" && (
                      <Badge variant="outline" className="text-xs h-5 px-2 bg-muted/50 border-muted-foreground/30">
                        {levelFilter}
                      </Badge>
                    )}
                    {semesterFilter !== "all" && (
                      <Badge variant="outline" className="text-xs h-5 px-2 bg-muted/50 border-muted-foreground/30">
                        S{semesterFilter}
                      </Badge>
                    )}
                    {sourceFilter !== "all" && (
                      <Badge variant="outline" className="text-xs h-5 px-2 bg-muted/50 border-muted-foreground/30">
                        {sourceFilter === "platform" ? "Plateforme" : sourceFilter === "user" ? "Mes fichiers" : "Partagés"}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Course Tabs */}
        <Tabs defaultValue="university">


          <TabsContent value="university" className="space-y-4">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                {!isLoading && !isSearching && (
                  <div className="text-sm text-muted-foreground">
                    {universityCourses.length} cours trouvé{universityCourses.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            <GroupedCourseGrid
              courses={universityCourses}
              isLoading={isLoading || isSearching}
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
            courseSection={selectedCourse}
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
            courseSection={selectedCourse}
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

  // Group courses by theme, then by course name, handling sections
  const groupedCourses = courses.reduce((acc: Record<string, Record<string, any[]>>, course: any) => {
    const themeName = course.theme_name || course.theme || 'Sans thème';
    const courseName = course.course_name || 'Sans nom de cours';

    if (!acc[themeName]) {
      acc[themeName] = {};
    }

    if (!acc[themeName][courseName]) {
      acc[themeName][courseName] = [];
    }

    // If course has sections, add each section as a separate item
    if (course.sections && course.sections.length > 0) {
      course.sections.forEach((section: any) => {
        acc[themeName][courseName].push({
          ...section,
          course_name: course.course_name,
          theme_name: course.theme_name,
          university: course.university,
          cls: course.cls,
          semester: course.semester,
          type: course.type,
          id: section.section_id, // Use section_id as the main id
          section_id: section.section_id,
          title: section.section_name,
        });
      });
    } else {
      // If no sections, add the course itself
      acc[themeName][courseName].push({
        ...course,
        id: course.course_id,
        title: course.course_name,
      });
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
                    {courseCount} thèmes • {totalSections} cours
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
    return course.section_name || course.course_name || 'Sans titre';
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow flex flex-col h-full cursor-pointer"
      data-testid={`course-${course.id}`}
      onClick={() => onPreview(course)}
    >
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
                  {course.semester === '1' ? 'S1' : 'S2'}
                </Badge>
              )}
              {course.theme && (
                <Badge variant="default" className="text-xs">{course.theme}</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        <div className="space-y-3 flex-1">
          <div className="text-sm text-muted-foreground space-y-1">
            {course.description && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{course.description}</span>
              </div>
            )}
            {course.year && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Année {course.year}</span>
              </div>
            )}
            {course.version && (
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span>Version {course.version}</span>
              </div>
            )}
            {course.split_page_count && (
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span>{course.split_page_count} pages</span>
              </div>
            )}
            {course.questions_count !== null && (
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 flex-shrink-0" />
                <span>{course.questions_count} questions</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewPdf(course);
                }}
                className="text-xs px-2 py-1 h-auto"
              >
                <FileText className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Cours</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartQuiz(course);
                }}
                className="text-xs px-2 py-1 h-auto"
              >
                <Play className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Quiz</span>
              </Button>
            </div>
            {(course.summary_file_path || course.pdf_path) && (
              <div className="grid grid-cols-1 gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewSummary(course);
                  }}
                  className="text-xs px-2 py-1 h-auto"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Résumé</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
