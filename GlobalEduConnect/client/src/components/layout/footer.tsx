import { Link } from "wouter";
import Logo from "@/components/ui/logo";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically send the email to your backend
    toast({
      title: "Subscribed!",
      description: "Thank you for subscribing to our newsletter",
    });
    
    setEmail("");
  };

  return (
    <footer className="bg-accent text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">About GlobalEduConnect</h3>
            <p className="text-sm">
              Our mission is to make quality education accessible to everyone around the world, 
              connecting students with passionate teachers across borders.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="hover:text-blue-300" aria-label="Facebook">
                <span className="material-icons">facebook</span>
              </a>
              <a href="#" className="hover:text-blue-300" aria-label="Twitter">
                <span className="material-icons">twitter</span>
              </a>
              <a href="#" className="hover:text-blue-300" aria-label="Website">
                <span className="material-icons">language</span>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/">
                  <a className="hover:underline">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/classes">
                  <a className="hover:underline">Classes</a>
                </Link>
              </li>
              <li>
                <Link href="/register?role=teacher">
                  <a className="hover:underline">Become a Teacher</a>
                </Link>
              </li>
              <li>
                <Link href="/resources">
                  <a className="hover:underline">Resources</a>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <a className="hover:underline">About Us</a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help">
                  <a className="hover:underline">Help Center</a>
                </Link>
              </li>
              <li>
                <Link href="/guidelines">
                  <a className="hover:underline">Community Guidelines</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="hover:underline">Privacy Policy</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="hover:underline">Terms of Service</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="hover:underline">Contact Us</a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-lg mb-4">Stay Updated</h3>
            <p className="text-sm mb-3">
              Subscribe to our newsletter for the latest classes and educational resources.
            </p>
            <form className="flex" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="Your email" 
                className="px-3 py-2 text-gray-800 rounded-l-md flex-grow text-sm focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button 
                type="submit" 
                className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors"
                aria-label="Subscribe"
              >
                <span className="material-icons text-sm">send</span>
              </button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-600 mt-8 pt-6 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} GlobalEduConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
