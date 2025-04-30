import { useState } from "react";
import { Link, useLocation } from "wouter";
import Logo from "@/components/ui/logo";
import LoginModal from "@/components/auth/login-modal";
import MobileMenu from "@/components/layout/mobile-menu";
import { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user: User | null;
}

const Header = ({ user }: HeaderProps) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account.",
        });
        // Redirect to home page and refresh to update auth state
        window.location.href = "/";
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    
    switch (user.role) {
      case "student":
        return "/dashboard/student";
      case "teacher":
        return "/dashboard/teacher";
      case "admin":
        return "/dashboard/admin";
      default:
        return "/";
    }
  };

  return (
    <header className="bg-primary text-secondary shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <Link href="/">
            <a className="flex items-center cursor-pointer">
              <Logo className="mr-2" />
              <div className="font-bold text-xl">GlobalEduConnect</div>
            </a>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            <span className="material-icons">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>

          <nav className="hidden lg:flex items-center space-x-6">
            <Link href="/">
              <a className="hover:underline font-medium">Home</a>
            </Link>
            <Link href="/classes">
              <a className="hover:underline">Classes</a>
            </Link>
            <Link href="/resources">
              <a className="hover:underline">Resources</a>
            </Link>
            <Link href="/about">
              <a className="hover:underline">About</a>
            </Link>

            {user ? (
              <div className="ml-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage
                        src={user.profileImage || ""}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-accent text-secondary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="ml-4">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-secondary text-primary px-4 py-2 rounded-md font-medium transition-colors hover:bg-opacity-90"
                >
                  Login
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onOpenChange={setIsMobileMenuOpen}
        onLoginClick={() => {
          setIsMobileMenuOpen(false);
          setIsLoginModalOpen(true);
        }}
        user={user}
        onLogout={handleLogout}
      />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen} 
      />
    </header>
  );
};

export default Header;
