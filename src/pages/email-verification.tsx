import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { authenticatedApiRequest } from "@/lib/queryClient";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  verified: boolean;
  authProvider: string;
}

export default function EmailVerification() {
  const { toast } = useToast();
  const [resendCooldown, setResendCooldown] = useState(0);

  // Fetch user profile to check verification status
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/auth/user");
      return response.json() as Promise<UserProfile>;
    },
    refetchInterval: 5000, // Check every 5 seconds for verification status
  });

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedApiRequest("POST", "/api/auth/resend-verification");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email envoyé",
        description: "Un nouvel email de vérification a été envoyé à votre adresse email.",
      });
      setResendCooldown(60); // 60 seconds cooldown
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de l'email.",
        variant: "destructive",
      });
    },
  });

  // Handle resend verification
  const handleResendVerification = () => {
    if (resendCooldown > 0) return;
    resendVerificationMutation.mutate();
  };

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Check if user is verified and redirect if needed
  useEffect(() => {
    if (user && user.verified) {
      // User is verified, redirect to home
      window.location.href = "/";
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Impossible de charger les informations utilisateur.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Vérification de l'email</h1>
          <p className="text-muted-foreground mt-2">
            Vérifiez votre adresse email pour accéder à votre compte
          </p>
        </div>

        {/* Verification Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {user.verified ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Email vérifié
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Email non vérifié
                </>
              )}
            </CardTitle>
            <CardDescription>
              {user.verified 
                ? "Votre email a été vérifié avec succès. Vous allez être redirigé."
                : "Un email de vérification a été envoyé à votre adresse email."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Email de vérification envoyé à :</p>
              <p className="font-medium">{user.email}</p>
            </div>

            {!user.verified && (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Instructions :</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Vérifiez votre boîte de réception</li>
                      <li>• Cliquez sur le lien de vérification dans l'email</li>
                      <li>• Si vous ne trouvez pas l'email, vérifiez vos spams</li>
                      <li>• Cette page se mettra à jour automatiquement une fois vérifié</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0 || resendVerificationMutation.isPending}
                    className="flex-1"
                  >
                    {resendVerificationMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Renvoyer dans {resendCooldown}s
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Renvoyer l'email
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className="flex-1"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualiser
                  </Button>
                </div>
              </div>
            )}

            {user.verified && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Votre email a été vérifié avec succès ! Vous allez être redirigé vers l'application.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Besoin d'aide ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Si vous rencontrez des problèmes avec la vérification de votre email :</p>
              <ul className="space-y-1 ml-4">
                <li>• Vérifiez que l'adresse email est correcte</li>
                <li>• Attendez quelques minutes pour recevoir l'email</li>
                <li>• Vérifiez votre dossier spam/courrier indésirable</li>
                <li>• Contactez le support si le problème persiste</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
