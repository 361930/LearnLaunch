import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ClassCard from "@/components/classes/class-card";
import { User, Class } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

interface ClassesProps {
  user: User | null;
}

const Classes = ({ user }: ClassesProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [, params] = useLocation();
  const { toast } = useToast();
  
  // Parse URL search params
  const urlParams = new URLSearchParams(params);
  const categoryFromUrl = urlParams.get("category");
  
  // Initialize filters from URL if present
  useState(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  });
  
  const { data: classes, isLoading, error } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const handleJoinClass = async (classId: string) => {
    try {
      if (!user) {
        // If not logged in, show login prompt
        document.dispatchEvent(new CustomEvent("open-login-modal"));
        return;
      }
      
      // Here we would handle the API call to join a class
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
  
  // Filter classes based on search and filters
  const filteredClasses = classes?.filter((classItem) => {
    const matchesSearch = searchTerm 
      ? classItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
      
    const matchesCategory = selectedCategory === "all" 
      ? true 
      : classItem.category === selectedCategory;
      
    const matchesLevel = selectedLevel === "all" 
      ? true 
      : classItem.level.toLowerCase() === selectedLevel;
      
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Classes | GlobalEduConnect</title>
        <meta name="description" content="Browse and join live educational classes from teachers around the world." />
      </Helmet>
      
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <section className="py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Explore Classes</h1>
          
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-1 md:col-span-2">
                <Input
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="computer-science">Computer Science</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="languages">Languages</SelectItem>
                    <SelectItem value="arts">Arts</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={selectedLevel}
                  onValueChange={setSelectedLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Classes List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
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
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-md text-red-600 text-center">
              <p>Error loading classes. Please try again later.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : !filteredClasses || filteredClasses.length === 0 ? (
            <div className="bg-blue-50 p-6 rounded-md text-blue-600 text-center">
              <p>No classes found matching your criteria.</p>
              {(searchTerm || selectedCategory !== "all" || selectedLevel !== "all") && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setSelectedLevel("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classItem) => (
                <ClassCard 
                  key={classItem.id} 
                  classData={classItem} 
                  onJoin={handleJoinClass} 
                />
              ))}
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Classes;
