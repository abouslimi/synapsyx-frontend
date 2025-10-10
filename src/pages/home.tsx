import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { authenticatedFetch } from "@/lib/authHelpers";
import {
  Play,
  Shuffle,
  Bot,
  ClipboardCheck,
  Send,
  Plus,
  Eye,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { authenticatedApiRequest } from "@/lib/queryClient";
import { useAuth as useOIDCAuth } from "react-oidc-context";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const oidcAuth = useOIDCAuth();
  const { toast } = useToast();
  const [aiMessage, setAiMessage] = useState("");

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

  const { data: todaySchedule } = useQuery({
    queryKey: ["/api/schedule"],
    queryFn: async ({ queryKey }) => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`${queryKey[0]}?date=${today}`, {
          credentials: "include",
        });
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

  const { data: statistics } = useQuery({
    queryKey: [API_ENDPOINTS.USER_STATISTICS],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await authenticatedFetch(queryKey[0]);
        if (!response.ok) throw new Error(response.statusText);
        return await response.json();
      } catch (error: any) {
        if (isUnauthorizedError(error)) {
          return null;
        }
        throw error;
      }
    },
  });

  const { data: aiCredits } = useQuery({
    queryKey: [API_ENDPOINTS.AI_CREDITS],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await authenticatedFetch(queryKey[0]);
        if (!response.ok) throw new Error(response.statusText);
        return await response.json();
      } catch (error: any) {
        if (isUnauthorizedError(error)) {
          return null;
        }
        throw error;
      }
    },
  });

  const { data: recentCourses } = useQuery({
    queryKey: [API_ENDPOINTS.COURSES],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await authenticatedFetch(`${queryKey[0]}?limit=3`);
        if (!response.ok) throw new Error(response.statusText);
        const courses = await response.json();
        return courses.slice(0, 3);
      } catch (error: any) {
        if (isUnauthorizedError(error)) {
          return [];
        }
        throw error;
      }
    },
  });

  const sendAIMessage = async () => {
    if (!aiMessage.trim()) return;
    
    try {
      await authenticatedApiRequest("POST", API_ENDPOINTS.AI_CHAT, {
        content: aiMessage,
      }, oidcAuth.user?.access_token);
      
      setAiMessage("");
      toast({
        title: "Message envoyé",
        description: "L'IA vous répondra dans quelques instants",
      });
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
        return;
      }
      
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="py-6" data-testid="home-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary to-accent rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2" data-testid="quote-title">Citation du jour</h2>
                <p className="text-lg opacity-90 italic" data-testid="daily-quote">
                  "La médecine est un art dont l'exercice demande un cœur et une âme."
                </p>
                <p className="text-sm opacity-75 mt-2" data-testid="quote-author">- Hippocrate</p>
              </div>
              <div className="hidden md:block">
                <svg className="w-24 h-24 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Program */}
          <div className="lg:col-span-2">
            <Card data-testid="today-program-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Programme d'aujourd'hui</CardTitle>
                  <Button variant="ghost" size="sm" data-testid="view-all-schedule">
                    <Eye className="w-4 h-4 mr-1" />
                    Voir tout
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaySchedule && todaySchedule.length > 0 ? (
                    todaySchedule.map((task: any, index: number) => (
                      <div key={task.id} className="flex items-center p-3 bg-muted rounded-lg" data-testid={`task-${index}`}>
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${
                            task.isCompleted ? 'bg-accent' : 
                            task.type === 'practice' ? 'bg-primary' : 
                            'bg-muted-foreground'
                          }`}></div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-foreground">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.startTime && task.endTime ? `${task.startTime} - ${task.endTime}` : 'Toute la journée'}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant={
                            task.type === 'practice' ? 'default' :
                            task.type === 'exam' ? 'destructive' :
                            'secondary'
                          }>
                            {task.type}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune tâche programmée pour aujourd'hui
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="ghost" className="w-full" data-testid="add-task-button">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une tâche
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div>
            <Card data-testid="progress-card">
              <CardHeader>
                <CardTitle>Progression cette semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Temps d'étude</span>
                      <span className="text-sm font-medium text-foreground" data-testid="study-time">
                        {statistics ? `${Math.floor(statistics.totalTimeSpent / 60)}h ${statistics.totalTimeSpent % 60}m` : '0h 0m'}
                      </span>
                    </div>
                    <Progress value={statistics ? Math.min((statistics.totalTimeSpent / 1800) * 100, 100) : 0} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">QCM réalisés</span>
                      <span className="text-sm font-medium text-foreground" data-testid="questions-completed">
                        {statistics ? `${statistics.completedQuestions}/200` : '0/200'}
                      </span>
                    </div>
                    <Progress value={statistics ? (statistics.completedQuestions / 200) * 100 : 0} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Cours complétés</span>
                      <span className="text-sm font-medium text-foreground" data-testid="courses-completed">
                        {statistics ? `${statistics.completedCourses}/12` : '0/12'}
                      </span>
                    </div>
                    <Progress value={statistics ? (statistics.completedCourses / 12) * 100 : 0} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground" data-testid="rank-percentage">Top 15%</p>
                    <p className="text-xs text-muted-foreground">de votre promotion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="quick-start-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-foreground">Démarrage rapide</p>
                  <p className="text-xs text-muted-foreground">Continuer les révisions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="random-quiz-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Shuffle className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-foreground">Quiz aléatoire</p>
                  <p className="text-xs text-muted-foreground">Tester ses connaissances</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="ai-tutor-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-secondary-foreground" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-foreground">IA Tuteur</p>
                  <p className="text-xs text-muted-foreground">Poser une question</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="mock-exam-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-destructive" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-foreground">Examen blanc</p>
                  <p className="text-xs text-muted-foreground">Simulation ECN</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Courses */}
          <Card data-testid="recent-courses-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cours récents</CardTitle>
                <Button variant="ghost" size="sm">Voir tout</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCourses && recentCourses.length > 0 ? (
                  recentCourses.map((course: any, index: number) => (
                    <div key={course.id} className="flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer" data-testid={`course-${index}`}>
                      <div className="flex-shrink-0">
                        <div className="w-12 h-10 rounded bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {course.type === 'ECN' ? 'ECN' : 'UNI'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-foreground">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.type} • {course.university} {course.year}
                        </p>
                        <div className="mt-1">
                          <div className="w-full bg-muted-foreground/20 rounded-full h-1">
                            <div className="bg-primary h-1 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-xs text-muted-foreground">
                        65%
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun cours disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Chat Preview */}
          <Card data-testid="ai-chat-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>IA Tuteur</CardTitle>
                <Badge variant="secondary" data-testid="ai-credits-badge">
                  {aiCredits ? `${aiCredits.aiCredits} crédits restants` : 'Chargement...'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <div className="flex-1 bg-muted p-3 rounded-lg">
                    <p className="text-sm text-foreground">
                      Bonjour {(user as any)?.firstName || 'Étudiant'}! Comment puis-je t'aider avec tes révisions aujourd'hui?
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Posez votre question..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendAIMessage()}
                  className="flex-1"
                  data-testid="ai-message-input"
                />
                <Button 
                  onClick={sendAIMessage}
                  disabled={!aiMessage.trim()}
                  data-testid="send-ai-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
