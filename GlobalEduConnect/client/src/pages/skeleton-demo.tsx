import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Skeleton, 
  CardSkeleton, 
  ProfileSkeleton, 
  ClassCardSkeleton, 
  ChatMessageSkeleton,
  TableRowSkeleton,
  FormSkeleton 
} from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";

export default function SkeletonDemoPage() {
  const [selectedVariant, setSelectedVariant] = useState<"pulse" | "wave" | "shimmer">("pulse");
  
  const handleVariantChange = (variant: "pulse" | "wave" | "shimmer") => {
    setSelectedVariant(variant);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Loading Skeleton Demo</h1>
            <p className="text-muted-foreground">
              Showcase of different skeleton loaders with different animation styles.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Animation Variants</CardTitle>
              <CardDescription>
                Choose an animation style to apply to all skeleton components.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant={selectedVariant === "pulse" ? "default" : "outline"}
                  onClick={() => handleVariantChange("pulse")}
                >
                  Pulse
                </Button>
                <Button 
                  variant={selectedVariant === "wave" ? "default" : "outline"}
                  onClick={() => handleVariantChange("wave")}
                >
                  Wave
                </Button>
                <Button 
                  variant={selectedVariant === "shimmer" ? "default" : "outline"}
                  onClick={() => handleVariantChange("shimmer")}
                >
                  Shimmer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="cards">
            <TabsList className="mb-4">
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="profiles">Profiles</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cards">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h3 className="text-lg font-medium mb-3">Standard Card</h3>
                  <CardSkeleton variant={selectedVariant} />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3">Class Card</h3>
                  <ClassCardSkeleton variant={selectedVariant} />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3">Multiple Cards</h3>
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" variant={selectedVariant} />
                        <Skeleton className="h-3 w-full" variant={selectedVariant} />
                        <Skeleton className="h-3 w-full" variant={selectedVariant} />
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="profiles">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-3">Profile Card</h3>
                  <Card className="p-6">
                    <ProfileSkeleton variant={selectedVariant} />
                  </Card>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3">Profile List</h3>
                  <Card className="p-4">
                    <div className="space-y-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <ProfileSkeleton key={i} variant={selectedVariant} />
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="forms">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-1 lg:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-3">Form Fields</h3>
                  <Card className="p-6">
                    <FormSkeleton variant={selectedVariant} />
                  </Card>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3">Individual Form Elements</h3>
                  <Card className="p-6 space-y-6">
                    <div>
                      <Skeleton className="h-4 w-20 mb-2" variant={selectedVariant} />
                      <Skeleton className="h-10 w-full" variant={selectedVariant} />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" variant={selectedVariant} />
                      <Skeleton className="h-10 w-full" variant={selectedVariant} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-5 rounded" variant={selectedVariant} />
                      <Skeleton className="h-4 w-32" variant={selectedVariant} />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Skeleton className="h-9 w-20" variant={selectedVariant} />
                      <Skeleton className="h-9 w-24" variant={selectedVariant} />
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="tables">
              <div>
                <h3 className="text-lg font-medium mb-3">Table Rows</h3>
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground pb-2 border-b">
                      <div className="w-12">Image</div>
                      <div className="flex-1">Name</div>
                      <div className="w-[100px] text-right">Status</div>
                      <div className="w-[80px] text-right">Action</div>
                    </div>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} variant={selectedVariant} />
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="chat">
              <div>
                <h3 className="text-lg font-medium mb-3">Chat Messages</h3>
                <Card className="p-6">
                  <ChatMessageSkeleton variant={selectedVariant} />
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="custom">
              <div>
                <h3 className="text-lg font-medium mb-3">Custom Skeletons</h3>
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-none">
                        <Skeleton className="h-20 w-20 rounded-full" variant={selectedVariant} />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-1/3" variant={selectedVariant} />
                        <Skeleton className="h-4 w-full" variant={selectedVariant} />
                        <Skeleton className="h-4 w-4/5" variant={selectedVariant} />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Skeleton className="h-32 rounded-lg" variant={selectedVariant} />
                          <Skeleton className="h-3 w-3/4 mt-2" variant={selectedVariant} />
                        </div>
                        <div>
                          <Skeleton className="h-32 rounded-lg" variant={selectedVariant} />
                          <Skeleton className="h-3 w-3/4 mt-2" variant={selectedVariant} />
                        </div>
                        <div>
                          <Skeleton className="h-32 rounded-lg" variant={selectedVariant} />
                          <Skeleton className="h-3 w-3/4 mt-2" variant={selectedVariant} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}