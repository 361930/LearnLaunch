import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import { GitBranch } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md text-center space-y-6">
          <GitBranch className="h-16 w-16 text-primary mx-auto" />
          
          <h1 className="text-6xl font-bold">404</h1>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
            <p className="text-muted-foreground">
              The page you are looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/classes">Browse Classes</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}