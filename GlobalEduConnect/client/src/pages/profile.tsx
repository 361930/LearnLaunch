import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { User, TeacherProfile, StudentProfile, Class, TeacherRating } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star,
  BookOpen,
  Globe,
  Mail,
  Calendar,
  Video,
  Clock,
  Edit,
  Settings,
  Flag,
  Loader2,
  PanelLeft
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DonationDialog } from "@/components/donation-dialog";

export default function ProfilePage() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  
  // If no id is provided, use the current user's id
  const profileId = params.id || (currentUser?.id.toString() || "");
  const isOwnProfile = currentUser && currentUser.id.toString() === profileId;
  
  // Fetch profile data
  const { data: profileUser, isLoading: isUserLoading } = useQuery<User>({
    queryKey: [`/api/users/${profileId}`],
    enabled: !!profileId,
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load user profile. The user might not exist.",
        variant: "destructive",
      });
      navigate("/");
    },
  });
  
  // Fetch teacher profile data if user is a teacher
  const { data: teacherProfile, isLoading: isTeacherProfileLoading } = useQuery<TeacherProfile>({
    queryKey: [`/api/users/${profileId}/teacher-profile`],
    enabled: !!profileId && profileUser?.role === "teacher",
  });
  
  // Fetch student profile data if user is a student
  const { data: studentProfile, isLoading: isStudentProfileLoading } = useQuery<StudentProfile>({
    queryKey: [`/api/users/${profileId}/student-profile`],
    enabled: !!profileId && profileUser?.role === "student",
  });
  
  // Fetch teacher classes if user is a teacher
  const { data: teacherClasses = [], isLoading: isClassesLoading } = useQuery<Class[]>({
    queryKey: [`/api/teachers/${profileId}/classes`],
    enabled: !!profileId && profileUser?.role === "teacher",
  });
  
  // Fetch teacher ratings if user is a teacher
  const { data: teacherRatings = [], isLoading: isRatingsLoading } = useQuery<TeacherRating[]>({
    queryKey: [`/api/teachers/${profileId}/ratings`],
    enabled: !!profileId && profileUser?.role === "teacher",
  });
  
  // Create rating mutation
  const createRatingMutation = useMutation({
    mutationFn: async (data: { rating: number; review?: string; teacherId: number }) => {
      const res = await apiRequest("POST", "/api/teachers/ratings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teachers/${profileId}/ratings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileId}/teacher-profile`] });
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
      setIsRatingDialogOpen(false);
      setRating(0);
      setReviewText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Rating Failed",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    },
  });
  
  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      const res = await apiRequest("POST", "/api/favorites", { teacherId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to Favorites",
        description: `${profileUser?.name} has been added to your favorites.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to favorites",
        variant: "destructive",
      });
    },
  });
  
  const handleRatingSubmit = () => {
    if (!rating) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please login to submit a rating.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (!profileUser || profileUser.role !== "teacher") {
      toast({
        title: "Error",
        description: "Can only rate teacher profiles.",
        variant: "destructive",
      });
      return;
    }
    
    createRatingMutation.mutate({
      rating,
      review: reviewText,
      teacherId: parseInt(profileId)
    });
  };
  
  const addToFavorites = () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please login to add to favorites.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (currentUser.role !== "student") {
      toast({
        title: "Action Restricted",
        description: "Only students can add teachers to favorites.",
        variant: "destructive",
      });
      return;
    }
    
    addToFavoritesMutation.mutate(parseInt(profileId));
  };
  
  const isLoading = isUserLoading || 
    (profileUser?.role === "teacher" && (isTeacherProfileLoading || isClassesLoading || isRatingsLoading)) || 
    (profileUser?.role === "student" && isStudentProfileLoading);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (!profileUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="mb-6">The user you're looking for doesn't exist.</p>
            <Button asChild>
              <a href="/">Go Home</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
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
            {/* Profile Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src={profileUser.profileImage} alt={profileUser.name} />
                    <AvatarFallback className="text-3xl">
                      {profileUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h1 className="text-2xl font-bold">{profileUser.name}</h1>
                  
                  <div className="flex items-center mt-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {profileUser.role}
                    </Badge>
                    {profileUser.status !== "active" && (
                      <Badge variant="secondary" className="ml-2 text-xs capitalize">
                        {profileUser.status}
                      </Badge>
                    )}
                  </div>
                  
                  {profileUser.role === "teacher" && teacherProfile && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-center">
                        {renderStars(Math.round(teacherProfile.avgRating))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {teacherProfile.avgRating.toFixed(1)} ({teacherProfile.totalRatings} ratings)
                      </p>
                      <p className="font-medium">{teacherProfile.expertise}</p>
                      <Badge>{teacherProfile.level}</Badge>
                    </div>
                  )}
                  
                  <div className="w-full mt-6 space-y-4">
                    {isOwnProfile ? (
                      <Button className="w-full" asChild>
                        <a href="/profile/edit">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </a>
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button className="w-full" asChild>
                          <a href={`/messages/${profileUser.id}`}>
                            <Mail className="mr-2 h-4 w-4" />
                            Message
                          </a>
                        </Button>
                        
                        {profileUser.role === "teacher" && (
                          <>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => setIsRatingDialogOpen(true)}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Rate Teacher
                            </Button>
                            
                            {currentUser?.role === "student" && (
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={addToFavorites}
                              >
                                <BookOpen className="mr-2 h-4 w-4" />
                                Add to Favorites
                              </Button>
                            )}
                            
                            {teacherProfile?.donationEnabled && (
                              <DonationDialog 
                                receiverId={profileUser.id} 
                                receiverName={profileUser.name} 
                              />
                            )}
                          </>
                        )}
                        
                        <Button variant="ghost" className="w-full">
                          <Flag className="mr-2 h-4 w-4" />
                          Report User
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {isOwnProfile || profileUser.privacySettings === "public" ? (
                      <span>{profileUser.email}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        Hidden by privacy settings
                      </span>
                    )}
                  </div>
                  
                  {profileUser.timezone && (
                    <div className="flex items-center text-sm">
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{profileUser.timezone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      Joined {new Date(profileUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {profileUser.lastLoginAt && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        Last active {new Date(profileUser.lastLoginAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {profileUser.preferredLanguage && (
                    <div className="flex items-center text-sm">
                      <PanelLeft className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        Speaks {profileUser.preferredLanguage}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Profile Content */}
            <div className="md:col-span-2 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="about">About</TabsTrigger>
                  {profileUser.role === "teacher" && (
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                  )}
                  {profileUser.role === "teacher" && (
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  )}
                </TabsList>
                
                {/* About Tab */}
                <TabsContent value="about" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {profileUser.role === "teacher" && teacherProfile ? (
                        <p>{teacherProfile.bio || "No bio available."}</p>
                      ) : profileUser.role === "student" && studentProfile ? (
                        <p>{studentProfile.bio || "No bio available."}</p>
                      ) : (
                        <p>{profileUser.bio || "No bio available."}</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {profileUser.role === "teacher" && teacherProfile && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Teaching Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-1">Expertise</h3>
                          <p>{teacherProfile.expertise}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-1">Teaching Level</h3>
                          <p>{teacherProfile.level}</p>
                        </div>
                        
                        {teacherProfile.demoVideoUrl && (
                          <div>
                            <h3 className="text-sm font-medium mb-2">Demo Video</h3>
                            <div className="relative pt-[56.25%] bg-muted rounded-lg overflow-hidden">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Video className="h-12 w-12 text-muted-foreground/50" />
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {profileUser.role === "student" && studentProfile && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Learning Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-1">Subjects of Interest</h3>
                          <p>{studentProfile.subjects}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-1">Interests</h3>
                          <p>{studentProfile.interests}</p>
                        </div>
                        
                        {studentProfile.gradeLevel && (
                          <div>
                            <h3 className="text-sm font-medium mb-1">Grade Level</h3>
                            <p>{studentProfile.gradeLevel}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                {/* Classes Tab (for teachers) */}
                {profileUser.role === "teacher" && (
                  <TabsContent value="classes" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Classes</CardTitle>
                        <CardDescription>
                          Classes taught by {profileUser.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {teacherClasses.length > 0 ? (
                          <div className="space-y-6">
                            {teacherClasses.map((classItem) => (
                              <div key={classItem.id} className="flex flex-col md:flex-row gap-4 border-b pb-6 last:border-0 last:pb-0">
                                <div className="w-full md:w-48 h-32 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  {classItem.thumbnail ? (
                                    <img 
                                      src={classItem.thumbnail} 
                                      alt={classItem.title} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <BookOpen className="h-12 w-12 text-primary/40" />
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  <h3 className="text-lg font-medium">{classItem.title}</h3>
                                  <div className="flex items-center mt-1 mb-2">
                                    <Badge variant="outline" className="mr-2">
                                      {classItem.category}
                                    </Badge>
                                    <Badge variant="outline">
                                      {classItem.level}
                                    </Badge>
                                    {classItem.isLive && (
                                      <Badge variant="secondary" className="ml-2">
                                        Live
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {classItem.description}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <div className="flex mr-2">
                                        {renderStars(Math.round(classItem.avgRating))}
                                      </div>
                                      <span className="text-sm text-muted-foreground">
                                        {classItem.avgRating.toFixed(1)} ({classItem.totalRatings})
                                      </span>
                                    </div>
                                    <Button asChild>
                                      <a href={`/classes/${classItem.id}`}>
                                        View Class
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-muted-foreground">
                              {profileUser.name} doesn't have any classes yet.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
                
                {/* Reviews Tab (for teachers) */}
                {profileUser.role === "teacher" && (
                  <TabsContent value="reviews" className="space-y-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Reviews</CardTitle>
                          <CardDescription>
                            Student feedback for {profileUser.name}
                          </CardDescription>
                        </div>
                        {!isOwnProfile && currentUser && currentUser.role === "student" && (
                          <Button onClick={() => setIsRatingDialogOpen(true)}>
                            <Star className="mr-2 h-4 w-4" />
                            Leave a Review
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="mb-6 flex flex-col md:flex-row justify-between items-center p-4 border rounded-lg bg-muted/40">
                          <div className="text-center md:text-left mb-4 md:mb-0">
                            <div className="text-4xl font-bold">
                              {teacherProfile?.avgRating.toFixed(1) || "0.0"}
                            </div>
                            <div className="flex justify-center md:justify-start mt-1">
                              {renderStars(Math.round(teacherProfile?.avgRating || 0))}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {teacherProfile?.totalRatings || 0} reviews
                            </div>
                          </div>
                          
                          <div className="w-full md:w-2/3">
                            <div className="space-y-2">
                              {[5, 4, 3, 2, 1].map((rating) => {
                                const count = teacherRatings.filter(r => Math.round(r.rating) === rating).length;
                                const percentage = teacherRatings.length > 0 
                                  ? (count / teacherRatings.length) * 100 
                                  : 0;
                                
                                return (
                                  <div key={rating} className="flex items-center">
                                    <div className="text-sm text-muted-foreground w-12">
                                      {rating} stars
                                    </div>
                                    <div className="flex-1 h-2 mx-2 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-yellow-500"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    <div className="text-xs text-muted-foreground w-8 text-right">
                                      {count}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {teacherRatings.length > 0 ? (
                          <div className="space-y-6">
                            {teacherRatings.map((review) => (
                              <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                                <div className="flex items-center mb-2">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback>S</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">Student</div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex mb-2">
                                  {renderStars(Math.round(review.rating))}
                                </div>
                                
                                {review.review && (
                                  <p className="text-sm">{review.review}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-muted-foreground">
                              {profileUser.name} hasn't received any reviews yet.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      {/* Rating Dialog */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate {profileUser.name}</DialogTitle>
            <DialogDescription>
              Share your experience with this teacher
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <div className="flex gap-1">
                {Array(5).fill(0).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-8 w-8 cursor-pointer transition-colors ${
                      i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300 hover:text-yellow-300"
                    }`}
                    onClick={() => setRating(i + 1)}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Your Review (Optional)</h4>
              <Textarea
                placeholder="Share your experience with this teacher..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRatingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRatingSubmit}
              disabled={createRatingMutation.isPending || !rating}
            >
              {createRatingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}