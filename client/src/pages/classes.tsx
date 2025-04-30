import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Class } from "@/lib/types";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { BookOpen, Search, Filter, Loader2 } from "lucide-react";

export default function ClassesPage() {
  // Filter and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Fetch classes with filters
  const { data: classes, isLoading, refetch } = useQuery<Class[]>({
    queryKey: ["/api/classes", { search: searchQuery, category, language, level }],
  });

  // Filter classes based on current filters
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [paginatedClasses, setPaginatedClasses] = useState<Class[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  // Update filtered classes when data changes
  useEffect(() => {
    if (classes) {
      setFilteredClasses(classes);
      setCurrentPage(1);
    }
  }, [classes]);

  // Update pagination
  useEffect(() => {
    if (filteredClasses) {
      const totalItems = filteredClasses.length;
      const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
      setTotalPages(calculatedTotalPages || 1);

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setPaginatedClasses(filteredClasses.slice(startIndex, endIndex));
    }
  }, [filteredClasses, currentPage, itemsPerPage]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    refetch();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategory("");
    setLanguage("");
    setLevel("");
    refetch();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container max-w-7xl">
          <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
            <p className="text-muted-foreground max-w-3xl">
              Browse through our diverse range of global classes taught by experienced educators from around the world. Use the filters to find the perfect class for your learning journey.
            </p>
          </div>
          
          {/* Search and Filters */}
          <div className="mb-8 bg-card border rounded-lg p-4 shadow-sm">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Input
                    placeholder="Search classes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
                
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="languages">Languages</SelectItem>
                    <SelectItem value="arts">Arts</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="humanities">Humanities</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Languages</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="chinese">Chinese</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" type="button" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button type="submit">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </form>
          </div>
          
          {/* Class Listings */}
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : paginatedClasses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedClasses.map((classItem) => (
                  <Card key={classItem.id} className="overflow-hidden flex flex-col h-full">
                    <div className="h-48 bg-primary/10 flex items-center justify-center">
                      {classItem.thumbnail ? (
                        <img 
                          src={classItem.thumbnail} 
                          alt={classItem.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-16 w-16 text-primary/40" />
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle>{classItem.title}</CardTitle>
                      <CardDescription>
                        {classItem.category} • {classItem.level}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="line-clamp-2 text-muted-foreground">
                        {classItem.description}
                      </p>
                      {classItem.startTime && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Starts: </span>
                          {new Date(classItem.startTime).toLocaleString()}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                          {classItem.isLive ? "Live Class" : "Recorded Class"}
                        </span>
                        {classItem.price ? (
                          <span className="font-medium">
                            {classItem.price} {classItem.currency || "USD"}
                          </span>
                        ) : (
                          <span className="font-medium text-green-600 dark:text-green-500">
                            Free
                          </span>
                        )}
                      </div>
                      <Button asChild>
                        <Link href={`/classes/${classItem.id}`}>
                          View Class
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="my-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink
                          onClick={() => setCurrentPage(index + 1)}
                          isActive={currentPage === index + 1}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )).slice(
                      Math.max(0, currentPage - 3),
                      Math.min(totalPages, currentPage + 2)
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground/30" />
              <h3 className="text-lg font-medium">No Classes Found</h3>
              <p className="text-muted-foreground max-w-md">
                We couldn't find any classes matching your search criteria. Try adjusting your filters or check back later.
              </p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}