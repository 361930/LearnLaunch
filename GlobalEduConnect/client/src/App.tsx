import { Switch, Route } from "wouter";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import { ThemeProvider } from "@/components/theme-provider";

// Page imports
import HomePage from "@/pages/home";
import ClassesPage from "@/pages/classes";
import ClassDetailPage from "@/pages/class-detail";
import AuthPage from "@/pages/auth";
import StudentDashboardPage from "@/pages/dashboard/student";
import TeacherDashboardPage from "@/pages/dashboard/teacher";
import AdminDashboardPage from "@/pages/dashboard/admin";
import ProfilePage from "@/pages/profile";
import NotFoundPage from "@/pages/not-found";
import ChallengesPage from "@/pages/challenges";
import ChallengeDetailPage from "@/pages/challenge-detail";
import SkeletonDemoPage from "@/pages/skeleton-demo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/classes" component={ClassesPage} />
      <Route path="/classes/:id" component={ClassDetailPage} />
      <Route path="/challenges" component={ChallengesPage} />
      <Route path="/challenges/:id" component={ChallengeDetailPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/profile/:id" component={ProfilePage} />
      <Route path="/skeleton-demo" component={SkeletonDemoPage} />
      
      {/* Protected Routes */}
      <ProtectedRoute 
        path="/dashboard/student" 
        component={StudentDashboardPage} 
        roles={["student"]} 
      />
      <ProtectedRoute 
        path="/dashboard/teacher" 
        component={TeacherDashboardPage} 
        roles={["teacher"]} 
      />
      <ProtectedRoute 
        path="/dashboard/admin" 
        component={AdminDashboardPage} 
        roles={["admin"]} 
      />
      
      {/* 404 Route */}
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="globalEduConnect-theme">
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Router />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
