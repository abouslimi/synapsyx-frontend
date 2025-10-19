import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import type { 
  ChatMessageRequest, 
  ChatMessageResponse, 
  ChatSessionResponse, 
  ChatHistoryWithoutMessagesResponse,
  ChatSessionCreationRequest,
  SimilaritySearchRequest,
  SimilaritySearchResponse,
  CourseSectionResponse,
  CourseSectionListResponse
} from "@/lib/apiConfig";
import { 
  Bot, 
  Send, 
  User, 
  Clock,
  Brain,
  BookOpen,
  AlertCircle,
  Plus,
  Search,
  Target,
  ChevronDown,
  ChevronUp,
  History,
  X,
} from "lucide-react";
import { authenticatedApiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuth as useOIDCAuth } from "react-oidc-context";
import { isUnauthorizedError } from "@/lib/authUtils";
import { fr } from "date-fns/locale";
import { formatInTimeZone } from 'date-fns-tz'

export default function AiTutor() {
  const oidcAuth = useOIDCAuth();
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [selectedCourseSections, setSelectedCourseSections] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [courseSectionSearch, setCourseSectionSearch] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [isSessionLoaded, setIsSessionLoaded] = useState<boolean>(false);
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
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Helper function to get query parameter from URL
  const getQueryParam = (name: string): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  };

  // Helper function to update URL with session_id parameter
  const updateUrlWithSessionId = (sessionId: string | null) => {
    const url = new URL(window.location.href);
    if (sessionId) {
      url.searchParams.set('session_id', sessionId);
    } else {
      url.searchParams.delete('session_id');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Initialize session from URL parameter
  useEffect(() => {
    const urlSessionId = getQueryParam('session_id');
    if (urlSessionId && urlSessionId !== currentSessionId) {
      setCurrentSessionId(urlSessionId);
    }
  }, [currentSessionId]);

  // Fetch chat history (sessions)
  const { data: chatHistory, isLoading: isChatHistoryLoading } = useQuery<ChatHistoryWithoutMessagesResponse>({
    queryKey: [API_ENDPOINTS.AI_CHAT],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await authenticatedApiRequest("GET", queryKey[0] as string, null, oidcAuth.user?.access_token);
        const data = await response.json();
        return data as ChatHistoryWithoutMessagesResponse;
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
          return { sessions: [], total: 0 };
        }
        throw error;
      }
    },
  });

  // Fetch current session details if we have a session ID
  const { data: currentSession } = useQuery<ChatSessionResponse | null>({
    queryKey: [API_ENDPOINTS.AI_CHAT_SESSION_DETAILS(currentSessionId || ""), currentSessionId],
    queryFn: async ({ queryKey }) => {
      if (!currentSessionId) return null;
      try {
        const response = await authenticatedApiRequest("GET", queryKey[0] as string, null, oidcAuth.user?.access_token);
        const data = await response.json();
        return data as ChatSessionResponse;
      } catch (error: any) {
        if (isUnauthorizedError(error)) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!currentSessionId,
  });

  // Initialize with user data only once when component mounts
  useEffect(() => {
    if (user?.university && !selectedUniversity) {
      setSelectedUniversity(user.university);
    }
    if (user?.cls && !selectedLevel) {
      setSelectedLevel(user.cls);
    }
  }, []);

  useEffect(() => {
    console.log("currentSession", currentSession);
    loadSessionData();
  }, [currentSession]);

  // Fetch course sections for context selection with search
  const { data: courseSections } = useQuery<CourseSectionListResponse>({
    queryKey: [API_ENDPOINTS.COURSE_SECTIONS_SEARCH, courseSectionSearch, selectedUniversity, selectedLevel],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (courseSectionSearch) params.append('keyword', courseSectionSearch);
        if (selectedUniversity) params.append('university', selectedUniversity);
        if (selectedLevel) params.append('level', selectedLevel);
        params.append('per_page', '100');
        
        const response = await authenticatedApiRequest("GET", `${API_ENDPOINTS.COURSE_SECTIONS_SEARCH}?${params.toString()}`, null, oidcAuth.user?.access_token);
        const data = await response.json();
        return data as CourseSectionListResponse;
      } catch (error: any) {
        if (isUnauthorizedError(error)) {
          return { sections: [], total: 0, page: 1, per_page: 100 };
        }
        throw error;
      }
    },
  });

  // Create new chat session
  const createSessionMutation = useMutation({
    mutationFn: async (data: ChatSessionCreationRequest): Promise<ChatSessionResponse> => {
      const response = await authenticatedApiRequest("POST", API_ENDPOINTS.AI_CHAT_SESSION, data, oidcAuth.user?.access_token);
      const responseData = await response.json();
      return responseData as ChatSessionResponse;
    },
    onSuccess: (response: ChatSessionResponse) => {
      setCurrentSessionId(response.session_id);
      updateUrlWithSessionId(response.session_id);
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.AI_CHAT] });
      toast({
        title: "Nouvelle session créée",
        description: "Vous pouvez maintenant commencer à discuter avec l'IA",
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
          window.location.href = "/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Erreur",
        description: "Impossible de créer une nouvelle session",
        variant: "destructive",
      });
    },
  });

  // Update chat session
  const updateSessionMutation = useMutation({
    mutationFn: async (data: { course_section_ids: string[]; university?: string; level?: string }): Promise<ChatSessionResponse> => {
      if (!currentSessionId) throw new Error("No session ID");
      const response = await authenticatedApiRequest("PUT", API_ENDPOINTS.AI_CHAT_SESSION_DETAILS(currentSessionId), data, oidcAuth.user?.access_token);
      const responseData = await response.json();
      return responseData as ChatSessionResponse;
    },
    onSuccess: () => {
      if (currentSessionId) {
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.AI_CHAT_SESSION_DETAILS(currentSessionId)] });
      }
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.AI_CHAT] });
      toast({
        title: "Session mise à jour",
        description: "Les paramètres de la session ont été mis à jour",
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
          window.location.href = "/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la session",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: ChatMessageRequest): Promise<ChatMessageResponse> => {
      const response = await authenticatedApiRequest("POST", API_ENDPOINTS.AI_CHAT, data, oidcAuth.user?.access_token);
      const responseData = await response.json();
      return responseData as ChatMessageResponse;
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.AI_CHAT] });
      if (currentSessionId) {
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.AI_CHAT_SESSION_DETAILS(currentSessionId)] });
      }
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
          window.location.href = "/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message à l'IA",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsTyping(false);
    },
  });

  // Similarity search mutation
  const similaritySearchMutation = useMutation({
    mutationFn: async (data: SimilaritySearchRequest): Promise<SimilaritySearchResponse> => {
      const response = await authenticatedApiRequest("POST", API_ENDPOINTS.AI_SIMILARITY_SEARCH, data, oidcAuth.user?.access_token);
      const responseData = await response.json();
      return responseData as SimilaritySearchResponse;
    },
    onSuccess: (response: SimilaritySearchResponse) => {
      toast({
        title: "Recherche terminée",
        description: `${response.total_matches} résultats trouvés`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur de recherche",
        description: "Impossible d'effectuer la recherche",
        variant: "destructive",
      });
    },
  });

  const handleCreateNewSession = () => {
    const sessionData: ChatSessionCreationRequest = {
      course_section_ids: selectedCourseSections,
      university: selectedUniversity,
      level: selectedLevel,
    };
    createSessionMutation.mutate(sessionData);
  };

  const handleLoadSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsSessionLoaded(false);
    updateUrlWithSessionId(sessionId);
    // Refresh sessions data when a session is selected
    queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.AI_CHAT] });
  };

  const loadSessionData = () => {
    console.log("loadSessionData", currentSession);
    if (currentSession) {
      if (currentSession.university) {
        setSelectedUniversity(currentSession.university);
      }
      if (currentSession.level) {
        setSelectedLevel(currentSession.level);
      }
      if (currentSession.course_section_ids && currentSession.course_section_ids.length > 0) {
        setSelectedCourseSections(currentSession.course_section_ids);
      }
      setIsSessionLoaded(true);
    }
  };

  const handleUniversityChange = (value: string) => {
    setSelectedUniversity(value);
    // Update session if we have one
    if (currentSessionId) {
      updateSessionMutation.mutate({
        course_section_ids: selectedCourseSections,
        university: value,
        level: selectedLevel,
      });
    }
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
    // Update session if we have one
    if (currentSessionId) {
      updateSessionMutation.mutate({
        course_section_ids: selectedCourseSections,
        university: selectedUniversity,
        level: value,
      });
    }
  };



  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    if (!currentSessionId) {
      toast({
        title: "Session requise",
        description: "Veuillez créer une nouvelle session avant d'envoyer un message",
        variant: "destructive",
      });
      return;
    }

    const messageData: ChatMessageRequest = {
      content: message.trim(),
      context: context.trim() || undefined,
      session_id: currentSessionId,
      search_top_k: 5,
    };

    if (selectedCourseSections.length > 0) {
      messageData.course_section_ids = selectedCourseSections;
    }

    if (selectedUniversity) {
      messageData.search_index_name = selectedUniversity.toLowerCase();
    }

    sendMessageMutation.mutate(messageData);
  };

  const handleSimilaritySearch = () => {
    if (!message.trim()) return;

    const searchData: SimilaritySearchRequest = {
      query: message.trim(),
      top_k: 10,
      include_images: false,
    };

    if (selectedCourseSections.length > 0) {
      searchData.course_section_ids = selectedCourseSections;
    }

    if (selectedUniversity) {
      searchData.index_name = selectedUniversity.toLowerCase();
    }

    similaritySearchMutation.mutate(searchData);
  };

  const handleCourseSectionToggle = useCallback((sectionId: string) => {
    setSelectedCourseSections(prev => {
      const newSelection = prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId];
      
      // Update session immediately with new selection
      if (currentSessionId && isSessionLoaded) {
        updateSessionMutation.mutate({
          course_section_ids: newSelection,
          university: selectedUniversity,
          level: selectedLevel,
        });
      }
      return newSelection;
    });
  }, [currentSessionId, isSessionLoaded, selectedUniversity, selectedLevel, updateSessionMutation]);

  const handleClearSelectedSections = useCallback(() => {
    setSelectedCourseSections([]);
    // Update session immediately with empty array
    if (currentSessionId && isSessionLoaded) {
      updateSessionMutation.mutate({
        course_section_ids: [],
        university: selectedUniversity,
        level: selectedLevel,
      });
    }
  }, [currentSessionId, isSessionLoaded, selectedUniversity, selectedLevel, updateSessionMutation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession, isTyping]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }



  const universities = [
    { value: "FMT", label: "F.M.Tunis" },
    { value: "FMS", label: "F.M.Sousse" },
    { value: "FMM", label: "F.M.Monastir" },
    { value: "FMSfax", label: "F.M.Sfax" },
  ];

  const levels = [
    { value: "PCEM1", label: "PCEM1" },
    { value: "PCEM2", label: "PCEM2" },
    { value: "DCEM1", label: "DCEM1" },
    { value: "DCEM2", label: "DCEM2" },
    { value: "DCEM3", label: "DCEM3" },
    { value: "INTERNE", label: "INTERNE" },
    { value: "AUTRE", label: "AUTRE" },
  ];

  // Group course sections by course
  const groupedSections = courseSections?.sections?.reduce((acc, section) => {
    const courseName = section.course?.course_name || 'Sans cours';
    if (!acc[courseName]) {
      acc[courseName] = [];
    }
    acc[courseName].push(section);
    return acc;
  }, {} as Record<string, CourseSectionResponse[]>) || {};

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
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center">
                <Brain className="w-4 h-4 mr-1" />
                SynapsyX GPT
              </Badge>
              <Button
                onClick={handleCreateNewSession}
                disabled={createSessionMutation.isPending}
                size="sm"
                className="flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nouvelle session
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with session history and context */}
          <div className="lg:col-span-1 space-y-4">
            {/* Session History */}
            <Card data-testid="session-history">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Historique des sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4">
                <div className="h-48">
                  <ScrollArea className="h-full">
                    <div className="space-y-2 pr-4">
                      {isChatHistoryLoading ? (
                        <div className="space-y-2 p-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : chatHistory?.sessions?.length ? (
                        chatHistory.sessions.map((session) => (
                          <Button
                            key={session.session_id}
                            variant={currentSessionId === session.session_id ? "default" : "outline"}
                            size="sm"
                            className="w-full text-left h-auto p-3 justify-start mb-2"
                            onClick={() => handleLoadSession(session.session_id)}
                          >
                            <div className="flex flex-col items-start">
                              <span className="text-xs font-medium">
                                {session.last_message?.content?.slice(0, 15)}...
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatInTimeZone(new Date(session.updated_at), 'Africa/Tunis', "dd/MM/yyyy HH:mm", { locale: fr })}
                              </span>
                            </div>
                          </Button>
                        ))
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-4">
                          Aucune session précédente
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleCreateNewSession}
                    disabled={createSessionMutation.isPending}
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Nouvelle session
                  </Button>
                  {currentSessionId && (
                    <Button
                      onClick={loadSessionData}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Charger les données de session
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Context Selection */}
            <Card data-testid="context-selection">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Contexte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Université</label>
                  <Select 
                    value={selectedUniversity} 
                    onValueChange={handleUniversityChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une université" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((university) => (
                        <SelectItem key={university.value} value={university.value}>
                          {university.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Niveau</label>
                  <Select 
                    value={selectedLevel} 
                    onValueChange={handleLevelChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sections de cours</label>
                  <Input
                    placeholder="Rechercher des sections..."
                    value={courseSectionSearch}
                    onChange={(e) => setCourseSectionSearch(e.target.value)}
                    className="mb-2"
                  />
                  
                  {selectedCourseSections.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">Sélectionnées ({selectedCourseSections.length})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSelectedSections}
                          className="h-6 px-2"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedCourseSections.map((sectionId) => {
                          const section = courseSections?.sections?.find(s => s.section_id === sectionId);
                          return (
                            <Badge key={sectionId} variant="secondary" className="text-xs">
                              {section?.section_name || sectionId.slice(0, 8)}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="h-32">
                    <ScrollArea className="h-full">
                      <div className="space-y-2 pr-4">
                        {Object.entries(groupedSections).map(([courseName, sections]) => (
                          <div key={courseName}>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {courseName}
                            </div>
                            {sections.map((section) => (
                              <div key={section.section_id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={section.section_id}
                                  checked={selectedCourseSections.includes(section.section_id)}
                                  onCheckedChange={() => handleCourseSectionToggle(section.section_id)}
                                />
                                <label
                                  htmlFor={section.section_id}
                                  className="text-xs cursor-pointer flex-1"
                                >
                                  {section.section_name}
                                </label>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Main chat area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col" data-testid="chat-area">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center justify-between">
                  <span>Conversation avec l'IA</span>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    {currentSessionId ? `Session active (${currentSessionId.slice(0, 8)}...)` : "Aucune session"}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages area */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full w-full">
                    <div className="p-4 space-y-4">
                    {/* Welcome message */}
                    {!currentSessionId && (
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
                            Je suis votre assistant IA spécialisé en médecine. Sélectionnez votre contexte et créez une nouvelle session pour commencer.
                          </p>
                          <div className="text-sm text-foreground mt-2">
                            <p className="font-medium mb-1">Capacités :</p>
                            <ul className="space-y-1 list-disc list-inside ml-2">
                              <li>Physiopathologie et mécanismes</li>
                              <li>Diagnostic et examens</li>
                              <li>Traitements et thérapeutiques</li>
                              <li>Cas cliniques</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Current session messages */}
                    {currentSession?.messages?.map((message: ChatMessageResponse, index: number) => (
                      <div key={message.message_id || index} className="space-y-4">
                        {/* User message */}
                        {message.sender === 'user' && (
                          <div className="flex items-start space-x-3 justify-end">
                            <div className="flex-1 max-w-2xl bg-primary p-4 rounded-lg">
                              <div className="text-sm text-primary-foreground prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                              {message.context && (
                                <div className="mt-2 p-2 bg-primary-foreground/10 rounded text-xs text-primary-foreground/80">
                                  <BookOpen className="w-3 h-3 inline mr-1" />
                                  Contexte: {message.context}
                                </div>
                              )}
                            </div>
                            <Avatar className="w-8 h-8">
                              {user?.profileImageUrl ? (
                                <img 
                                  src={user.profileImageUrl} 
                                  alt="Profile" 
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <AvatarFallback>
                                  <User className="w-4 h-4 text-secondary-foreground" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </div>
                        )}

                        {/* AI response */}
                        {message.sender === 'ai' && (
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8">
                              <img  src="/logo.svg" alt="Synapsyx"
                                  className="w-full h-full object-cover rounded-full"
                                />
                              <AvatarFallback>
                                <Brain className="w-4 h-4 text-primary-foreground" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted p-4 rounded-lg">
                              <div className="text-sm text-foreground prose prose-sm max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                              {message.confidence && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Confiance: {Math.round(message.confidence * 100)}%
                                </div>
                              )}
                              {message.search_metadata && (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-200">
                                  <Search className="w-3 h-3 inline mr-1" />
                                  Recherche RAG activée
                                </div>
                              )}
                              <div className="mt-2 text-xs text-muted-foreground">
                                {formatInTimeZone(new Date(message.timestamp), 'Africa/Tunis', "PPp", { locale: fr })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8 bg-primary">
                          <AvatarFallback>
                            <Brain className="w-4 h-4 text-primary-foreground" />
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
                </div>

                {/* Input area */}
                <div className="flex-shrink-0 border-t p-4 space-y-3">
                  {/* Advanced options toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Options avancées</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    >
                      {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Advanced options */}
                  {showAdvancedOptions && (
                    <div className="space-y-3 p-3 bg-muted rounded-lg">
                      <div>
                        <Textarea
                          placeholder="Contexte optionnel (extrait de cours, cas clinique...)"
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                          className="min-h-[60px] resize-none"
                          data-testid="context-input"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSimilaritySearch}
                          disabled={!message.trim() || similaritySearchMutation.isPending}
                          className="flex items-center"
                        >
                          <Search className="w-4 h-4 mr-1" />
                          Recherche
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Message input */}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Posez votre question médicale..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="flex-1"
                      disabled={sendMessageMutation.isPending || !currentSessionId}
                      data-testid="message-input"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMessageMutation.isPending || !currentSessionId}
                      data-testid="send-button"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Session status */}
                  {!currentSessionId && (
                    <div className="flex items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        Sélectionnez votre contexte et créez une nouvelle session pour commencer à discuter avec l'IA
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