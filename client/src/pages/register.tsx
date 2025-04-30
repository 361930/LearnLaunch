import { useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import RegisterForm from "@/components/auth/register-form";
import { User } from "@/lib/types";
import { Helmet } from "react-helmet";

interface RegisterProps {
  user: User | null;
}

const Register = ({ user }: RegisterProps) => {
  const [, navigate] = useLocation();
  
  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      const dashboardPath = 
        user.role === "student" 
          ? "/dashboard/student" 
          : user.role === "teacher" 
            ? "/dashboard/teacher" 
            : "/dashboard/admin";
            
      navigate(dashboardPath);
    }
  }, [user, navigate]);
  
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Register | GlobalEduConnect</title>
        <meta name="description" content="Create an account to join our global education community. Connect with teachers and students worldwide." />
      </Helmet>
      
      <Header user={null} />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <RegisterForm />
      </main>
      
      <Footer />
    </div>
  );
};

export default Register;
