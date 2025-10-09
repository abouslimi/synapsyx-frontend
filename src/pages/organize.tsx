import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/apiConfig";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen, 
  Dumbbell, 
  ClipboardCheck,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { authenticatedApiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

const scheduleSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  scheduledDate: z.date({
    message: "La date est requise",
  }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  type: z.enum(["study", "practice", "exam"]),
  courseId: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

export default function Organize() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: "",
      description: "",
      scheduledDate: new Date(),
      startTime: "",
      endTime: "",
      type: "study",
      courseId: "",
    },
  });

  const { data: schedule } = useQuery({
    queryKey: [API_ENDPOINTS.PROGRESS, { date: selectedDate.toISOString().split('T')[0] }],
    queryFn: async ({ queryKey }) => {
      try {
        const [url, params] = queryKey;
        const response = await fetch(`${url}?date=${(params as any).date}`, {
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
          return [];
        }
        throw error;
      }
    },
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      return await authenticatedApiRequest("POST", API_ENDPOINTS.PROGRESS, {
        ...data,
        scheduledDate: data.scheduledDate.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PROGRESS] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Tâche créée",
        description: "Votre tâche a été ajoutée avec succès",
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
          window.location.href = buildApiUrl(API_ENDPOINTS.LOGIN);
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche",
        variant: "destructive",
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<any> }) => {
      return await authenticatedApiRequest("PATCH", `${API_ENDPOINTS.PROGRESS}/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PROGRESS] });
      toast({
        title: "Tâche mise à jour",
        description: "Votre tâche a été modifiée avec succès",
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
          window.location.href = buildApiUrl(API_ENDPOINTS.LOGIN);
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de modifier la tâche",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    if (editingItem) {
      updateScheduleMutation.mutate({
        id: editingItem.id,
        data: {
          ...data,
          scheduledDate: data.scheduledDate.toISOString(),
        },
      });
      setEditingItem(null);
    } else {
      createScheduleMutation.mutate(data);
    }
  };

  const toggleTaskCompletion = (task: any) => {
    updateScheduleMutation.mutate({
      id: task.id,
      data: { isCompleted: !task.isCompleted },
    });
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "study":
        return <BookOpen className="w-4 h-4" />;
      case "practice":
        return <Dumbbell className="w-4 h-4" />;
      case "exam":
        return <ClipboardCheck className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTaskBadgeColor = (type: string) => {
    switch (type) {
      case "study":
        return "bg-accent text-accent-foreground";
      case "practice":
        return "bg-primary text-primary-foreground";
      case "exam":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const todayTasks = schedule || [];
  const completedTasks = todayTasks.filter((task: any) => task.isCompleted);
  const upcomingTasks = todayTasks.filter((task: any) => !task.isCompleted);

  return (
    <div className="py-6" data-testid="organize-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Organiser</h1>
          <p className="text-lg text-muted-foreground">
            Planifiez vos révisions et suivez vos tâches d'étude
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <Card data-testid="calendar-card">
              <CardHeader>
                <CardTitle>Calendrier</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={fr}
                  className="rounded-md border"
                />
                <div className="mt-4">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" data-testid="add-task-button">
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une tâche
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingItem ? "Modifier la tâche" : "Nouvelle tâche"}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Titre</FormLabel>
                                <FormControl>
                                  <Input placeholder="Titre de la tâche" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Description optionnelle" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="scheduledDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP", { locale: fr })
                                        ) : (
                                          <span>Sélectionner une date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      locale={fr}
                                      disabled={(date) => date < new Date("1900-01-01")}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="startTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Heure début</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="endTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Heure fin</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner le type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="study">Étude</SelectItem>
                                    <SelectItem value="practice">Pratique</SelectItem>
                                    <SelectItem value="exam">Examen</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="courseId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cours (optionnel)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner un cours" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {(courses as any[])?.map((course: any) => (
                                      <SelectItem key={course.id} value={course.id}>
                                        {course.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsAddDialogOpen(false);
                                setEditingItem(null);
                                form.reset();
                              }}
                            >
                              Annuler
                            </Button>
                            <Button
                              type="submit"
                              disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                            >
                              {editingItem ? "Modifier" : "Créer"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks for selected date */}
          <div className="lg:col-span-3 space-y-6">
            <Card data-testid="selected-date-tasks">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Tâches du {format(selectedDate, "PPP", { locale: fr })}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {completedTasks.length}/{todayTasks.length} terminées
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Aucune tâche prévue</h3>
                    <p>Ajoutez des tâches pour organiser votre journée d'étude</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.map((task: any) => (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center p-4 rounded-lg border transition-all",
                          task.isCompleted 
                            ? "bg-muted/50 opacity-75" 
                            : "bg-card hover:shadow-sm"
                        )}
                        data-testid={`task-${task.id}`}
                      >
                        <Checkbox
                          checked={task.isCompleted}
                          onCheckedChange={() => toggleTaskCompletion(task)}
                          className="mr-3"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getTaskIcon(task.type)}
                            <h4 className={cn(
                              "font-medium",
                              task.isCompleted && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </h4>
                            <Badge className={cn("text-xs", getTaskBadgeColor(task.type))}>
                              {task.type === 'study' ? 'Étude' : 
                               task.type === 'practice' ? 'Pratique' : 'Examen'}
                            </Badge>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center text-xs text-muted-foreground space-x-4">
                            {task.startTime && task.endTime && (
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {task.startTime} - {task.endTime}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingItem(task);
                              form.reset({
                                title: task.title,
                                description: task.description || "",
                                scheduledDate: new Date(task.scheduledDate),
                                startTime: task.startTime || "",
                                endTime: task.endTime || "",
                                type: task.type,
                                courseId: task.courseId || "",
                              });
                              setIsAddDialogOpen(true);
                            }}
                            data-testid={`edit-task-${task.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly overview */}
            <Card data-testid="weekly-overview">
              <CardHeader>
                <CardTitle>Aperçu de la semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{upcomingTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Tâches à venir</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{completedTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Tâches terminées</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Progression</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
