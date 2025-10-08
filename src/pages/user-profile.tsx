import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User, Shield, AlertTriangle } from "lucide-react";
import { authenticatedApiRequest } from "@/lib/queryClient";
import { useAuth, useAuthQuery } from "@/hooks/useAuth";
import { useAuth as useOIDCAuth } from "react-oidc-context";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  university?: string;
  cls?: string;
  verified: boolean;
  suspended: boolean;
  subscriptionTier: string;
  createdAt: string;
  updatedAt: string;
}

const UNIVERSITY_OPTIONS = [
  { value: "FMT", label: "Faculté de Médecine de Tunis" },
  { value: "FMS", label: "Faculté de Médecine de Sfax" },
  { value: "FMM", label: "Faculté de Médecine de Monastir" },
  { value: "FMSfax", label: "Faculté de Médecine de Sfax" },
];

const CLASS_OPTIONS = [
  { value: "PCEM1", label: "PCEM1" },
  { value: "PCEM2", label: "PCEM2" },
  { value: "DCEM1", label: "DCEM1" },
  { value: "DCEM2", label: "DCEM2" },
  { value: "DCEM3", label: "DCEM3" },
  { value: "INTERNE", label: "Interne" },
  { value: "AUTRE", label: "Autre" },
];

const DISABLE_REASONS = [
  { value: "temporary_break", label: "Pause temporaire" },
  { value: "privacy_concerns", label: "Préoccupations de confidentialité" },
  { value: "not_useful", label: "L'application ne m'est pas utile" },
  { value: "too_expensive", label: "Trop cher" },
  { value: "technical_issues", label: "Problèmes techniques" },
  { value: "other", label: "Autre" },
];

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const oidcAuth = useOIDCAuth();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    university: "",
    cls: "",
  });

  const [disableReason, setDisableReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  // Fetch user profile
  const { data: user, isLoading: userLoading, error } = useAuthQuery<UserProfile | null>(["https://localhost:3000/api/auth/user"], {
    on401: "throw",
  });

  // Debug logging
  useEffect(() => {
    console.log('User profile query result:', { user, isLoading: userLoading, error });
    console.log('OIDC auth state:', { 
      isAuthenticated: oidcAuth.isAuthenticated, 
      hasUser: !!oidcAuth.user,
      hasToken: !!oidcAuth.user?.access_token,
      tokenPreview: oidcAuth.user?.access_token?.substring(0, 20) + '...'
    });
  }, [user, userLoading, error, oidcAuth.isAuthenticated, oidcAuth.user]);

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        university: user.university || "",
        cls: user.cls || "",
      });
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; phone: string | null; university: string; cls: string }) => {
      const response = await authenticatedApiRequest("PATCH", "https://localhost:3000/api/auth/user", data, oidcAuth.user?.access_token);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://localhost:3000/api/auth/user"] });
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      });
    },
  });

  // Disable account mutation
  const disableAccountMutation = useMutation({
    mutationFn: async (reason: string) => {
      console.log('Making disable account request with reason:', reason);
      
      const response = await authenticatedApiRequest("PATCH", "https://localhost:3000/api/auth/user/disable", { reason }, oidcAuth.user?.access_token);
      
      console.log('Disable account response status:', response.status);
      console.log('Disable account response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Disable account response text:', responseText);
      
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('Invalid response format from server');
      }
    },
    onSuccess: () => {
      toast({
        title: "Compte désactivé",
        description: "Votre compte a été désactivé avec succès. Vous serez redirigé vers la page de connexion.",
      });
      // Redirect to logout after a short delay
      setTimeout(() => {
        window.location.href = "https://localhost:3000/api/logout";
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la désactivation du compte.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // Ensure phone is included even if empty
    const dataToSend = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone, // Send null if empty
      university: formData.university,
      cls: formData.cls,
    };
    console.log('Sending profile update data:', dataToSend);
    updateProfileMutation.mutate(dataToSend);
  };

  const handleDisableAccount = () => {
    const finalReason = disableReason === "other" ? customReason : disableReason;
    console.log('Disabling account with reason:', { disableReason, customReason, finalReason });
    
    if (!finalReason.trim()) {
      toast({
        title: "Raison requise",
        description: "Veuillez sélectionner ou saisir une raison pour désactiver votre compte.",
        variant: "destructive",
      });
      return;
    }
    disableAccountMutation.mutate(finalReason);
  };

  const isFormValid = () => {
    return formData.firstName.trim() && 
           formData.lastName.trim() && 
           formData.university && 
           formData.cls;
  };


  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !userLoading) {
      setLocation("/login");
    }
  }, [isAuthenticated, userLoading, setLocation]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Mon Profil</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos informations personnelles et paramètres de compte
          </p>
        </div>

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Votre prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Votre numéro de téléphone"
                type="tel"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university">Université *</Label>
                <Select
                  value={formData.university}
                  onValueChange={(value) => handleInputChange("university", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre université" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIVERSITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cls">Classe *</Label>
                <Select
                  value={formData.cls}
                  onValueChange={(value) => handleInputChange("cls", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={!isFormValid() || updateProfileMutation.isPending}
                className="min-w-32"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Informations du compte
            </CardTitle>
            <CardDescription>
              Informations sur votre compte et abonnement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-sm">{user?.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Statut de vérification</Label>
                <p className="text-sm">
                  {user?.verified ? (
                    <span className="text-green-600">Vérifié</span>
                  ) : (
                    <span className="text-yellow-600">Non vérifié</span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Abonnement</Label>
                <p className="text-sm capitalize">{user?.subscriptionTier}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Membre depuis</Label>
                <p className="text-sm">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Zone de danger
            </CardTitle>
            <CardDescription>
              Actions irréversibles sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Désactiver le compte</h4>
                <p className="text-sm text-muted-foreground">
                  Désactivez temporairement votre compte. Vous pourrez le réactiver lors de votre prochaine connexion.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={disableAccountMutation.isPending}>
                    {disableAccountMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Désactivation...
                      </>
                    ) : (
                      "Désactiver le compte"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Désactiver votre compte</AlertDialogTitle>
                    <AlertDialogDescription>
                      Veuillez nous indiquer pourquoi vous souhaitez désactiver votre compte. 
                      Cette action vous déconnectera et vous devrez vous reconnecter pour réactiver votre compte.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="disable-reason">Raison de la désactivation *</Label>
                      <Select value={disableReason} onValueChange={setDisableReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une raison" />
                        </SelectTrigger>
                        <SelectContent>
                          {DISABLE_REASONS.map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {disableReason === "other" && (
                      <div className="space-y-2">
                        <Label htmlFor="custom-reason">Précisez votre raison</Label>
                        <Textarea
                          id="custom-reason"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Décrivez votre raison..."
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                      setDisableReason("");
                      setCustomReason("");
                    }}>
                      Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisableAccount}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={!disableReason || (disableReason === "other" && !customReason.trim())}
                    >
                      Désactiver
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
