import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Teacher } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface TeacherCardProps {
  teacher: Teacher;
}

const TeacherCard = ({ teacher }: TeacherCardProps) => {
  const { toast } = useToast();

  const handleDonation = async () => {
    // This is a placeholder for the donation mechanism
    // In a real system, you would integrate with a payment provider
    toast({
      title: "Donation feature",
      description: "This feature will be available soon!",
    });
  };

  // Function to render stars based on rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`star-${i}`} className="material-icons text-warning">star</span>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <span key="half-star" className="material-icons text-warning">star_half</span>
      );
    }
    
    // Add empty stars to make 5 total
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-star-${i}`} className="material-icons text-gray-300">star</span>
      );
    }
    
    return stars;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow p-5 flex flex-col items-center text-center h-full">
      <Avatar className="w-24 h-24 mb-4">
        <AvatarImage src={teacher.profileImage} alt={teacher.name} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {teacher.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <h3 className="font-bold text-lg mb-1">{teacher.name}</h3>
      <p className="text-sm text-primary mb-2">{teacher.expertise}</p>
      <div className="flex mb-3">{renderStars(teacher.rating)}</div>
      <p className="text-sm text-gray-600 mb-4 flex-grow">{teacher.bio}</p>
      <Button 
        className="bg-accent text-white hover:bg-gray-600 transition-colors rounded-full flex items-center"
        onClick={handleDonation}
      >
        <span className="material-icons mr-1 text-sm">coffee</span>
        Buy Me a Coffee
      </Button>
    </Card>
  );
};

export default TeacherCard;
