import { useState } from "react";
import { CardSkeleton, ClassCardSkeleton, ProfileSkeleton, ChatMessageSkeleton, TableRowSkeleton, FormSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

/**
 * A component that showcases all available skeleton loaders
 */
export function SkeletonShowcase() {
  const [variant, setVariant] = useState<"pulse" | "shimmer" | "wave">("shimmer");
  
  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Skeleton Loading Animation Showcase</CardTitle>
        <CardDescription>
          Preview the different skeleton loading animations available for a smoother user experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="text-sm font-medium mb-2">Animation Style</div>
          <RadioGroup 
            defaultValue="shimmer" 
            className="flex space-x-4"
            onValueChange={(value) => setVariant(value as "pulse" | "shimmer" | "wave")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pulse" id="pulse" />
              <Label htmlFor="pulse">Pulse</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="shimmer" id="shimmer" />
              <Label htmlFor="shimmer">Shimmer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wave" id="wave" />
              <Label htmlFor="wave">Wave</Label>
            </div>
          </RadioGroup>
        </div>
        
        <Tabs defaultValue="components">
          <TabsList className="mb-4">
            <TabsTrigger value="components">Component Skeletons</TabsTrigger>
            <TabsTrigger value="sizes">Skeleton Sizes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="components" className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-2">Card Skeleton</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <CardSkeleton />
                </div>
                <div className="flex flex-col space-y-2">
                  <ClassCardSkeleton />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Profile Skeleton</h3>
              <ProfileSkeleton />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Chat Skeleton</h3>
              <ChatMessageSkeleton />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Table Row Skeleton</h3>
              <div className="border rounded-md">
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Form Skeleton</h3>
              <FormSkeleton />
            </div>
          </TabsContent>
          
          <TabsContent value="sizes" className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Text Sizes</h3>
              <Skeleton className="h-4 w-full" variant={variant} />
              <Skeleton className="h-6 w-3/4" variant={variant} />
              <Skeleton className="h-8 w-1/2" variant={variant} />
              <Skeleton className="h-10 w-1/3" variant={variant} />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Avatar Sizes</h3>
              <div className="flex space-x-4 items-end">
                <Skeleton className="h-8 w-8 rounded-full" variant={variant} />
                <Skeleton className="h-12 w-12 rounded-full" variant={variant} />
                <Skeleton className="h-16 w-16 rounded-full" variant={variant} />
                <Skeleton className="h-20 w-20 rounded-full" variant={variant} />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Button Sizes</h3>
              <div className="flex space-x-4 items-center">
                <Skeleton className="h-8 w-16 rounded-md" variant={variant} />
                <Skeleton className="h-10 w-24 rounded-md" variant={variant} />
                <Skeleton className="h-12 w-32 rounded-md" variant={variant} />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Image Placeholders</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-40 w-full rounded-md" variant={variant} />
                <Skeleton className="h-40 w-full rounded-md" variant={variant} />
                <Skeleton className="h-40 w-full rounded-md" variant={variant} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Current animation: <span className="font-medium">{variant}</span>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setVariant(
            variant === "pulse" ? "shimmer" : variant === "shimmer" ? "wave" : "pulse"
          )}
        >
          Change Animation
        </Button>
      </CardFooter>
    </Card>
  );
}