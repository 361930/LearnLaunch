import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Class, TeacherProfile, User, ClassRating } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Calendar, Clock, Globe, BookOpen, Users, Video, Loader2, DollarSign, GraduationCap } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

  // Fetch class details
  const { data: classData, isLoading } = useQuery<Class & { teacher: User & { teacherProfile: TeacherProfile } }, Error>({
    queryKey: [`/api/classes/${id}`],
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load class details. The class might not exist.",
        variant: "destructive",
      });
      navigate("/classes");
    },
  });

  // Fetch class ratings
  const { data: ratings = [] } = useQuery<ClassRating[], Error>({
    queryKey: [`/api/classes/${id}/ratings`],
    enabled: !!id,
  });

  // Check enrollment status
  const { data: enrollmentStatus } = useQuery<{ enrolled: boolean }>({
    queryKey: [`/api/classes/${id}/enrollment-status`],
    enabled: !!user && !!id,
  });

  // Enroll in class mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/classes/${id}/enroll`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${id}/enrollment-status`] });
      toast({
        title: "Success",
        description: "You have successfully enrolled in this class.",
      });
      setIsEnrollDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit rating mutation
  const ratingMutation = useMutation({
    mutationFn: async (data: { rating: number; review: string }) => {
      await apiRequest("POST", `/api/classes/${id}/rate`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${id}/ratings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${id}`] });
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
      setRating(null);
      setReview("");
    },
    onError: (error: Error) => {
      toast({
        title: "Rating Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEnroll = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to enroll in this class.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (user.role !== "student") {
      toast({
        title: "Student Role Required",
        description: "Only students can enroll in classes.",
        variant: "destructive",
      });
      return;
    }

    enrollMutation.mutate();
  };

  const handleRatingSubmit = () => {
    if (!rating) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    ratingMutation.mutate({ rating, review });
  };

  // Format date
  const formatDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return "Flexible Schedule";
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  if (isLoading || !classData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Calculate average rating from ratings array
  const avgRating = ratings.length > 0
    ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
    : 0;

  const renderStars = (count: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-5 w-5 ${i < count ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Class Title & Basic Info */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">{classData.title}</h1>
                
                <div className="flex flex-wrap gap-3 my-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {classData.startTime ? formatDateTime(classData.startTime) : "Flexible Schedule"}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {classData.isLive ? "Live Class" : "Recorded Class"}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 mr-1" />
                    Language: {classData.language}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Level: {classData.level}
                  </div>
                  {classData.maxAttendees && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      Max Attendees: {classData.maxAttendees}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center my-2">
                  <div className="flex mr-2">
                    {renderStars(Math.round(classData.avgRating))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {classData.avgRating.toFixed(1)} ({classData.totalRatings} ratings)
                  </span>
                </div>
              </div>
              
              {/* Class Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="teacher">Teacher</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                {/* Description Tab */}
                <TabsContent value="description" className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="prose dark:prose-invert max-w-none">
                        <p>{classData.description}</p>
                      </div>
                      
                      <Accordion type="single" collapsible className="mt-6">
                        <AccordionItem value="what-will-learn">
                          <AccordionTrigger>What you'll learn</AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Core concepts and fundamentals of the subject</li>
                              <li>Practical applications and real-world examples</li>
                              <li>Advanced techniques and problem-solving strategies</li>
                              <li>Critical thinking and analytical skills</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="prerequisites">
                          <AccordionTrigger>Prerequisites</AccordionTrigger>
                          <AccordionContent>
                            <p>
                              This class is suitable for students with {classData.level.toLowerCase()} knowledge of the subject. 
                              Basic understanding of related concepts is helpful but not required.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="materials">
                          <AccordionTrigger>Course Materials</AccordionTrigger>
                          <AccordionContent>
                            <p>
                              All course materials will be provided after enrollment. 
                              {classData.isLive ? " Make sure you have a reliable internet connection for live sessions." : 
                                " You can access recorded lectures at your own pace."}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Teacher Tab */}
                <TabsContent value="teacher">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={classData.teacher.profileImage} alt={classData.teacher.name} />
                          <AvatarFallback>
                            {classData.teacher.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="text-xl font-semibold">{classData.teacher.name}</h3>
                          <div className="flex items-center mt-1">
                            <div className="flex mr-2">
                              {renderStars(Math.round(classData.teacher.teacherProfile.avgRating))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {classData.teacher.teacherProfile.avgRating.toFixed(1)} 
                              ({classData.teacher.teacherProfile.totalRatings} ratings)
                            </span>
                          </div>
                          <p className="text-sm mt-1">
                            <span className="font-medium">Expertise: </span>
                            {classData.teacher.teacherProfile.expertise}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-3">
                        <h4 className="font-medium">About the Teacher</h4>
                        <p>{classData.teacher.teacherProfile.bio}</p>
                        
                        {classData.teacher.teacherProfile.demoVideoUrl && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Demo Video</h4>
                            <div className="relative pt-[56.25%] bg-muted rounded-lg overflow-hidden">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Video className="h-12 w-12 text-muted-foreground/50" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Reviews Tab */}
                <TabsContent value="reviews">
                  <Card>
                    <CardContent className="pt-6 space-y-6">
                      {/* Review Summary */}
                      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between mb-6">
                        <div className="flex flex-col items-center">
                          <div className="text-4xl font-bold">{classData.avgRating.toFixed(1)}</div>
                          <div className="flex my-1">
                            {renderStars(Math.round(classData.avgRating))}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {classData.totalRatings} ratings
                          </div>
                        </div>
                        
                        {/* Add Review Button */}
                        {user && user.role === "student" && enrollmentStatus?.enrolled && (
                          <div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button>Write a Review</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rate this Class</DialogTitle>
                                  <DialogDescription>
                                    Share your experience with other students
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4 py-4">
                                  <div className="flex justify-center">
                                    <div className="flex gap-1">
                                      {Array(5).fill(0).map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`h-8 w-8 cursor-pointer ${
                                            i < (rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                          }`}
                                          onClick={() => setRating(i + 1)}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Textarea
                                      placeholder="Share your experience with this class..."
                                      value={review}
                                      onChange={(e) => setReview(e.target.value)}
                                      rows={5}
                                    />
                                  </div>
                                </div>
                                
                                <DialogFooter>
                                  <Button 
                                    onClick={handleRatingSubmit}
                                    disabled={ratingMutation.isPending}
                                  >
                                    {ratingMutation.isPending ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting
                                      </>
                                    ) : "Submit Review"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                      
                      {/* Review List */}
                      <div className="space-y-6">
                        {ratings.length > 0 ? (
                          ratings.map((rating) => (
                            <div key={rating.id} className="border-b pb-4 last:border-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback>U</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">Student</span>
                                </div>
                                <div className="flex">
                                  {renderStars(rating.rating)}
                                </div>
                              </div>
                              
                              {rating.review && (
                                <p className="mt-2 text-muted-foreground">{rating.review}</p>
                              )}
                              
                              <div className="mt-2 text-xs text-muted-foreground">
                                {new Date(rating.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-muted-foreground">No reviews yet.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Enrollment Card */}
              <Card className="overflow-hidden">
                <div className="h-48 bg-primary/10 flex items-center justify-center">
                  {classData.thumbnail ? (
                    <img 
                      src={classData.thumbnail} 
                      alt={classData.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-primary/40" />
                  )}
                </div>
                
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    {classData.price ? (
                      <div className="text-2xl font-bold flex items-center">
                        <DollarSign className="h-5 w-5" />
                        {classData.price}
                        <span className="text-sm font-normal ml-1">
                          {classData.currency || "USD"}
                        </span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                        Free
                      </div>
                    )}
                    
                    {classData.isLive && classData.startTime && (
                      <div className="text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full">
                        Starts Soon
                      </div>
                    )}
                  </div>
                  
                  {user && enrollmentStatus?.enrolled ? (
                    <Button className="w-full" disabled>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Already Enrolled
                    </Button>
                  ) : (
                    <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          Enroll Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Enroll in {classData.title}</DialogTitle>
                          <DialogDescription>
                            You're about to enroll in this class. 
                            {classData.price ? ` The fee is ${classData.price} ${classData.currency || "USD"}.` : " This class is free."}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4">
                          <p>
                            {classData.isLive ? 
                              "This is a live class. Make sure you can attend at the scheduled time." : 
                              "This is a recorded class. You can watch the content at your own pace."
                            }
                          </p>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEnrollDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleEnroll}
                            disabled={enrollMutation.isPending}
                          >
                            {enrollMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing
                              </>
                            ) : "Confirm Enrollment"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    {classData.maxAttendees ? `${classData.maxAttendees} spots available` : "Unlimited spots"}
                  </div>
                  
                  {/* Share Button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Share Class
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.href)}>
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Share on Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Share on Facebook
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
              
              {/* Teacher Card (Small) */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={classData.teacher.profileImage} alt={classData.teacher.name} />
                      <AvatarFallback>{classData.teacher.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{classData.teacher.name}</h3>
                      <p className="text-sm text-muted-foreground">{classData.teacher.teacherProfile.level} Teacher</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4"
                    onClick={() => setActiveTab("teacher")}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}