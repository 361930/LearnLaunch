import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { User, Class } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import ClassCard from "@/components/classes/class-card";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard = ({ user }: StudentDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const { data: enrolledClasses, isLoading: isLoadingEnrolled } = useQuery<Class[]>({
    queryKey: ["/api/students/classes/enrolled"],
  });

  const { data: recommendedClasses, isLoading: isLoadingRecommended } = useQuery<Class[]>({
    queryKey: ["/api/students/classes/recommended"],
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

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Student Dashboard | GlobalEduConnect</title>
      </Helmet>
      
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <Button className="bg-primary text-white hover:bg-blue-700">
            <span className="material-icons mr-2">calendar_today</span>
            My Schedule
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="enrolled">My Classes</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Welcome back, {user.name}!</CardTitle>
                <CardDescription>
                  Here's an overview of your learning journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="material-icons text-primary mr-2">school</span>
                      <h3 className="font-medium">Classes Joined</h3>
                    </div>
                    <p className="text-2xl font-bold">{enrolledClasses?.length || 0}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="material-icons text-green-600 mr-2">check_circle</span>
                      <h3 className="font-medium">Completed</h3>
                    </div>
                    <p className="text-2xl font-bold">4</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="material-icons text-purple-600 mr-2">timeline</span>
                      <h3 className="font-medium">Learning Streak</h3>
                    </div>
                    <p className="text-2xl font-bold">7 days</p>
                  </div>
                </div>
                
                <h3 className="font-medium mb-2">Learning Progress</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Mathematics</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Computer Science</span>
                      <span>80%</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Languages</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Upcoming Classes */}
            <h2 className="text-2xl font-bold mt-8 mb-4">Upcoming Classes</h2>
            {isLoadingEnrolled ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-64 w-full" />
                ))}
              </div>
            ) : !enrolledClasses || enrolledClasses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <span className="material-icons text-5xl text-gray-300 mb-2">school</span>
                    <h3 className="text-xl font-medium mb-2">No Classes Yet</h3>
                    <p className="text-gray-500 mb-4">
                      You haven't joined any classes yet. Explore our catalog to find classes that interest you.
                    </p>
                    <Button onClick={() => window.location.href = "/classes"}>
                      Browse Classes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledClasses.slice(0, 3).map((classItem) => (
                  <ClassCard 
                    key={classItem.id} 
                    classData={classItem} 
                    onJoin={handleJoinClass} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="enrolled">
            <h2 className="text-2xl font-bold mb-6">My Enrolled Classes</h2>
            {isLoadingEnrolled ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <Skeleton key={index} className="h-64 w-full" />
                ))}
              </div>
            ) : !enrolledClasses || enrolledClasses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <span className="material-icons text-5xl text-gray-300 mb-2">school</span>
                    <h3 className="text-xl font-medium mb-2">No Classes Yet</h3>
                    <p className="text-gray-500 mb-4">
                      You haven't joined any classes yet. Explore our catalog to find classes that interest you.
                    </p>
                    <Button onClick={() => window.location.href = "/classes"}>
                      Browse Classes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledClasses.map((classItem) => (
                  <ClassCard 
                    key={classItem.id} 
                    classData={classItem} 
                    onJoin={handleJoinClass} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recommended">
            <h2 className="text-2xl font-bold mb-6">Recommended Classes</h2>
            {isLoadingRecommended ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <Skeleton key={index} className="h-64 w-full" />
                ))}
              </div>
            ) : !recommendedClasses || recommendedClasses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <span className="material-icons text-5xl text-gray-300 mb-2">recommend</span>
                    <h3 className="text-xl font-medium mb-2">No Recommendations Yet</h3>
                    <p className="text-gray-500 mb-4">
                      We'll recommend classes based on your interests and activity. Start by joining some classes!
                    </p>
                    <Button onClick={() => window.location.href = "/classes"}>
                      Browse Classes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedClasses.map((classItem) => (
                  <ClassCard 
                    key={classItem.id} 
                    classData={classItem} 
                    onJoin={handleJoinClass} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={user.profileImage} alt={user.name} />
                        <AvatarFallback className="text-xl bg-primary text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <h2 className="text-xl font-bold mb-1">{user.name}</h2>
                      <p className="text-gray-500 mb-4">Student</p>
                      <Button variant="outline" className="w-full mb-2">
                        Edit Profile
                      </Button>
                      <Button variant="outline" className="w-full">
                        Change Privacy Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p>{user.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Enrolled Subjects</h3>
                        <p>{user.subjects || "Not specified"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Interests</h3>
                        <p>{user.interests || "Not specified"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Privacy Setting</h3>
                        <p className="capitalize">{user.privacySettings || "Public"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full">
                        Change Password
                      </Button>
                      <Button variant="outline" className="w-full">
                        Notification Preferences
                      </Button>
                      <Button variant="destructive" className="w-full">
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default StudentDashboard;
