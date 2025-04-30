import { useQuery } from "@tanstack/react-query";
import TeacherCard from "@/components/teachers/teacher-card";
import { Teacher } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedTeachers = () => {
  const { data: teachers, isLoading, error } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers/featured"],
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="slide-in mb-16">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex flex-col items-center space-y-3 p-5">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="slide-in mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Teachers</h2>
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          <p>Error loading featured teachers. Please try again later.</p>
        </div>
      </section>
    );
  }

  if (!teachers || teachers.length === 0) {
    return (
      <section className="slide-in mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Teachers</h2>
        <div className="bg-blue-50 p-4 rounded-md text-blue-600 text-center">
          <p>No featured teachers at the moment. Check back soon!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="slide-in mb-16">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Teachers</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {teachers.map((teacher) => (
          <TeacherCard key={teacher.id} teacher={teacher} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedTeachers;
