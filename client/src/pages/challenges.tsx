import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Challenge } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus,
  Search,
  Filter,
  Award,
  Clock,
  Users,
  Calendar,
  BookOpen,
  Share2,
  Loader2,
  Trophy,
  Tag,
  ArrowUpRight,
  CheckCircle,
  X,
  ArrowRight
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input as DateInput } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Form schema for creating a challenge
const challengeSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "expert"], {
    required_error: "Please select a difficulty level",
  }),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }).refine(date => date > new Date(), {
    message: "End date must be in the future",
  }),
  maxParticipants: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  tags: z.string().transform(val => val.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)),
});

type ChallengeFormValues = z.infer<typeof challengeSchema>;

export default function ChallengesPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [isCreateChallengeDialogOpen, setIsCreateChallengeDialogOpen] = useState(false);
  
  // Get challenges
  const { data: challenges = [], isLoading: isChallengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges", { search: searchQuery, difficulty: difficultyFilter, category: categoryFilter }],
  });

  // Get user's challenges participation
  const { data: myChallenges = [], isLoading: isUserChallengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges/my"],
    enabled: !!user,
  });

  // Create challenge form
  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      difficulty: "beginner",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      tags: "",
    },
  });

  // Create challenge mutation
  const createChallengeMutation = useMutation({
    mutationFn: async (data: ChallengeFormValues) => {
      const res = await apiRequest("POST", "/api/challenges", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Success",
        description: "Your challenge has been created",
      });
      setIsCreateChallengeDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create challenge",
        variant: "destructive",
      });
    },
  });

  // Join challenge mutation
  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      const res = await apiRequest("POST", `/api/challenges/${challengeId}/join`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/my"] });
      toast({
        title: "Success",
        description: "You have joined the challenge",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join challenge",
        variant: "destructive",
      });
    },
  });

  const onSubmitChallenge = (data: ChallengeFormValues) => {
    createChallengeMutation.mutate(data);
  };

  const joinChallenge = (challengeId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to join challenges",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    joinChallengeMutation.mutate(challengeId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is automatically handled by the useQuery hook
    queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
  };

  // Filter challenges based on active tab
  const filteredChallenges = challenges.filter(challenge => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return challenge.isActive;
    if (activeTab === "completed") return !challenge.isActive && new Date(challenge.endDate) < new Date();
    if (activeTab === "upcoming") return challenge.isActive && new Date(challenge.startDate) > new Date();
    return true;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "intermediate":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "advanced":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "expert":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
    const hasJoined = myChallenges.some(c => c.id === challenge.id);
    const isActive = challenge.isActive;
    const isCompleted = !challenge.isActive && new Date(challenge.endDate) < new Date();
    const isUpcoming = challenge.isActive && new Date(challenge.startDate) > new Date();
    
    return (
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
        <div className="h-40 bg-primary/10 flex items-center justify-center relative">
          {challenge.imageUrl ? (
            <img 
              src={challenge.imageUrl} 
              alt={challenge.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <Trophy className="h-16 w-16 text-primary/40" />
          )}
          <div className="absolute top-2 right-2">
            <Badge className={cn("capitalize", getDifficultyColor(challenge.difficulty))}>
              {challenge.difficulty}
            </Badge>
          </div>
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg line-clamp-1">{challenge.title}</CardTitle>
          </div>
          <CardDescription className="flex items-center">
            <span>{challenge.category}</span>
            {isActive && !isUpcoming && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
            {isUpcoming && (
              <Badge variant="outline" className="ml-2">
                Upcoming
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Completed
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-3 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {challenge.description}
          </p>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Starts: {new Date(challenge.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Ends: {new Date(challenge.endDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              <span>{challenge.currentParticipants} participants</span>
            </div>
            <div className="flex items-center">
              <Award className="h-3 w-3 mr-1" />
              <span>{challenge.maxParticipants ? `${challenge.maxParticipants} max` : 'Unlimited'}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {challenge.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {challenge.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{challenge.tags.length - 3} more
              </Badge>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 border-t flex justify-between items-center">
          <div className="flex items-center text-sm">
            {challenge.creator && (
              <>
                <Avatar className="h-5 w-5 mr-1">
                  <AvatarImage src={challenge.creator.profileImage} />
                  <AvatarFallback>{challenge.creator.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">By {challenge.creator.name}</span>
              </>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-2"
              asChild
            >
              <Link href={`/challenges/${challenge.id}`}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            
            {!hasJoined && isActive && (
              <Button 
                size="sm" 
                onClick={() => joinChallenge(challenge.id)}
                disabled={joinChallengeMutation.isPending}
              >
                {joinChallengeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : "Join"}
              </Button>
            )}
            
            {hasJoined && (
              <Button 
                variant="outline" 
                size="sm"
                asChild
              >
                <Link href={`/challenges/${challenge.id}/my-progress`}>
                  Progress
                </Link>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Challenge Board</h1>
              <p className="text-muted-foreground">
                Join educational challenges and compete with learners around the world
              </p>
            </div>
            
            <Dialog open={isCreateChallengeDialogOpen} onOpenChange={setIsCreateChallengeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Challenge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create a New Challenge</DialogTitle>
                  <DialogDescription>
                    Set up a learning challenge for the community to participate in
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitChallenge)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Challenge Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a descriptive title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the challenge, goals, and expected outcomes"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mathematics">Mathematics</SelectItem>
                                <SelectItem value="science">Science</SelectItem>
                                <SelectItem value="languages">Languages</SelectItem>
                                <SelectItem value="programming">Programming</SelectItem>
                                <SelectItem value="arts">Arts</SelectItem>
                                <SelectItem value="music">Music</SelectItem>
                                <SelectItem value="literature">Literature</SelectItem>
                                <SelectItem value="history">History</SelectItem>
                                <SelectItem value="geography">Geography</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty Level</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="maxParticipants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Participants (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Leave empty for unlimited"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty to allow unlimited participants
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="math, problem-solving, equations (comma separated)"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter comma-separated tags to help others find your challenge
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateChallengeDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createChallengeMutation.isPending}
                      >
                        {createChallengeMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : "Create Challenge"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                <TabsTrigger value="all">All Challenges</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="mb-6">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="relative col-span-1 md:col-span-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search challenges..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="languages">Languages</SelectItem>
                  <SelectItem value="programming">Programming</SelectItem>
                  <SelectItem value="arts">Arts</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="literature">Literature</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="geography">Geography</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Difficulties</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </form>
          </div>
          
          {isChallengesLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <Card className="bg-muted/40">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Challenges Found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchQuery || categoryFilter || difficultyFilter ? 
                    "We couldn't find any challenges matching your search criteria. Try adjusting your filters." :
                    "There are no challenges available at the moment. Be the first to create a challenge!"}
                </p>
                <Button onClick={() => setIsCreateChallengeDialogOpen(true)}>
                  Create a Challenge
                </Button>
              </CardContent>
            </Card>
          )}
          
          {user && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">My Challenges</h2>
                <Button variant="outline" asChild>
                  <Link href="/my-challenges">View All</Link>
                </Button>
              </div>
              
              {isUserChallengesLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : myChallenges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {myChallenges.slice(0, 3).map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/40">
                  <CardContent className="py-6 text-center">
                    <p className="text-muted-foreground">
                      You haven't joined any challenges yet. Browse the challenge board to find challenges to participate in.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}