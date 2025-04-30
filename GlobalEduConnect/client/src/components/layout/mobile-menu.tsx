import { Link } from "wouter";
import { User } from "@/lib/types";

interface MobileMenuProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLoginClick: () => void;
  user: User | null;
  onLogout: () => void;
}

const MobileMenu = ({
  isOpen,
  onOpenChange,
  onLoginClick,
  user,
  onLogout,
}: MobileMenuProps) => {
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

  if (!isOpen) return null;

  return (
    <div className="lg:hidden slide-in bg-primary border-t border-blue-700 pb-4">
      <div className="container mx-auto px-4 flex flex-col space-y-3 pt-3">
        <Link href="/">
          <a 
            className="block py-2 px-4 hover:bg-blue-700 rounded-md"
            onClick={() => onOpenChange(false)}
          >
            Home
          </a>
        </Link>
        <Link href="/classes">
          <a 
            className="block py-2 px-4 hover:bg-blue-700 rounded-md"
            onClick={() => onOpenChange(false)}
          >
            Classes
          </a>
        </Link>
        <Link href="/resources">
          <a 
            className="block py-2 px-4 hover:bg-blue-700 rounded-md"
            onClick={() => onOpenChange(false)}
          >
            Resources
          </a>
        </Link>
        <Link href="/about">
          <a 
            className="block py-2 px-4 hover:bg-blue-700 rounded-md"
            onClick={() => onOpenChange(false)}
          >
            About
          </a>
        </Link>

        {user ? (
          <>
            <Link href={getDashboardLink()}>
              <a 
                className="block py-2 px-4 hover:bg-blue-700 rounded-md"
                onClick={() => onOpenChange(false)}
              >
                Dashboard
              </a>
            </Link>
            <Link href="/profile">
              <a 
                className="block py-2 px-4 hover:bg-blue-700 rounded-md"
                onClick={() => onOpenChange(false)}
              >
                Profile
              </a>
            </Link>
            <Link href="/settings">
              <a 
                className="block py-2 px-4 hover:bg-blue-700 rounded-md"
                onClick={() => onOpenChange(false)}
              >
                Settings
              </a>
            </Link>
            <button 
              onClick={() => {
                onLogout();
                onOpenChange(false);
              }}
              className="text-left block py-2 px-4 hover:bg-blue-700 rounded-md w-full"
            >
              Logout
            </button>
          </>
        ) : (
          <button 
            onClick={onLoginClick}
            className="bg-secondary text-primary px-4 py-2 rounded-md font-medium transition-colors hover:bg-opacity-90"
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;
