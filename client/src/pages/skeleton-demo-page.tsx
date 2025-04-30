import { useState, useEffect } from "react";
import { useDelayedLoader } from "@/hooks/use-delayed-loader";
import { ClassCardSkeleton, ProfileSkeleton, ChatMessageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonShowcase } from "@/components/skeleton-showcase";

/**
 * A page that demonstrates skeleton loading animations in a practical context
 */
export default function SkeletonDemoPage() {
  // Simulate loading states
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isClassesLoading, setIsClassesLoading] = useState(true);
  const [isChatsLoading, setIsChatsLoading] = useState(true);
  
  // Use delayed loaders to prevent flickering
  const showProfileLoader = useDelayedLoader(isProfileLoading, 300, 500);
  const showClassesLoader = useDelayedLoader(isClassesLoading, 500, 800);
  const showChatsLoader = useDelayedLoader(isChatsLoading, 700, 1000);
  
  // Simulate API calls with different load times
  useEffect(() => {
    const profileTimer = setTimeout(() => setIsProfileLoading(false), 2000);
    const classesTimer = setTimeout(() => setIsClassesLoading(false), 3500);
    const chatsTimer = setTimeout(() => setIsChatsLoading(false), 5000);
    
    return () => {
      clearTimeout(profileTimer);
      clearTimeout(classesTimer);
      clearTimeout(chatsTimer);
    };
  }, []);
  
  // Reset the loading states to demonstrate the loaders again
  const handleReload = () => {
    setIsProfileLoading(true);
    setIsClassesLoading(true);
    setIsChatsLoading(true);
    
    const profileTimer = setTimeout(() => setIsProfileLoading(false), 2000);
    const classesTimer = setTimeout(() => setIsClassesLoading(false), 3500);
    const chatsTimer = setTimeout(() => setIsChatsLoading(false), 5000);
    
    return () => {
      clearTimeout(profileTimer);
      clearTimeout(classesTimer);
      clearTimeout(chatsTimer);
    };
  };
  
  return (
    <div className="container py-10 space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Loading Skeletons Demo</h1>
        <Button onClick={handleReload}>Reload All</Button>
      </div>
      
      <div className="grid md:grid-cols-12 gap-6">
        {/* Profile Section */}
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {showProfileLoader ? (
                <ProfileSkeleton />
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    JS
                  </div>
                  <div>
                    <div className="font-medium">Jane Smith</div>
                    <div className="text-sm text-muted-foreground">Teacher • Online</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Classes Section */}
        <div className="md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
            </CardHeader>
            <CardContent>
              {showClassesLoader ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <ClassCardSkeleton />
                  <ClassCardSkeleton />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border p-4">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">Advanced Mathematics</div>
                      <div className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        Live
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Algebra and Calculus</div>
                    <div className="text-sm mt-2">Tomorrow, 10:00 AM</div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 text-xs font-bold">
                        DR
                      </div>
                      <Button variant="outline" size="sm">Join</Button>
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-border p-4">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">Mobile App Development</div>
                      <div className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                        Soon
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">React Native & Flutter</div>
                    <div className="text-sm mt-2">Friday, 3:00 PM</div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 text-xs font-bold">
                        LK
                      </div>
                      <Button variant="outline" size="sm">Remind</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Chat Section */}
        <div className="md:col-span-12">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {showChatsLoader ? (
                <ChatMessageSkeleton />
              ) : (
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start space-x-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-xs font-bold flex-shrink-0">
                      AJ
                    </div>
                    <div className="bg-muted p-3 rounded-xl text-sm">
                      <p className="font-medium">Alex Johnson</p>
                      <p>Hi there! I had a question about the upcoming class on mobile app development. 
                         Will we be covering any Swift or just focusing on cross-platform frameworks?</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2 flex-row-reverse">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                      ME
                    </div>
                    <div className="bg-primary/10 p-3 rounded-xl text-sm">
                      <p>We'll primarily focus on React Native and Flutter, but I can include a brief intro to Swift if you're interested!</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Skeleton Showcase */}
      <div className="mt-16">
        <SkeletonShowcase />
      </div>
    </div>
  );
}