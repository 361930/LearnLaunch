import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { User } from "@/lib/types";

interface CallToActionProps {
  user: User | null;
}

const CallToAction = ({ user }: CallToActionProps) => {
  const [, navigate] = useLocation();

  const handlePrimaryAction = () => {
    if (user) {
      // If already logged in, go to dashboard
      navigate(
        user.role === "student" 
          ? "/dashboard/student" 
          : user.role === "teacher" 
            ? "/dashboard/teacher" 
            : "/dashboard/admin"
      );
    } else {
      // If not logged in, go to registration
      navigate("/register");
    }
  };

  return (
    <section className="bg-primary text-white rounded-lg shadow-md p-8 mb-16 text-center">
      <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Learning?</h2>
      <p className="text-lg mb-6 max-w-3xl mx-auto">
        Join our global community today and connect with educators and learners from around the world. 
        Access live classes, educational resources, and much more.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button 
          size="lg"
          className="bg-white text-primary hover:bg-gray-100 transition-colors"
          onClick={handlePrimaryAction}
        >
          <span className="flex items-center justify-center">
            <span className="material-icons mr-2">
              {user ? "dashboard" : "person_add"}
            </span>
            {user ? "Go to Dashboard" : "Create Free Account"}
          </span>
        </Button>
        <Button 
          size="lg"
          variant="outline"
          className="bg-transparent border-2 border-white text-white hover:bg-white hover:bg-opacity-10 transition-colors"
          onClick={() => navigate("/about")}
        >
          <span className="flex items-center justify-center">
            <span className="material-icons mr-2">info</span>
            Learn More
          </span>
        </Button>
      </div>
    </section>
  );
};

export default CallToAction;
