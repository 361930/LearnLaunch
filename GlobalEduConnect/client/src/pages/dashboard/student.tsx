import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ClassEnrollment, StudentProfile } from "@/lib/types";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Clock, 
  User, 
  Settings, 
  BarChart, 
  GraduationCap, 
  Calendar, 
  Star,
  FileText,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch student profile
  const { data: studentProfile, isLoading: isProfileLoading } = useQuery<StudentProfile>({
    queryKey: ["/api/student-profile"],
    enabled: !!user && user.role === "student",
  });

  // Fetch enrolled classes
  const { data: enrolledClasses = [], isLoading: isClassesLoading } = useQuery<(ClassEnrollment & { class: any })[]>({
    queryKey: ["/api/student/enrollments"],
    enabled: !!user && user.role === "student",
  });

  if (!user || user.role !== "student") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="mb-6">You need to be logged in as a student to access this page.</p>
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

  // Filter active and completed classes
  const activeClasses = enrolledClasses.filter(
    (enrollment) => enrollment.status === "enrolled"
  );
  const completedClasses = enrolledClasses.filter(
    (enrollment) => enrollment.status === "completed"
  );

  // Calculate overall progress
  const overallProgress = enrolledClasses.length 
    ? enrolledClasses.reduce((acc, curr) => acc + (curr.progress || 0), 0) / enrolledClasses.length 
    : 0;

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
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm mb-4">
                  <span className="font-medium">Joined: </span>
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    Overall Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(overallProgress)}%
                  </div>
                  <BarChart className="absolute right-4 top-4 h-6 w-6 text-muted-foreground/30" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Next Class
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium truncate">
                    {enrolledClasses.length > 0 
                      ? enrolledClasses[0].class.title 
                      : "No upcoming classes"}
                  </div>
                  <Calendar className="absolute right-4 top-4 h-6 w-6 text-muted-foreground/30" />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Dashboard Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid grid-cols-3 md:w-auto md:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="classes">My Classes</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Recent Classes */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Recent Classes</h3>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/classes">Browse More Classes</Link>
                  </Button>
                </div>
                
                {enrolledClasses.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {enrolledClasses.slice(0, 3).map((enrollment) => (
                      <Card key={enrollment.id} className="overflow-hidden">
                        <div className="h-40 bg-primary/10 flex items-center justify-center">
                          {enrollment.class.thumbnail ? (
                            <img 
                              src={enrollment.class.thumbnail} 
                              alt={enrollment.class.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-16 w-16 text-primary/40" />
                          )}
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{enrollment.class.title}</CardTitle>
                          <CardDescription>
                            {enrollment.class.category} • {enrollment.class.level}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex justify-between mb-1 text-sm">
                            <span>Progress</span>
                            <span>{enrollment.progress || 0}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${enrollment.progress || 0}%` }}
                            />
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full" asChild>
                            <Link href={`/classes/${enrollment.classId}`}>
                              Continue Learning
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-muted/40">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Enrolled Classes</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't enrolled in any classes yet. Browse our catalog to find classes that interest you.
                      </p>
                      <Button asChild>
                        <Link href="/classes">Browse Classes</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Student Profile */}
              <div>
                <h3 className="text-lg font-medium mb-4">Your Profile</h3>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid gap-1">
                        <h4 className="font-medium text-sm">Subjects of Interest</h4>
                        <p className="text-muted-foreground">
                          {studentProfile?.subjects || "No subjects specified"}
                        </p>
                      </div>
                      
                      <div className="grid gap-1">
                        <h4 className="font-medium text-sm">Interests</h4>
                        <p className="text-muted-foreground">
                          {studentProfile?.interests || "No interests specified"}
                        </p>
                      </div>
                      
                      {studentProfile?.gradeLevel && (
                        <div className="grid gap-1">
                          <h4 className="font-medium text-sm">Grade Level</h4>
                          <p className="text-muted-foreground">
                            {studentProfile.gradeLevel}
                          </p>
                        </div>
                      )}
                      
                      {studentProfile?.bio && (
                        <div className="grid gap-1">
                          <h4 className="font-medium text-sm">Bio</h4>
                          <p className="text-muted-foreground">
                            {studentProfile.bio}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button variant="outline" asChild>
                        <Link href="/profile/edit">
                          Edit Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Classes Tab */}
            <TabsContent value="classes" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Active Classes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Classes</CardTitle>
                    <CardDescription>Classes you are currently taking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeClasses.length > 0 ? (
                      <div className="space-y-4">
                        {activeClasses.map((enrollment) => (
                          <div key={enrollment.id} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                            <div className="h-16 w-16 flex-shrink-0 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
                              {enrollment.class.thumbnail ? (
                                <img 
                                  src={enrollment.class.thumbnail} 
                                  alt={enrollment.class.title} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <BookOpen className="h-8 w-8 text-primary/40" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">
                                {enrollment.class.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {enrollment.class.isLive ? "Live Class" : "Recorded Class"}
                              </p>
                              <div className="flex items-center mt-2">
                                <div className="flex-1">
                                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary" 
                                      style={{ width: `${enrollment.progress || 0}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground ml-2 min-w-[35px]">
                                  {enrollment.progress || 0}%
                                </span>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                    <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/classes/${enrollment.classId}`}>
                                    Continue Learning
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Unenroll</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">
                          You have no active classes.
                        </p>
                        <Button variant="outline" asChild>
                          <Link href="/classes">Find Classes</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Completed Classes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Completed Classes</CardTitle>
                    <CardDescription>Classes you have finished</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {completedClasses.length > 0 ? (
                      <div className="space-y-4">
                        {completedClasses.map((enrollment) => (
                          <div key={enrollment.id} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                            <div className="h-16 w-16 flex-shrink-0 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
                              {enrollment.class.thumbnail ? (
                                <img 
                                  src={enrollment.class.thumbnail} 
                                  alt={enrollment.class.title} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <BookOpen className="h-8 w-8 text-primary/40" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">
                                {enrollment.class.title}
                              </h4>
                              <div className="flex items-center mt-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm ml-1">
                                  {enrollment.class.avgRating.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Completed on {enrollment.lastAccessedAt 
                                  ? new Date(enrollment.lastAccessedAt).toLocaleDateString() 
                                  : "Unknown"}
                              </p>
                            </div>
                            
                            <Button variant="ghost" asChild className="px-2">
                              <Link href={`/classes/${enrollment.classId}`}>
                                Review
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          You haven't completed any classes yet.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Recommended Classes */}
              <div>
                <h3 className="text-lg font-medium mb-4">Recommended for You</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Placeholder for recommended classes */}
                  <Card className="overflow-hidden">
                    <div className="h-40 bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-primary/40" />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Introduction to Programming</CardTitle>
                      <CardDescription>Technology • Beginner</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        Learn the fundamentals of programming with this beginner-friendly course.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/classes">
                          View Class
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="overflow-hidden">
                    <div className="h-40 bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-primary/40" />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Digital Marketing Essentials</CardTitle>
                      <CardDescription>Business • Intermediate</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        Master the core concepts of digital marketing in this comprehensive course.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/classes">
                          View Class
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="overflow-hidden">
                    <div className="h-40 bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-primary/40" />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Creative Writing Workshop</CardTitle>
                      <CardDescription>Arts • All Levels</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        Develop your creative writing skills through practical exercises and feedback.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/classes">
                          View Class
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Schedule</CardTitle>
                  <CardDescription>Upcoming live classes and events</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeClasses.filter(e => e.class.isLive).length > 0 ? (
                    <div className="space-y-6">
                      {activeClasses
                        .filter(e => e.class.isLive && e.class.startTime)
                        .sort((a, b) => new Date(a.class.startTime!).getTime() - new Date(b.class.startTime!).getTime())
                        .map((enrollment) => (
                          <div key={enrollment.id} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                            <div className="min-w-[64px] text-center">
                              <div className="bg-primary/10 rounded-md p-2">
                                <div className="text-xl font-bold">
                                  {new Date(enrollment.class.startTime!).getDate()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(enrollment.class.startTime!).toLocaleString('default', { month: 'short' })}
                                </div>
                              </div>
                              <div className="mt-1 text-xs">
                                {new Date(enrollment.class.startTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-medium">
                                {enrollment.class.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {enrollment.class.category} • {enrollment.class.level}
                              </p>
                              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {enrollment.class.endTime 
                                  ? `${Math.round((new Date(enrollment.class.endTime).getTime() - new Date(enrollment.class.startTime!).getTime()) / (1000 * 60))} minutes` 
                                  : "Duration not specified"}
                              </div>
                            </div>
                            
                            <Button size="sm" asChild>
                              <Link href={`/classes/${enrollment.classId}`}>
                                Join
                              </Link>
                            </Button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground mb-4">
                        You have no upcoming live classes scheduled.
                      </p>
                      <Button variant="outline" asChild>
                        <Link href="/classes">Browse Live Classes</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Profile Settings</h3>
                    <Button variant="outline" asChild>
                      <Link href="/profile/edit">
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notifications</h3>
                    <div className="text-muted-foreground">
                      Manage your notification preferences in the settings page.
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/settings/notifications">
                        Notification Settings
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Accessibility</h3>
                    <div className="text-muted-foreground">
                      Customize your learning experience with accessibility options.
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/settings/accessibility">
                        Accessibility Settings
                      </Link>
                    </Button>
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