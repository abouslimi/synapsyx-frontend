import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "./components/app-layout";
import { ProfileGuard } from "./components/profile-guard";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Courses from "@/pages/courses";
import Learn from "@/pages/learn";
import CourseSection from "@/pages/course-section";
// import Practice from "@/pages/practice";
import Organize from "@/pages/organize";
import Statistics from "@/pages/statistics";
import AiTutor from "@/pages/ai-tutor";
import Bibliotheque from "@/pages/library";
import UserProfile from "@/pages/user-profile";
import EmailVerification from "@/pages/email-verification";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <ProfileGuard>
          <Route path="/" component={Home} />
          <Route path="/courses/:type?" component={Courses} />
          <Route path="/courses/:course_id/:course_section_id" component={CourseSection} />
          <Route path="/learn" component={Learn} />
          {/* <Route path="/practice" component={Practice} /> */}
          <Route path="/organize" component={Organize} />
          <Route path="/statistics" component={Statistics} />
          <Route path="/ai-tutor" component={AiTutor} />
          <Route path="/library" component={Bibliotheque} />
          <Route path="/user-profile" component={UserProfile} />
          <Route path="/email-verification" component={EmailVerification} />
          <Route path="/test" component={() => <div className="p-8 text-center"><h1 className="text-2xl font-bold">Examens blancs - Bientôt disponible</h1></div>} />
          <Route path="/blog" component={() => <div className="p-8 text-center"><h1 className="text-2xl font-bold">Blog - Bientôt disponible</h1></div>} />
        </ProfileGuard>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout>
          <Router />
        </AppLayout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
