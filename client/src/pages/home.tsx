import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Class } from "@/lib/types";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Users, Clock, BookOpen, GitBranch } from "lucide-react";
import { CardSkeleton, ClassCardSkeleton } from "@/components/ui/skeleton";
import { useDelayedLoader } from "@/hooks/use-delayed-loader";

export default function HomePage() {
  const [featuredClasses, setFeaturedClasses] = useState<Class[]>([]);

  // Fetch featured classes
  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes/featured"],
  });
  
  // Use delayed loader to prevent flickering for fast responses
  const showSkeletons = useDelayedLoader(isLoading, 300, 500);

  useEffect(() => {
    if (classes) {
      setFeaturedClasses(classes.slice(0, 6));
    }
  }, [classes]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl">
                    Global Education Without Boundaries
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Connect with teachers and students worldwide to share knowledge, learn new skills, and grow together in a global learning community.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/classes">Explore Classes</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/auth?tab=register">Join Now</Link>
                  </Button>
                </div>
              </div>
              <div className="mx-auto lg:ml-auto flex items-center justify-center">
                <div className="relative w-full max-w-[500px] h-[400px] rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
                  <GitBranch className="h-40 w-40 text-primary/40" />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="w-full py-12 md:py-24 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Why Choose GlobalEduConnect?</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  Our platform offers unique features designed to make global education accessible, 
                  interactive, and enriching for everyone.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12">
              <Card className="border-none">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Globe className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">Global Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Connect with learners and teachers from across the globe, 
                    breaking down geographical barriers to education.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Users className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">Diverse Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Join a diverse community of learners with different backgrounds,
                    cultures, and perspectives to enrich your educational experience.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Clock className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">Flexible Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Learn at your own pace with live and recorded classes, 
                    accommodating different time zones and schedules.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">Diverse Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Explore a wide range of subjects from academic disciplines to
                    practical skills and creative arts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Featured Classes Section */}
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Featured Classes</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  Discover popular classes taught by experienced educators from around the world.
                </p>
              </div>
            </div>
            
            {showSkeletons ? (
              <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ClassCardSkeleton key={index} variant="shimmer" />
                ))}
              </div>
            ) : featuredClasses.length > 0 ? (
              <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
                {featuredClasses.map((classItem) => (
                  <Card key={classItem.id} className="overflow-hidden">
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
                    <CardContent>
                      <p className="line-clamp-2 text-muted-foreground">
                        {classItem.description}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <p className="text-sm text-muted-foreground">
                        {classItem.isLive ? "Live Class" : "Recorded Class"}
                      </p>
                      <Button variant="outline" asChild>
                        <Link href={`/classes/${classItem.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 space-y-4">
                <p className="text-muted-foreground text-lg">No featured classes available yet.</p>
                <Button asChild>
                  <Link href="/classes">Browse All Classes</Link>
                </Button>
              </div>
            )}
            
            <div className="flex justify-center mt-12">
              <Button size="lg" variant="outline" asChild>
                <Link href="/classes">View All Classes</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Ready to Start Your Global Learning Journey?
                </h2>
                <p className="max-w-[700px] md:text-xl/relaxed">
                  Join thousands of students and teachers already connecting and learning on our platform.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/auth?tab=register">Create Free Account</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground" asChild>
                  <Link href="/auth">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="w-full py-6 bg-background border-t">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <GitBranch className="h-6 w-6 mr-2 text-primary" />
                <span className="font-bold">GlobalEduConnect</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting teachers and students globally for a better learning experience.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">Platform</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><Link href="/classes">Classes</Link></li>
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">Resources</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">Contact</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>support@globaleduconnect.com</li>
                <li>+1 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 border-t pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GlobalEduConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}