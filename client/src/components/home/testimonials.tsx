import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

// Testimonial data
const testimonials = [
  {
    id: 1,
    name: "Jason Martinez",
    role: "Student",
    location: "United States",
    content: "GlobalEduConnect has transformed my learning experience. I can access expert teachers from around the world without leaving my home. The interactive classes are engaging and the community is supportive.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80",
    rating: 5
  },
  {
    id: 2,
    name: "Sophia Chen",
    role: "Teacher",
    location: "Singapore",
    content: "Teaching on GlobalEduConnect has allowed me to reach students across continents. The platform's tools make it easy to create engaging lessons, and the donation system helps support my ongoing educational content.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80",
    rating: 5
  },
  {
    id: 3,
    name: "Carlos Mendoza",
    role: "Student",
    location: "Brazil",
    content: "The quality of education on this platform is exceptional. I've learned more in three months than I did in a year of traditional study. The ability to learn at my own pace and from diverse perspectives is invaluable.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80",
    rating: 4.5
  }
];

const Testimonials = () => {
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
    <section className="slide-in mb-16">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">What Our Users Say</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id}>
            <CardContent className="p-5">
              <div className="flex items-center mb-4">
                <Avatar className="w-12 h-12 mr-4">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-primary text-white">
                    {testimonial.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold">{testimonial.name}</h3>
                  <p className="text-sm text-gray-500">
                    {testimonial.role}, {testimonial.location}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 italic">{testimonial.content}</p>
              <div className="flex mt-3 text-warning">
                {renderStars(testimonial.rating)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
