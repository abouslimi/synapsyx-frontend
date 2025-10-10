import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, RotateCcw, Filter } from "lucide-react";
import { authenticatedApiRequest, queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { useToast } from "@/hooks/use-toast";
import { useAuth as useOIDCAuth } from "react-oidc-context";

export default function Practice() {
  const oidcAuth = useOIDCAuth();
  const [selectedFilters, setSelectedFilters] = useState({
    difficulty: "all",
    tags: "all",
    course: "all",
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  const { data: questions } = useQuery({
    queryKey: [API_ENDPOINTS.QUESTIONS, selectedFilters],
    queryFn: async ({ queryKey }) => {
      const [url, filters] = queryKey;
      const params = new URLSearchParams();
      
      if (filters && typeof filters === 'object') {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') params.append(key, value as string);
        });
      }
      
      const response = await fetch(`${url}?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    },
  });

  const { data: courses } = useQuery({
    queryKey: [API_ENDPOINTS.COURSES],
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: string; answer: number; timeSpent: number }) => {
      return await authenticatedApiRequest("POST", API_ENDPOINTS.PROGRESS, {
        course_id: data.questionId, // This should be the course ID, not question ID
        progress_percentage: data.answer === 1 ? 100 : 0,
        study_time: data.timeSpent,
      }, oidcAuth.user?.access_token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PROGRESS] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.USER_STATISTICS] });
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1);
      }, 1000);
    } else if (!isActive && timer !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timer]);

  const startPractice = () => {
    setIsActive(true);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setTimer(0);
  };

  const selectAnswer = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const nextQuestion = () => {
    if (questions && currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishPractice = async () => {
    setIsActive(false);
    setShowResults(true);

    // Submit all answers
    if (questions) {
      for (const [index, answerIndex] of Object.entries(answers)) {
        const question = questions[parseInt(index)];
        if (question) {
          await submitAnswerMutation.mutateAsync({
            questionId: question.id,
            answer: answerIndex,
            timeSpent: Math.floor(timer / questions.length), // Average time per question
          });
        }
      }
    }

    toast({
      title: "Série terminée",
      description: `Vous avez répondu à ${Object.keys(answers).length} questions en ${Math.floor(timer / 60)}:${timer % 60}`,
    });
  };

  const resetPractice = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setTimer(0);
    setIsActive(false);
  };

  const calculateScore = () => {
    if (!questions) return { correct: 0, total: 0, percentage: 0 };
    
    let correct = 0;
    Object.entries(answers).forEach(([index, answerIndex]) => {
      const question = questions[parseInt(index)];
      if (question && question.correctAnswer === answerIndex) {
        correct++;
      }
    });
    
    const total = Object.keys(answers).length;
    return {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="py-6" data-testid="practice-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Pratiquer</h1>
          <p className="text-lg text-muted-foreground">
            Entraînez-vous avec des QCM organisés par sujet, difficulté et source
          </p>
        </div>

        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Questions personnalisées</TabsTrigger>
            <TabsTrigger value="organized">Séries pré-organisées</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-6">
            {/* Filters Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filtres de questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Difficulté</Label>
                    <Select
                      value={selectedFilters.difficulty}
                      onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner difficulté" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="easy">Facile</SelectItem>
                        <SelectItem value="medium">Moyen</SelectItem>
                        <SelectItem value="hard">Difficile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cours</Label>
                    <Select
                      value={selectedFilters.course}
                      onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, course: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner cours" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les cours</SelectItem>
                        {(courses as any[])?.map((course: any) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <Select
                      value={selectedFilters.tags}
                      onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, tags: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les tags</SelectItem>
                        <SelectItem value="cardiologie">Cardiologie</SelectItem>
                        <SelectItem value="pneumologie">Pneumologie</SelectItem>
                        <SelectItem value="neurologie">Neurologie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {questions ? `${questions.length} questions trouvées` : 'Chargement...'}
                  </p>
                  <Button onClick={startPractice} disabled={!questions || questions.length === 0}>
                    Commencer la série
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Practice Interface */}
            {isActive && questions && questions.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Question {currentQuestion + 1} / {questions.length}
                    </CardTitle>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="font-mono">{formatTime(timer)}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetPractice}
                        data-testid="reset-practice"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>
                  <Progress value={(currentQuestion + 1) / questions.length * 100} />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      {questions[currentQuestion].question}
                    </h3>

                    <RadioGroup
                      value={answers[currentQuestion]?.toString()}
                      onValueChange={(value) => selectAnswer(currentQuestion, parseInt(value))}
                    >
                      {questions[currentQuestion].options.map((option: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1">
                            <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={prevQuestion}
                      disabled={currentQuestion === 0}
                    >
                      Précédent
                    </Button>
                    <div className="space-x-2">
                      {currentQuestion < questions.length - 1 ? (
                        <Button onClick={nextQuestion}>
                          Suivant
                        </Button>
                      ) : (
                        <Button onClick={finishPractice} data-testid="finish-practice">
                          Terminer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {showResults && questions && (
              <Card>
                <CardHeader>
                  <CardTitle>Résultats de la série</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {calculateScore().correct}/{calculateScore().total}
                        </p>
                        <p className="text-sm text-muted-foreground">Bonnes réponses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent">
                          {calculateScore().percentage}%
                        </p>
                        <p className="text-sm text-muted-foreground">Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">
                          {formatTime(timer)}
                        </p>
                        <p className="text-sm text-muted-foreground">Temps total</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {questions.map((question: any, index: number) => {
                        const userAnswer = answers[index];
                        const isCorrect = userAnswer === question.correctAnswer;
                        const wasAnswered = userAnswer !== undefined;

                        return (
                          <div key={question.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm">
                              Question {index + 1}
                            </span>
                            <div className="flex items-center space-x-2">
                              {!wasAnswered ? (
                                <Badge variant="secondary">Non répondue</Badge>
                              ) : isCorrect ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-center">
                      <Button onClick={resetPractice}>
                        Nouvelle série
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="organized" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">ECN Jour 1</CardTitle>
                  <Badge className="w-fit">50 questions</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Questions couvrant toutes les spécialités du Jour 1
                  </p>
                  <Button className="w-full">Commencer</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">ECN Jour 2</CardTitle>
                  <Badge className="w-fit">50 questions</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Questions couvrant toutes les spécialités du Jour 2
                  </p>
                  <Button className="w-full">Commencer</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Cardiologie</CardTitle>
                  <Badge className="w-fit">30 questions</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Questions spécialisées en cardiologie
                  </p>
                  <Button className="w-full">Commencer</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
