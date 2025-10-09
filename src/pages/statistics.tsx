import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/apiConfig";
import { authenticatedFetch } from "@/lib/authHelpers";
import { 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Target, 
  Award, 
  Calendar,
  Users,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

export default function Statistics() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous devez être connecté. Redirection...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: statistics } = useQuery({
    queryKey: [API_ENDPOINTS.USER_STATISTICS],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await authenticatedFetch(queryKey[0]);
        if (!response.ok) throw new Error(response.statusText);
        return await response.json();
      } catch (error: any) {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Non autorisé",
            description: "Vous êtes déconnecté. Redirection...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 500);
          return null;
        }
        throw error;
      }
    },
  });

  const { data: examResults } = useQuery({
    queryKey: [API_ENDPOINTS.ACHIEVEMENTS],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await authenticatedFetch(queryKey[0]);
        if (!response.ok) throw new Error(response.statusText);
        return await response.json();
      } catch (error: any) {
        if (isUnauthorizedError(error)) {
          return [];
        }
        throw error;
      }
    },
  });

  useQuery({
    queryKey: [API_ENDPOINTS.PROGRESS],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey[0], {
          credentials: "include",
        });
        if (!response.ok) throw new Error(response.statusText);
        return await response.json();
      } catch (error: any) {
        if (isUnauthorizedError(error)) {
          return [];
        }
        throw error;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateStreak = () => {
    // Simple streak calculation based on recent activity
    return 7; // Placeholder - would calculate based on daily activity
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 85) return { level: "Excellent", color: "text-green-500", bg: "bg-green-100" };
    if (score >= 70) return { level: "Bien", color: "text-blue-500", bg: "bg-blue-100" };
    if (score >= 60) return { level: "Satisfaisant", color: "text-yellow-500", bg: "bg-yellow-100" };
    return { level: "À améliorer", color: "text-red-500", bg: "bg-red-100" };
  };

  const recentExams = examResults?.slice(0, 5) || [];
  const averageScore = statistics?.averageScore || 0;
  const performance = getPerformanceLevel(averageScore);

  return (
    <div className="py-6" data-testid="statistics-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Mes Statistiques</h1>
          <p className="text-lg text-muted-foreground">
            Suivez votre progression et analysez vos performances
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="total-study-time">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Temps d'étude total</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statistics ? formatTime(statistics.totalTimeSpent) : '0h 0m'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="completed-courses">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cours complétés</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statistics?.completedCourses || 0}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="questions-answered">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Questions répondues</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statistics?.completedQuestions || 0}
                  </p>
                </div>
                <Target className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="average-score">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score moyen</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round(averageScore)}%
                  </p>
                  <Badge className={`mt-1 ${performance.bg} ${performance.color} border-0`}>
                    {performance.level}
                  </Badge>
                </div>
                <Award className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="progress">Progression</TabsTrigger>
            <TabsTrigger value="exams">Examens</TabsTrigger>
            <TabsTrigger value="comparison">Comparaison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Progress */}
              <Card data-testid="weekly-progress">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Progression de la semaine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Temps d'étude</span>
                      <span className="text-sm font-medium">
                        {statistics ? formatTime(statistics.totalTimeSpent % 10080) : '0h 0m'}
                      </span>
                    </div>
                    <Progress value={statistics ? Math.min((statistics.totalTimeSpent / 1800) * 100, 100) : 0} />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Questions pratiquées</span>
                      <span className="text-sm font-medium">
                        {statistics?.weeklyProgress || 0}/200
                      </span>
                    </div>
                    <Progress value={statistics ? (statistics.weeklyProgress / 200) * 100 : 0} />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Objectif hebdomadaire</span>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                    <Progress value={75} />
                  </div>
                </CardContent>
              </Card>

              {/* Study Streak */}
              <Card data-testid="study-streak">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Série d'étude
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div>
                      <p className="text-4xl font-bold text-primary">{calculateStreak()}</p>
                      <p className="text-sm text-muted-foreground">jours consécutifs</p>
                    </div>
                    <div className="flex justify-center space-x-1">
                      {[...Array(7)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full ${
                            i < calculateStreak() ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Continuez ainsi pour maintenir votre série!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card data-testid="subject-progress">
              <CardHeader>
                <CardTitle>Progression par matière</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Cardiologie', 'Pneumologie', 'Neurologie', 'Gastroentérologie'].map((subject, index) => {
                    const progressValue = [85, 72, 65, 45][index];
                    const performance = getPerformanceLevel(progressValue);
                    
                    return (
                      <div key={subject} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{subject}</span>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${performance.bg} ${performance.color} border-0 text-xs`}>
                              {performance.level}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{progressValue}%</span>
                          </div>
                        </div>
                        <Progress value={progressValue} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exams" className="space-y-6">
            <Card data-testid="recent-exams">
              <CardHeader>
                <CardTitle>Examens récents</CardTitle>
              </CardHeader>
              <CardContent>
                {recentExams.length > 0 ? (
                  <div className="space-y-4">
                    {recentExams.map((exam: any, index: number) => {
                      const performance = getPerformanceLevel((exam.score / exam.totalQuestions) * 100);
                      
                      return (
                        <div key={exam.id || index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div>
                            <h4 className="font-medium">{exam.examType}</h4>
                            <p className="text-sm text-muted-foreground">
                              {exam.institution} - {exam.examYear}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {exam.timeSpent ? formatTime(exam.timeSpent) : 'Temps non enregistré'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {exam.score}/{exam.totalQuestions}
                            </div>
                            <Badge className={`${performance.bg} ${performance.color} border-0 text-xs`}>
                              {Math.round((exam.score / exam.totalQuestions) * 100)}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Aucun examen passé</h3>
                    <p>Commencez par passer des examens blancs pour voir vos statistiques</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <Card data-testid="peer-comparison">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Comparaison avec vos pairs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-4">
                      <TrendingUp className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Top 15%</h3>
                    <p className="text-muted-foreground">
                      Vous êtes dans le top 15% de votre promotion
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-accent">73%</p>
                      <p className="text-sm text-muted-foreground">Score moyen de la promotion</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">{Math.round(averageScore)}%</p>
                      <p className="text-sm text-muted-foreground">Votre score moyen</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Performance par catégorie:</h4>
                    {[
                      { name: 'Questions QCM', your: 82, average: 75 },
                      { name: 'Cas cliniques', your: 78, average: 71 },
                      { name: 'Temps de réponse', your: 85, average: 73 },
                    ].map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{category.name}</span>
                          <span>{category.your}% (Moyenne: {category.average}%)</span>
                        </div>
                        <div className="relative">
                          <Progress value={category.average} className="h-2" />
                          <div 
                            className="absolute top-0 h-2 bg-primary rounded-full"
                            style={{ width: `${category.your}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
