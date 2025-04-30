import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { User } from "@/lib/types";

interface HeroSectionProps {
  user: User | null;
}

const HeroSection = ({ user }: HeroSectionProps) => {
  const [, navigate] = useLocation();

  return (
    <section className="fade-in py-8 md:py-16 text-center">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
        Connect with Educators and Learners Worldwide
      </h1>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
        Join our global community of students and teachers to access educational resources 
        organized by skill level, participate in live classes, and expand your knowledge.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        {!user ? (
          <>
            <Button 
              size="lg"
              className="bg-primary text-white hover:bg-blue-700 transition-colors"
              onClick={() => navigate("/register?role=student")}
            >
              <span className="flex items-center justify-center">
                <span className="material-icons mr-2">school</span>
                Join as Student
              </span>
            </Button>
            <Button 
              size="lg"
              className="bg-accent text-white hover:bg-gray-600 transition-colors"
              onClick={() => navigate("/register?role=teacher")}
            >
              <span className="flex items-center justify-center">
                <span className="material-icons mr-2">co_present</span>
                Apply as Teacher
              </span>
            </Button>
          </>
        ) : (
          <Button 
            size="lg"
            className="bg-primary text-white hover:bg-blue-700 transition-colors"
            onClick={() => navigate(
              user.role === "student" 
                ? "/dashboard/student" 
                : user.role === "teacher" 
                  ? "/dashboard/teacher" 
                  : "/dashboard/admin"
            )}
          >
            <span className="flex items-center justify-center">
              <span className="material-icons mr-2">dashboard</span>
              Go to Dashboard
            </span>
          </Button>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
