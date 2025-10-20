import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Brain, 
  TrendingUp, 
  Users, 
  Award, 
  Clock 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <img
                src="/logo.svg"
                alt="logo"
                className="w-5 h-5 text-primary-foreground"
              />
              </div>
              <span className="ml-3 text-xl font-bold text-foreground">SynapsyX</span>
              <span className="ml-1 text-sm text-muted-foreground">AI</span>
            </div>
            <Button 
              onClick={() => auth.signinRedirect()}
              data-testid="login-button"
            >
              Se Connecter
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="hero-title">
            Réussir l'externat avec l'IA
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90" data-testid="hero-subtitle">
            Plateforme d'éducation médicale intelligente pour les étudiants tunisiens
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild data-testid="get-started-button">
              <a href="/api/login">Commencer Maintenant</a>
            </Button>
            <Button size="lg" variant="outline" className="text-accent border-white hover:bg-white hover:text-primary">
              En Savoir Plus
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Fonctionnalités Innovantes
            </h2>
            <p className="text-lg text-muted-foreground">
              Découvrez comment notre plateforme révolutionne l'apprentissage médical
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>IA Tuteur Personnel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Obtenez des réponses instantanées et des explications détaillées avec notre IA spécialisée en médecine
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Cours Structurés</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Accédez aux cours organisés par spécialité, université et année pour une préparation optimale
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>Suivi de Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Suivez vos performances et comparez-vous anonymement avec vos pairs
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Banque de Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Entraînez-vous avec des milliers de questions des années précédentes
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Examens Blancs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Simulez les conditions réelles de l'ECN avec nos examens blancs chronométrés
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>Planification Intelligente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Organisez vos révisions avec notre système de planification basé sur la répétition espacée
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Universities */}
      <section className="py-20 bg-muted/50" data-testid="universities-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Couvre Toutes les Facultés Tunisiennes (Bientôt)
            </h2>
            <p className="text-lg text-muted-foreground">
              Contenu adapté aux programmes de toutes les facultés de médecine de Tunisie
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">F.M.Tunis</span>
              </div>
              <h3 className="font-semibold">Faculté de Médecine de Tunis</h3>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent">F.M.Sousse</span>
              </div>
              <h3 className="font-semibold">Faculté de Médecine de Sousse</h3>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">F.M.Monastir</span>
              </div>
              <h3 className="font-semibold">Faculté de Médecine de Monastir</h3>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-accent">F.M.Sfax</span>
              </div>
              <h3 className="font-semibold">Faculté de Médecine de Sfax</h3>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Prêt à Réussir l'ECN ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Rejoignez des milliers d'étudiants qui ont déjà choisi SynapsyX AI pour leur réussite
          </p>
          <Button size="lg" asChild data-testid="final-cta-button">
            <a href="/api/login">Commencer Gratuitement</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <img
                  src="/logo.svg"
                  alt="logo"
                  className="w-4 h-4 text-primary-foreground"
                />
              </div>
              <span className="ml-2 font-semibold">SynapsyX AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 SynapsyX AI. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
