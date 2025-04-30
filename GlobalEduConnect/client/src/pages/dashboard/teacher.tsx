import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { TeacherProfile, Class } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BookOpen, 
  User, 
  Settings, 
  BarChart, 
  GraduationCap, 
  Calendar, 
  Star,
  FileText,
  Loader2,
  DollarSign,
  Plus,
  Pencil,
  Users,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Form schema for creating a new class
const createClassSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  language: z.string().min(1, "Please select a language"),
  level: z.string().min(1, "Please select a difficulty level"),
  isLive: z.boolean().default(false),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxAttendees: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  price: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  currency: z.string().default("USD"),
});

type CreateClassValues = z.infer<typeof createClassSchema>;

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("classes");
  const [isCreateClassDialogOpen, setIsCreateClassDialogOpen] = useState(false);

  // Fetch teacher profile
  const { data: teacherProfile, isLoading: isProfileLoading } = useQuery<TeacherProfile>({
    queryKey: ["/api/teacher-profile"],
    enabled: !!user && user.role === "teacher",
  });

  // Fetch teacher's classes
  const { data: teacherClasses = [], isLoading: isClassesLoading } = useQuery<Class[]>({
    queryKey: ["/api/teacher/classes"],
    enabled: !!user && user.role === "teacher",
  });

  // Create class form
  const form = useForm<CreateClassValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      language: "",
      level: "",
      isLive: false,
      startTime: "",
      endTime: "",
      currency: "USD",
    },
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: async (data: CreateClassValues) => {
      await apiRequest("POST", "/api/classes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/classes"] });
      toast({
        title: "Success",
        description: "Your class has been created successfully",
      });
      setIsCreateClassDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      });
    },
  });

  const onSubmitClass = (data: CreateClassValues) => {
    createClassMutation.mutate(data);
  };

  if (!user || user.role !== "teacher") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="mb-6">You need to be logged in as a teacher to access this page.</p>
            <Button asChild>
              <Link href="/auth">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isProfileLoading || isClassesLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Calculate stats
  const activeClasses = teacherClasses.filter(c => c.isLive || (c.startTime && new Date(c.startTime) > new Date()));
  const completedClasses = teacherClasses.filter(c => c.endTime && new Date(c.endTime) < new Date());
  const totalStudents = teacherClasses.reduce((acc, curr) => acc + (curr.maxAttendees || 0), 0);
  const totalEarnings = teacherClasses.reduce((acc, curr) => acc + (curr.price || 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container max-w-7xl">
          {/* Dashboard Header */}
          <div className="grid gap-6 md:grid-cols-[1fr_3fr] items-start mb-8">
            {/* Profile Card */}
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-2">
                  <AvatarImage 
                    src={user.profileImage} 
                    alt={user.name} 
                  />
                  <AvatarFallback className="text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>Teacher Profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Expertise: </span>
                    {teacherProfile?.expertise}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Level: </span>
                    {teacherProfile?.level}
                  </p>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="flex mr-2">
                    {Array(5).fill(0).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.round(teacherProfile?.avgRating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {teacherProfile?.avgRating?.toFixed(1) || "0.0"} ({teacherProfile?.totalRatings || 0} ratings)
                  </span>
                </div>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    View Public Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Classes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {activeClasses.length}
                  </div>
                  <GraduationCap className="absolute right-4 top-4 h-6 w-6 text-muted-foreground/30" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalStudents}
                  </div>
                  <Users className="absolute right-4 top-4 h-6 w-6 text-muted-foreground/30" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed Classes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {completedClasses.length}
                  </div>
                  <FileText className="absolute right-4 top-4 h-6 w-6 text-muted-foreground/30" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center">
                    <DollarSign className="h-5 w-5" />
                    {totalEarnings.toFixed(2)}
                  </div>
                  <BarChart className="absolute right-4 top-4 h-6 w-6 text-muted-foreground/30" />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Dashboard Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="flex justify-between items-center">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="classes">My Classes</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
              </TabsList>
              
              <Dialog open={isCreateClassDialogOpen} onOpenChange={setIsCreateClassDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create a New Class</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new class. Students will be able to enroll once it's published.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitClass)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Class Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter a descriptive title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Description */}
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe what students will learn"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Category */}
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
                                  <SelectItem value="arts">Arts</SelectItem>
                                  <SelectItem value="technology">Technology</SelectItem>
                                  <SelectItem value="business">Business</SelectItem>
                                  <SelectItem value="humanities">Humanities</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Language */}
                        <FormField
                          control={form.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Language</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="english">English</SelectItem>
                                  <SelectItem value="spanish">Spanish</SelectItem>
                                  <SelectItem value="french">French</SelectItem>
                                  <SelectItem value="german">German</SelectItem>
                                  <SelectItem value="chinese">Chinese</SelectItem>
                                  <SelectItem value="japanese">Japanese</SelectItem>
                                  <SelectItem value="arabic">Arabic</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Level */}
                        <FormField
                          control={form.control}
                          name="level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Difficulty Level</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
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
                        
                        {/* Live Class */}
                        <FormField
                          control={form.control}
                          name="isLive"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  This is a live class
                                </FormLabel>
                              </div>
                              <FormDescription className="pl-6">
                                If checked, students will join at a scheduled time
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Price */}
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Price (leave empty for free class)</FormLabel>
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Conditional fields for live class */}
                      {form.watch("isLive") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/40">
                          <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date & Time</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date & Time</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="maxAttendees"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Maximum Attendees</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="No limit"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Leave empty for unlimited
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateClassDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createClassMutation.isPending}
                        >
                          {createClassMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : "Create Class"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Classes Tab */}
            <TabsContent value="classes" className="space-y-6">
              {teacherClasses.length > 0 ? (
                <div className="space-y-6">
                  {/* Active Classes */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Active Classes</h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {activeClasses.map((classItem) => (
                        <Card key={classItem.id} className="overflow-hidden flex flex-col">
                          <div className="h-40 bg-primary/10 flex items-center justify-center">
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
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex justify-between items-start">
                              <span className="truncate">{classItem.title}</span>
                              {classItem.isLive && (
                                <span className="text-xs font-normal bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                                  Live
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription>
                              {classItem.category} • {classItem.level}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2 flex-grow">
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {classItem.description}
                            </p>
                            {classItem.startTime && (
                              <div className="mt-2 text-xs text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(classItem.startTime).toLocaleString()}
                              </div>
                            )}
                            <div className="mt-2 text-xs text-muted-foreground flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {classItem.maxAttendees 
                                ? `${Math.floor(Math.random() * classItem.maxAttendees)} / ${classItem.maxAttendees} enrolled` 
                                : "Unlimited enrollment"}
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2 border-t">
                            <div className="text-sm">
                              {classItem.price 
                                ? `$${classItem.price} ${classItem.currency}` 
                                : <span className="text-green-600 dark:text-green-500">Free</span>}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <span>Manage</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/classes/${classItem.id}`}>
                                    View Class
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Link href={`/classes/${classItem.id}/edit`}>
                                    Edit Class
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Link href={`/classes/${classItem.id}/students`}>
                                    View Students
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">
                                  Cancel Class
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  {/* Completed Classes */}
                  {completedClasses.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Completed Classes</h3>
                      <div className="space-y-4">
                        {completedClasses.map((classItem) => (
                          <Card key={classItem.id}>
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="h-16 w-16 flex-shrink-0 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
                                  {classItem.thumbnail ? (
                                    <img 
                                      src={classItem.thumbnail} 
                                      alt={classItem.title} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <BookOpen className="h-8 w-8 text-primary/40" />
                                  )}
                                </div>
                                
                                <div className="flex-grow">
                                  <h4 className="font-medium">{classItem.title}</h4>
                                  <div className="flex items-center mt-1">
                                    <div className="flex mr-2">
                                      {Array(5).fill(0).map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`h-4 w-4 ${i < Math.round(classItem.avgRating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {classItem.avgRating.toFixed(1)} ({classItem.totalRatings} ratings)
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col md:items-end">
                                  <div className="text-sm font-medium">
                                    {classItem.price 
                                      ? `$${classItem.price} ${classItem.currency}` 
                                      : <span className="text-green-600 dark:text-green-500">Free</span>}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {classItem.endTime 
                                      ? `Completed on ${new Date(classItem.endTime).toLocaleDateString()}` 
                                      : "Completed"}
                                  </div>
                                </div>
                                
                                <div>
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/classes/${classItem.id}`}>
                                      View Details
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="bg-muted/40">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Classes Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      You haven't created any classes yet. Start sharing your knowledge with students around the world by creating your first class.
                    </p>
                    <Button onClick={() => setIsCreateClassDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Class
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Students</CardTitle>
                  <CardDescription>Manage students enrolled in your classes</CardDescription>
                </CardHeader>
                <CardContent>
                  {teacherClasses.length > 0 ? (
                    <div className="space-y-8">
                      {teacherClasses.map((classItem) => (
                        <div key={classItem.id} className="space-y-4">
                          <h3 className="font-medium text-lg">{classItem.title}</h3>
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted px-4 py-2 font-medium text-sm flex items-center">
                              <div className="w-8">#</div>
                              <div className="flex-1">Student</div>
                              <div className="w-24 text-center">Enrollment Date</div>
                              <div className="w-24 text-center">Progress</div>
                              <div className="w-20"></div>
                            </div>
                            
                            <div className="divide-y">
                              {/* This would normally come from API but we're mocking for now */}
                              {Array.from({ length: Math.floor(Math.random() * 5) + 1 }).map((_, i) => (
                                <div key={i} className="px-4 py-3 flex items-center">
                                  <div className="w-8 text-muted-foreground">{i+1}</div>
                                  <div className="flex-1 flex items-center">
                                    <Avatar className="h-8 w-8 mr-2">
                                      <AvatarFallback>S{i+1}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">Student {i+1}</div>
                                      <div className="text-xs text-muted-foreground">student{i+1}@example.com</div>
                                    </div>
                                  </div>
                                  <div className="w-24 text-center text-sm">
                                    {new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                  </div>
                                  <div className="w-24 text-center">
                                    <div className="text-xs mb-1">
                                      {Math.floor(Math.random() * 100)}%
                                    </div>
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-primary" 
                                        style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                  <div className="w-20 text-right">
                                    <Button variant="ghost" size="sm">
                                      Message
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground mb-4">
                        You have no students yet. Create a class to start teaching.
                      </p>
                      <Button onClick={() => setIsCreateClassDialogOpen(true)}>
                        Create a Class
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Earnings Tab */}
            <TabsContent value="earnings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Overview</CardTitle>
                  <CardDescription>Track your earnings from classes and donations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-8">
                    <div className="space-y-4">
                      <h3 className="font-medium">Earnings Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground mb-2">
                              Total Earnings
                            </div>
                            <div className="text-2xl font-bold flex items-center">
                              <DollarSign className="h-5 w-5" />
                              {totalEarnings.toFixed(2)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground mb-2">
                              This Month
                            </div>
                            <div className="text-2xl font-bold flex items-center">
                              <DollarSign className="h-5 w-5" />
                              {(totalEarnings * 0.4).toFixed(2)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground mb-2">
                              Donations
                            </div>
                            <div className="text-2xl font-bold flex items-center">
                              <DollarSign className="h-5 w-5" />
                              {(totalEarnings * 0.15).toFixed(2)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Recent Transactions</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted px-4 py-2 font-medium text-sm flex items-center">
                          <div className="w-32">Date</div>
                          <div className="flex-1">Description</div>
                          <div className="w-24 text-right">Amount</div>
                        </div>
                        
                        <div className="divide-y">
                          {teacherClasses.slice(0, 5).map((classItem, i) => (
                            <div key={i} className="px-4 py-3 flex items-center">
                              <div className="w-32 text-sm">
                                {new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{classItem.title}</div>
                                <div className="text-xs text-muted-foreground">Class Enrollment</div>
                              </div>
                              <div className="w-24 text-right font-medium">
                                ${classItem.price?.toFixed(2) || "0.00"}
                              </div>
                            </div>
                          ))}
                          
                          {/* Add some donation examples */}
                          <div className="px-4 py-3 flex items-center">
                            <div className="w-32 text-sm">
                              {new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">Anonymous Donation</div>
                              <div className="text-xs text-muted-foreground">Thank you for your great classes!</div>
                            </div>
                            <div className="w-24 text-right font-medium text-green-600 dark:text-green-500">
                              +$15.00
                            </div>
                          </div>
                          
                          <div className="px-4 py-3 flex items-center">
                            <div className="w-32 text-sm">
                              {new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">John D. Donation</div>
                              <div className="text-xs text-muted-foreground">Keep up the good work!</div>
                            </div>
                            <div className="w-24 text-right font-medium text-green-600 dark:text-green-500">
                              +$5.00
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Payment Settings</h3>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">Payment Method</div>
                                <div className="text-sm text-muted-foreground">
                                  Add or update your payment methods
                                </div>
                              </div>
                              <Button variant="outline">
                                Manage
                              </Button>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">Payout Settings</div>
                                <div className="text-sm text-muted-foreground">
                                  Configure how you receive your earnings
                                </div>
                              </div>
                              <Button variant="outline">
                                Configure
                              </Button>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">Tax Information</div>
                                <div className="text-sm text-muted-foreground">
                                  Manage your tax documents and information
                                </div>
                              </div>
                              <Button variant="outline">
                                Update
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}