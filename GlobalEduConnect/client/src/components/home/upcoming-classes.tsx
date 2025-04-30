import { useQuery } from "@tanstack/react-query";
import ClassCard from "@/components/classes/class-card";
import { Class } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

const UpcomingClasses = () => {
  const { toast } = useToast();

  const { data: classes, isLoading, error } = useQuery<Class[]>({
    queryKey: ["/api/classes/upcoming"],
  });

  const handleJoinClass = async (classId: string) => {
    try {
      // Join class logic will be implemented here
      toast({
        title: "Class joined",
        description: "You have successfully joined this class",
      });
    } catch (error) {
      toast({
        title: "Failed to join class",
        description: "There was an error joining this class. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="slide-in mt-12 mb-16">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex flex-col space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="slide-in mt-12 mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Upcoming Classes</h2>
          <Link href="/classes">
            <a className="text-primary hover:underline flex items-center">
              View All <span className="material-icons ml-1 text-sm">arrow_forward</span>
            </a>
          </Link>
        </div>
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          <p>Error loading upcoming classes. Please try again later.</p>
        </div>
      </section>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <section className="slide-in mt-12 mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Upcoming Classes</h2>
          <Link href="/classes">
            <a className="text-primary hover:underline flex items-center">
              View All <span className="material-icons ml-1 text-sm">arrow_forward</span>
            </a>
          </Link>
        </div>
        <div className="bg-blue-50 p-4 rounded-md text-blue-600 text-center">
          <p>No upcoming classes at the moment. Check back soon!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="slide-in mt-12 mb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Upcoming Classes</h2>
        <Link href="/classes">
          <a className="text-primary hover:underline flex items-center">
            View All <span className="material-icons ml-1 text-sm">arrow_forward</span>
          </a>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.slice(0, 3).map((classItem) => (
          <ClassCard 
            key={classItem.id} 
            classData={classItem} 
            onJoin={handleJoinClass} 
          />
        ))}
      </div>
    </section>
  );
};

export default UpcomingClasses;
