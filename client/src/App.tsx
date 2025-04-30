import { Switch, Route } from "wouter";
import Home from "@/pages/home";
import Classes from "@/pages/classes";
import Register from "@/pages/register";
import StudentDashboard from "@/pages/dashboard/student";
import TeacherDashboard from "@/pages/dashboard/teacher";
import AdminDashboard from "@/pages/dashboard/admin";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";
import { User } from "@/lib/types";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if there's a user session on app load
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={() => <Home user={user} />} />
      <Route path="/classes" component={() => <Classes user={user} />} />
      <Route path="/register" component={() => <Register user={user} />} />
      <Route path="/dashboard/student" component={() => {
        return user && user.role === "student" 
          ? <StudentDashboard user={user} /> 
          : <NotFound />;
      }} />
      <Route path="/dashboard/teacher" component={() => {
        return user && user.role === "teacher" 
          ? <TeacherDashboard user={user} /> 
          : <NotFound />;
      }} />
      <Route path="/dashboard/admin" component={() => {
        return user && user.role === "admin" 
          ? <AdminDashboard user={user} /> 
          : <NotFound />;
      }} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
