import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/home/hero-section";
import UpcomingClasses from "@/components/home/upcoming-classes";
import FeaturedTeachers from "@/components/home/featured-teachers";
import HowItWorks from "@/components/home/how-it-works";
import Categories from "@/components/home/categories";
import Testimonials from "@/components/home/testimonials";
import CallToAction from "@/components/home/call-to-action";
import { User } from "@/lib/types";
import { Helmet } from "react-helmet";

interface HomeProps {
  user: User | null;
}

const Home = ({ user }: HomeProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>GlobalEduConnect - Connect with Educators Worldwide</title>
        <meta name="description" content="Join our global community of students and teachers to access educational resources, participate in live classes, and expand your knowledge." />
      </Helmet>
      
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <HeroSection user={user} />
        <UpcomingClasses />
        <FeaturedTeachers />
        <HowItWorks />
        <Categories />
        <Testimonials />
        <CallToAction user={user} />
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
