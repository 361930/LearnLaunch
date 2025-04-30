import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, LogOut, Settings, User as UserIcon, BookOpen, Home, LayoutDashboard, GitBranch, Award } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const NavLinks = () => (
    <>
      <li className={location === "/" ? "text-primary font-bold" : ""}>
        <Link href="/">
          {isMobile && <Home className="h-5 w-5 mr-2" />}
          Home
        </Link>
      </li>
      <li className={location.startsWith("/classes") ? "text-primary font-bold" : ""}>
        <Link href="/classes">
          {isMobile && <BookOpen className="h-5 w-5 mr-2" />}
          Classes
        </Link>
      </li>
      <li className={location.startsWith("/challenges") ? "text-primary font-bold" : ""}>
        <Link href="/challenges">
          {isMobile && <Award className="h-5 w-5 mr-2" />}
          Challenges
        </Link>
      </li>
      {user && (
        <li className={location.startsWith("/dashboard") ? "text-primary font-bold" : ""}>
          <Link href={`/dashboard/${user.role}`}>
            {isMobile && <LayoutDashboard className="h-5 w-5 mr-2" />}
            Dashboard
          </Link>
        </li>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="flex items-center mr-8">
              <GitBranch className="h-6 w-6 mr-2 text-primary" />
              <span className="font-bold text-lg">GlobalEduConnect</span>
            </div>
          </Link>

          {!isMobile && (
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                <NavLinks />
              </ul>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.profileImage} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user.id}`}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/auth">Login</Link>
              </Button>
              <Button asChild className="hidden md:flex">
                <Link href="/auth?tab=register">Register</Link>
              </Button>
            </div>
          )}

          {isMobile && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="py-4">
                  <nav>
                    <ul className="flex flex-col space-y-4">
                      <NavLinks />
                    </ul>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}