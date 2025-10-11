import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAbsoluteUrl } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Trophy, 
  Clock, 
  Target,
  Brain,
  Zap,
  FileText
} from "lucide-react";

interface QuizModalProps {
  course: any;
  isOpen: boolean;
  onClose: () => void;
}

interface QuizModalProps {
  course: any;
  isOpen: boolean;
  onClose: () => void;
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  difficulty: string;
}

export function QuizModal({ course, isOpen, onClose }: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; answer: number; isCorrect: boolean }[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  
  const queryClient = useQueryClient();

  // Fetch questions for the course or section
  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: [course.section_id ? API_ENDPOINTS.COURSE_SECTION_QUESTIONS(course.section_id) : API_ENDPOINTS.COURSE_RANDOM_QUESTIONS(course.id)],
    queryFn: async () => {
      const endpoint = course.section_id 
        ? `${API_ENDPOINTS.COURSE_SECTION_QUESTIONS(course.section_id)}?count=10&difficulty=${currentDifficulty}`
        : `${API_ENDPOINTS.COURSE_RANDOM_QUESTIONS(course.id)}?count=10&difficulty=${currentDifficulty}`;
      const response = await fetch(getAbsoluteUrl(endpoint), {
        credentials: "include",
      });
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      return course.section_id ? data.questions : data;
    },
    enabled: isOpen && (!!course.id || !!course.section_id) && quizStarted,
  });

  // Submit quiz result mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (result: QuizResult) => {
      const response = await fetch(getAbsoluteUrl(API_ENDPOINTS.QUIZ_SUBMIT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          course_id: course.id,
          course_section_id: course.section_id,
          questions: answers.map(a => ({ question_id: a.questionId, answer: a.answer })),
          time_taken: result.timeSpent,
        }),
      });
      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.COURSE_SECTION_STATISTICS(course.section_id || course.id)] });
    },
  });

  const startQuiz = () => {
      setQuizStarted(true);
      setStartTime(Date.now());
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setShowResult(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    const newAnswer = {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      isCorrect,
    };

    setAnswers(prev => [...prev, newAnswer]);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Quiz completed
      const endTime = Date.now();
      const timeSpent = Math.round((endTime - (startTime || 0)) / 1000 / 60); // in minutes
      
      const correctAnswers = answers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
      const totalQuestions = questions.length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);

      const result: QuizResult = {
        score,
        totalQuestions,
        correctAnswers,
        incorrectAnswers: totalQuestions - correctAnswers,
        timeSpent,
        difficulty: currentDifficulty,
      };

      submitQuizMutation.mutate(result);
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setStartTime(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Target className="h-4 w-4" />;
      case 'medium': return <Brain className="h-4 w-4" />;
      case 'hard': return <Zap className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Quiz - {course.sectionName || course.courseName}
          </DialogTitle>
          <DialogDescription>
            Testez vos connaissances avec ce quiz interactif sur le cours
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!quizStarted ? (
            // Quiz Start Screen
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <h2 className="text-2xl font-bold">Quiz de révision</h2>
                </div>
                <p className="text-muted-foreground">
                  Testez vos connaissances avec 10 questions aléatoires sur ce cours
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Paramètres du quiz</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulté</label>
                    <div className="flex gap-2">
                      {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                        <Button
                          key={difficulty}
                          variant={currentDifficulty === difficulty ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentDifficulty(difficulty)}
                          className="flex items-center gap-2"
                        >
                          {getDifficultyIcon(difficulty)}
                          {difficulty === 'easy' ? 'Facile' : difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">10</div>
                      <div className="text-sm text-muted-foreground">Questions</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">QCM</div>
                      <div className="text-sm text-muted-foreground">Format</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">∞</div>
                      <div className="text-sm text-muted-foreground">Temps</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 justify-center">
                <Button onClick={startQuiz} size="lg" className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Commencer le quiz
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : isLoadingQuestions ? (
            // Loading Questions
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p>Chargement des questions...</p>
            </div>
          ) : showResult ? (
            // Quiz Results
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="h-12 w-12 text-yellow-500" />
                  <div>
                    <h2 className="text-3xl font-bold">Quiz terminé !</h2>
                    <p className="text-muted-foreground">Voici vos résultats</p>
                  </div>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-6xl font-bold mb-2">
                        {Math.round((answers.filter(a => a.isCorrect).length / questions.length) * 100)}%
                      </div>
                      <div className="text-lg text-muted-foreground">
                        {answers.filter(a => a.isCorrect).length} / {questions.length} bonnes réponses
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-green-50">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {answers.filter(a => a.isCorrect).length}
                        </div>
                        <div className="text-sm text-green-600">Correctes</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-red-50">
                        <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-600">
                          {answers.filter(a => !a.isCorrect).length}
                        </div>
                        <div className="text-sm text-red-600">Incorrectes</div>
                      </div>
                    </div>

                    {startTime && (
                      <div className="text-center p-4 rounded-lg bg-blue-50">
                        <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-lg font-bold text-blue-600">
                          {Math.round((Date.now() - startTime) / 1000 / 60)} minutes
                        </div>
                        <div className="text-sm text-blue-600">Temps total</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 justify-center">
                <Button onClick={resetQuiz} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Recommencer
                </Button>
                <Button onClick={onClose}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : questions && questions.length > 0 ? (
            // Quiz Questions
            <div className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Question {currentQuestionIndex + 1} sur {questions.length}</span>
                  <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
              </div>

              {/* Question */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {questions[currentQuestionIndex].question}
                    </CardTitle>
                    <Badge className={getDifficultyColor(questions[currentQuestionIndex].difficulty)}>
                      {questions[currentQuestionIndex].difficulty === 'easy' ? 'Facile' : 
                       questions[currentQuestionIndex].difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questions[currentQuestionIndex].options.map((option: string, index: number) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === index ? "default" : "outline"}
                      className="w-full justify-start h-auto p-4 text-left"
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span>{option}</span>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Quitter
                </Button>
                <Button 
                  onClick={handleNextQuestion}
                  disabled={selectedAnswer === null}
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Question suivante' : 'Terminer le quiz'}
                </Button>
              </div>
            </div>
          ) : (
            // No Questions Available
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>Aucune question disponible pour ce cours.</p>
              </div>
              <Button onClick={onClose}>
                Fermer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
