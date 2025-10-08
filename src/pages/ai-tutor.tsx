import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  MessageSquare,
  Clock,
  Brain,
  BookOpen,
  AlertCircle
} from "lucide-react";
import { authenticatedApiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AiTutor() {
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading } = useAuth();
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
        window.location.href = "http://localhost:5001/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: chatHistory } = useQuery({
    queryKey: ["/api/ai/chat"],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey[0], {
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
            window.location.href = "http://localhost:5001/api/login";
          }, 500);
          return [];
        }
        throw error;
      }
    },
  });

  const { data: aiCredits } = useQuery({
    queryKey: ["/api/ai/credits"],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey[0], {
          credentials: "include",
        });
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

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; context?: string }) => {
      return await authenticatedApiRequest("POST", "/api/ai/chat", data);
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/chat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/credits"] });
      setMessage("");
      setContext("");
      toast({
        title: "Message envoyé",
        description: "L'IA a répondu à votre question",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Redirection...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "http://localhost:5001/api/login";
        }, 500);
        return;
      }
      
      if (error.message.includes("Insufficient AI credits")) {
        toast({
          title: "Crédits insuffisants",
          description: "Vous n'avez plus de crédits IA disponibles",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer le message à l'IA",
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      setIsTyping(false);
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    if (aiCredits && aiCredits.aiCredits <= 0) {
      toast({
        title: "Crédits insuffisants",
        description: "Vous n'avez plus de crédits IA disponibles",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      message: message.trim(),
      context: context.trim() || undefined,
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const quickQuestions = [
    "Explique-moi la physiopathologie de l'insuffisance cardiaque",
    "Quels sont les signes cliniques d'un AVC ?",
    "Comment diagnostiquer une pneumonie ?",
    "Quels sont les différents types d'anémie ?",
  ];

  return (
    <div className="py-6" data-testid="ai-tutor-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center">
                <Bot className="w-8 h-8 mr-3 text-primary" />
                IA Tuteur
              </h1>
              <p className="text-lg text-muted-foreground">
                Posez vos questions médicales à notre assistant IA spécialisé
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center" data-testid="credits-badge">
              <Sparkles className="w-4 h-4 mr-1" />
              {aiCredits ? `${aiCredits.aiCredits} crédits` : 'Chargement...'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with quick actions */}
          <div className="lg:col-span-1 space-y-4">
            <Card data-testid="quick-questions">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Questions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left h-auto p-3 justify-start"
                    onClick={() => setMessage(question)}
                    data-testid={`quick-question-${index}`}
                  >
                    <span className="text-xs line-clamp-3">{question}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card data-testid="ai-stats">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Questions posées</span>
                  <span className="font-medium">{chatHistory?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Crédits restants</span>
                  <span className="font-medium">{aiCredits?.aiCredits || 0}</span>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  <p>💡 Conseil: Soyez précis dans vos questions pour obtenir de meilleures réponses</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main chat area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col" data-testid="chat-area">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center justify-between">
                  <span>Conversation avec l'IA</span>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    En ligne
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Welcome message */}
                    {(!chatHistory || chatHistory.length === 0) && (
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8 bg-primary">
                          <AvatarFallback>
                            <Bot className="w-4 h-4 text-primary-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted p-4 rounded-lg">
                          <p className="text-sm text-foreground">
                            Bonjour {user?.firstName || 'Étudiant'} ! 👋
                          </p>
                          <p className="text-sm text-foreground mt-2">
                            Je suis votre assistant IA spécialisé en médecine. Posez-moi vos questions sur :
                          </p>
                          <ul className="text-sm text-foreground mt-2 space-y-1 list-disc list-inside">
                            <li>Physiopathologie et mécanismes</li>
                            <li>Diagnostic et examens</li>
                            <li>Traitements et thérapeutiques</li>
                            <li>Cas cliniques et ECN</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Chat history */}
                    {chatHistory?.map((chat: any, index: number) => (
                      <div key={chat.id || index} className="space-y-4">
                        {/* User message */}
                        <div className="flex items-start space-x-3 justify-end">
                          <div className="flex-1 max-w-2xl bg-primary p-4 rounded-lg">
                            <p className="text-sm text-primary-foreground">{chat.message}</p>
                            {chat.context && (
                              <div className="mt-2 p-2 bg-primary-foreground/10 rounded text-xs text-primary-foreground/80">
                                <BookOpen className="w-3 h-3 inline mr-1" />
                                Contexte: {chat.context}
                              </div>
                            )}
                          </div>
                          <Avatar className="w-8 h-8 bg-secondary">
                            <AvatarFallback>
                              <User className="w-4 h-4 text-secondary-foreground" />
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {/* AI response */}
                        <div className="flex items-start space-x-3">
                          <Avatar className="w-8 h-8 bg-primary">
                            <AvatarFallback>
                              <Bot className="w-4 h-4 text-primary-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-muted p-4 rounded-lg">
                            <div className="whitespace-pre-wrap text-sm text-foreground">
                              {chat.response}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {format(new Date(chat.createdAt), "PPp", { locale: fr })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8 bg-primary">
                          <AvatarFallback>
                            <Bot className="w-4 h-4 text-primary-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input area */}
                <div className="border-t p-4 space-y-3">
                  {/* Context input */}
                  <div>
                    <Textarea
                      placeholder="Contexte optionnel (extrait de cours, cas clinique...)"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      className="min-h-[60px] resize-none"
                      data-testid="context-input"
                    />
                  </div>

                  {/* Message input */}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Posez votre question médicale..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="flex-1"
                      disabled={sendMessageMutation.isPending || (aiCredits && aiCredits.aiCredits <= 0)}
                      data-testid="message-input"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMessageMutation.isPending || (aiCredits && aiCredits.aiCredits <= 0)}
                      data-testid="send-button"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Credits warning */}
                  {aiCredits && aiCredits.aiCredits <= 3 && (
                    <div className="flex items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {aiCredits.aiCredits === 0 
                          ? "Vous n'avez plus de crédits IA" 
                          : `Plus que ${aiCredits.aiCredits} crédits IA disponibles`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
