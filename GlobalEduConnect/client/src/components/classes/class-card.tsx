import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Class } from "@/lib/types";

interface ClassCardProps {
  classData: Class;
  onJoin: (classId: string) => void;
}

const getLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "beginner":
      return "bg-success text-success-foreground";
    case "intermediate":
      return "bg-warning text-warning-foreground";
    case "advanced":
      return "bg-error text-error-foreground";
    default:
      return "bg-primary text-primary-foreground";
  }
};

const ClassCard = ({ classData, onJoin }: ClassCardProps) => {
  const formattedDate = format(new Date(classData.startTime), "MMM d, h:mm a");

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow scale-in h-full flex flex-col">
      <div className="relative">
        <img
          src={classData.image || "https://placehold.co/600x400?text=Class+Image"}
          alt={classData.title}
          className="w-full h-40 object-cover"
        />
        <Badge 
          className={`absolute top-2 right-2 ${getLevelColor(classData.level)}`}
        >
          {classData.level}
        </Badge>
      </div>
      <CardHeader className="p-4 pb-2">
        <h3 className="font-bold text-lg">{classData.title}</h3>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow flex flex-col">
        <p className="text-sm text-gray-600 mb-3 flex-grow">{classData.description}</p>
        <div className="flex items-center mb-3">
          <Avatar className="w-8 h-8 mr-2">
            <AvatarImage src={classData.teacher.profileImage} alt={classData.teacher.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {classData.teacher.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{classData.teacher.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-500">
            <span className="material-icons text-sm mr-1">schedule</span>
            <span>{formattedDate}</span>
          </div>
          <Button 
            size="sm" 
            onClick={() => onJoin(classData.id)}
            className="bg-primary text-white hover:bg-blue-700 transition-colors"
          >
            Join
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassCard;
