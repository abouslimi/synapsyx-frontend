import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Download, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/apiConfig";
import { authenticatedFetch } from "@/lib/authHelpers";

export default function Courses() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState(
    location.includes("ecn") ? "ECN" : location.includes("university") ? "University" : "all"
  );

  const { data: courses, isLoading } = useQuery({
    queryKey: [
      API_ENDPOINTS.COURSES,
      { 
        type: typeFilter !== "all" ? typeFilter : undefined,
        university: universityFilter !== "all" ? universityFilter : undefined,
        level: levelFilter !== "all" ? levelFilter : undefined,
      }
    ],
    queryFn: async ({ queryKey }) => {
      const [url, filters] = queryKey;
      const params = new URLSearchParams();
      
      if (filters && typeof filters === 'object') {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value as string);
        });
      }
      
      const response = await authenticatedFetch(`${url}?${params.toString()}`);
      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    },
  });

  const filteredCourses = courses?.filter((course: any) => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const ecnCourses = filteredCourses.filter((course: any) => course.type === "ECN");
  const universityCourses = filteredCourses.filter((course: any) => course.type === "University");

  return (
    <div className="py-6" data-testid="courses-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Cours</h1>
          <p className="text-lg text-muted-foreground">
            Accédez aux cours organisés par ECN et par cycles universitaires
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              
              <Select value={typeFilter} onValueChange={setTypeFilter} data-testid="type-filter">
                <SelectTrigger>
                  <SelectValue placeholder="Type de cours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="ECN">ECN</SelectItem>
                  <SelectItem value="University">Universitaire</SelectItem>
                </SelectContent>
              </Select>

              <Select value={universityFilter} onValueChange={setUniversityFilter} data-testid="university-filter">
                <SelectTrigger>
                  <SelectValue placeholder="Université" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les universités</SelectItem>
                  <SelectItem value="FMT">FMT - Tunis</SelectItem>
                  <SelectItem value="FMS">FMS - Sousse</SelectItem>
                  <SelectItem value="FMM">FMM - Monastir</SelectItem>
                  <SelectItem value="FMSfax">FMSfax - Sfax</SelectItem>
                </SelectContent>
              </Select>

              <Select value={levelFilter} onValueChange={setLevelFilter} data-testid="level-filter">
                <SelectTrigger>
                  <SelectValue placeholder="Niveau" />
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
          </CardContent>
        </Card>

        {/* Course Tabs */}
        <Tabs defaultValue={typeFilter === "ECN" ? "ecn" : typeFilter === "University" ? "university" : "all"} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Tous les cours ({filteredCourses.length})</TabsTrigger>
            <TabsTrigger value="ecn">ECN ({ecnCourses.length})</TabsTrigger>
            <TabsTrigger value="university">Universitaires ({universityCourses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <CourseGrid courses={filteredCourses} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="ecn" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Organisation par ECN</h3>
              <p className="text-sm text-muted-foreground">
                Cours organisés par Jour 1 et Jour 2 de l'ECN, puis par spécialité
              </p>
            </div>
            <CourseGrid courses={ecnCourses} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="university" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Organisation par cycles universitaires</h3>
              <p className="text-sm text-muted-foreground">
                Cours organisés par cycles PCEM1, PCEM2, DCEM1-3
              </p>
            </div>
            <CourseGrid courses={universityCourses} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CourseGrid({ courses, isLoading }: { courses: any[]; isLoading: boolean }) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="hover:shadow-lg transition-shadow" data-testid={`course-${course.id}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={course.type === 'ECN' ? 'default' : 'secondary'}>
                    {course.type}
                  </Badge>
                  {course.university && (
                    <Badge variant="outline">{course.university}</Badge>
                  )}
                  {course.year && (
                    <Badge variant="outline">{course.year}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {course.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {course.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {course.specialty && `${course.specialty} • `}
                  {course.subject}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button size="sm" className="flex-1" data-testid={`view-course-${course.id}`}>
                  <Eye className="w-4 h-4 mr-1" />
                  Voir
                </Button>
                {course.filePath && (
                  <Button size="sm" variant="outline" data-testid={`download-course-${course.id}`}>
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
