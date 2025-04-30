import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Challenge, ChallengeParticipation, ChallengeComment, User } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Award,
  Clock,
  Users,
  Calendar,
  Share2,
  Loader2,
  Trophy,
  Tag,
  ArrowUpRight,
  CheckCircle,
  X,
  PlusCircle,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Upload,
  Send
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

// Form schema for challenge submission
const submissionSchema = z.object({
  submissionText: z.string().min(1, "Please provide some details about your submission"),
  submissionUrl: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
  publiclyShared: z.boolean().default(true),
});

// Form schema for challenge comment
const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  isPublic: z.boolean().default(true),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;
type CommentFormValues = z.infer<typeof commentSchema>;

export default function ChallengeDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  
  const challengeId = parseInt(params.id);

  // Fetch challenge details
  const { data: challenge, isLoading: isChallengeLoading } = useQuery<Challenge>({
    queryKey: [`/api/challenges/${challengeId}`],
    enabled: !isNaN(challengeId),
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load challenge details. The challenge might not exist.",
        variant: "destructive",
      });
      navigate("/challenges");
    },
  });

  // Fetch challenge participants
  const { data: participants = [], isLoading: isParticipantsLoading } = useQuery<ChallengeParticipation[]>({
    queryKey: [`/api/challenges/${challengeId}/participants`],
    enabled: !isNaN(challengeId),
  });

  // Fetch user's participation
  const { data: userParticipation, isLoading: isUserParticipationLoading } = useQuery<ChallengeParticipation>({
    queryKey: [`/api/challenges/${challengeId}/my-participation`],
    enabled: !isNaN(challengeId) && !!user,
  });

  // Fetch challenge comments
  const { data: comments = [], isLoading: isCommentsLoading } = useQuery<ChallengeComment[]>({
    queryKey: [`/api/challenges/${challengeId}/comments`],
    enabled: !isNaN(challengeId),
  });

  // Submission form
  const submissionForm = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      submissionText: "",
      submissionUrl: "",
      publiclyShared: true,
    },
  });

  // Comment form
  const commentForm = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
      isPublic: true,
    },
  });

  // Set up share URL once challenge data is loaded
  useEffect(() => {
    if (challenge) {
      setShareUrl(`${window.location.origin}/challenges/${challenge.id}`);
    }
  }, [challenge]);

  // Join challenge mutation
  const joinChallengeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/challenges/${challengeId}/join`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/participants`] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/my-participation`] });
      toast({
        title: "Success",
        description: "You have joined the challenge",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join challenge",
        variant: "destructive",
      });
    },
  });

  // Submit challenge participation
  const submitChallengeMutation = useMutation({
    mutationFn: async (data: SubmissionFormValues) => {
      const res = await apiRequest("POST", `/api/challenges/${challengeId}/submit`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/my-participation`] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/participants`] });
      toast({
        title: "Success",
        description: "Your submission has been recorded",
      });
      setIsSubmissionDialogOpen(false);
      submissionForm.reset();
      setIsShareDialogOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit challenge",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      const res = await apiRequest("POST", `/api/challenges/${challengeId}/comments`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/comments`] });
      toast({
        title: "Success",
        description: "Your comment has been added",
      });
      commentForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const joinChallenge = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to join challenges",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    joinChallengeMutation.mutate();
  };

  const onSubmitSubmission = (data: SubmissionFormValues) => {
    submitChallengeMutation.mutate(data);
  };

  const onSubmitComment = (data: CommentFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to comment",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    addCommentMutation.mutate(data);
  };

  const shareToSocialMedia = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    if (!challenge) return;
    
    const title = encodeURIComponent(challenge.title);
    const url = encodeURIComponent(shareUrl);
    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=I'm participating in the "${title}" challenge!&url=${url}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }
    
    window.open(shareLink, '_blank', 'width=600,height=400');
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Challenge link copied to clipboard",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "intermediate":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "advanced":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "expert":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const isLoading = isChallengeLoading || isParticipantsLoading || 
    (user && isUserParticipationLoading) || isCommentsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Challenge Not Found</h1>
            <p className="mb-6">The challenge you're looking for doesn't exist.</p>
            <Button asChild>
              <a href="/challenges">Browse Challenges</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasJoined = !!userParticipation;
  const hasCompleted = hasJoined && userParticipation.status === "completed";
  const isActive = challenge.isActive;
  const isEnded = new Date(challenge.endDate) < new Date();
  
  // Calculate time left
  const timeLeft = () => {
    const now = new Date();
    const end = new Date(challenge.endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Challenge ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''} left`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} left`;
    }
  };

  const completedCount = participants.filter(p => p.status === "completed").length;
  const joinedCount = participants.filter(p => p.status === "joined" || p.status === "in-progress").length;
  const completionRate = participants.length > 0 ? (completedCount / participants.length) * 100 : 0;

  // Sort participants by status: completed first, then in-progress, then joined
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return -1;
    if (a.status !== "completed" && b.status === "completed") return 1;
    if (a.status === "in-progress" && b.status === "joined") return -1;
    if (a.status === "joined" && b.status === "in-progress") return 1;
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">{challenge.title}</h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={cn("capitalize", getDifficultyColor(challenge.difficulty))}>
                      {challenge.difficulty}
                    </Badge>
                    <Badge variant="outline">{challenge.category}</Badge>
                    {challenge.isActive && !isEnded && (
                      <Badge variant="secondary">Active</Badge>
                    )}
                    {isEnded && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Ended
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsShareDialogOpen(true)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  
                  {!hasJoined && challenge.isActive && !isEnded && (
                    <Button 
                      onClick={joinChallenge}
                      disabled={joinChallengeMutation.isPending}
                    >
                      {joinChallengeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Join Challenge
                        </>
                      )}
                    </Button>
                  )}
                  
                  {hasJoined && !hasCompleted && challenge.isActive && !isEnded && (
                    <Button 
                      onClick={() => setIsSubmissionDialogOpen(true)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submit Solution
                    </Button>
                  )}
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="participants">
                    Participants ({participants.length})
                  </TabsTrigger>
                  <TabsTrigger value="discussions">
                    Discussion ({comments.length})
                  </TabsTrigger>
                </TabsList>
                
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Challenge Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>{challenge.description}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-6">
                        {challenge.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Challenge Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex flex-col items-center p-3 border rounded-lg">
                            <Users className="h-5 w-5 text-muted-foreground mb-1" />
                            <span className="text-lg font-bold">{participants.length}</span>
                            <span className="text-xs text-muted-foreground">Participants</span>
                          </div>
                          <div className="flex flex-col items-center p-3 border rounded-lg">
                            <CheckCircle className="h-5 w-5 text-muted-foreground mb-1" />
                            <span className="text-lg font-bold">{completedCount}</span>
                            <span className="text-xs text-muted-foreground">Completed</span>
                          </div>
                          <div className="flex flex-col items-center p-3 border rounded-lg">
                            <Clock className="h-5 w-5 text-muted-foreground mb-1" />
                            <span className="text-lg font-bold">{timeLeft()}</span>
                            <span className="text-xs text-muted-foreground">Remaining</span>
                          </div>
                          <div className="flex flex-col items-center p-3 border rounded-lg">
                            <Award className="h-5 w-5 text-muted-foreground mb-1" />
                            <span className="text-lg font-bold">{completionRate.toFixed(0)}%</span>
                            <span className="text-xs text-muted-foreground">Completion Rate</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span>Overall Completion</span>
                            <span>{completedCount} / {participants.length}</span>
                          </div>
                          <Progress value={completionRate} className="h-2 w-full" />
                        </div>
                        
                        {hasJoined && (
                          <div className="p-4 border rounded-lg bg-muted/40">
                            <h3 className="text-sm font-medium mb-2">Your Status</h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Badge variant={hasCompleted ? "default" : "outline"} className="mr-2">
                                  {userParticipation.status.replace("-", " ")}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {hasCompleted 
                                    ? `Completed on ${new Date(userParticipation.completedAt!).toLocaleDateString()}` 
                                    : `Joined on ${new Date(userParticipation.joinedAt).toLocaleDateString()}`}
                                </span>
                              </div>
                              
                              {!hasCompleted && challenge.isActive && !isEnded && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setIsSubmissionDialogOpen(true)}
                                >
                                  Submit Solution
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Show some completed submissions */}
                  {completedCount > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Solutions Showcase</CardTitle>
                        <CardDescription>
                          See how others have completed this challenge
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {participants
                            .filter(p => p.status === "completed" && p.publiclyShared)
                            .slice(0, 3)
                            .map((participant) => (
                              <div key={participant.id} className="border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center mb-2">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage src={participant.user?.profileImage} />
                                    <AvatarFallback>{participant.user?.name.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{participant.user?.name || "Anonymous"}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Completed on {new Date(participant.completedAt!).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                
                                <p className="text-sm my-2">{participant.submissionText}</p>
                                
                                {participant.submissionUrl && (
                                  <a 
                                    href={participant.submissionUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center text-sm text-primary hover:underline"
                                  >
                                    <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                                    View Submission
                                  </a>
                                )}
                              </div>
                            ))}
                          
                          {participants.filter(p => p.status === "completed" && p.publiclyShared).length === 0 && (
                            <div className="text-center py-6">
                              <p className="text-muted-foreground">
                                No public solutions available yet.
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                {/* Participants Tab */}
                <TabsContent value="participants" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Participants ({participants.length})</CardTitle>
                      <CardDescription>
                        {challenge.maxParticipants
                          ? `${participants.length} / ${challenge.maxParticipants} spots filled`
                          : "Anyone can join this challenge"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {participants.length > 0 ? (
                        <div className="space-y-4">
                          {sortedParticipants.map((participant) => (
                            <div key={participant.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarImage src={participant.user?.profileImage} />
                                  <AvatarFallback>{participant.user?.name.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{participant.user?.name || "Anonymous"}</div>
                                  <div className="text-xs text-muted-foreground flex items-center">
                                    <span>Joined {new Date(participant.joinedAt).toLocaleDateString()}</span>
                                    {participant.status === "completed" && participant.completedAt && (
                                      <span className="ml-2">• Completed {new Date(participant.completedAt).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <Badge 
                                variant={participant.status === "completed" ? "default" : "outline"}
                                className={participant.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}
                              >
                                {participant.status.replace("-", " ")}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground mb-4">
                            No one has joined this challenge yet. Be the first!
                          </p>
                          {!hasJoined && challenge.isActive && !isEnded && (
                            <Button onClick={joinChallenge}>
                              Join Challenge
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Discussions Tab */}
                <TabsContent value="discussions" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Discussion ({comments.length})</CardTitle>
                      <CardDescription>
                        Share your thoughts, ask questions, and discuss the challenge
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...commentForm}>
                        <form onSubmit={commentForm.handleSubmit(onSubmitComment)} className="space-y-4 mb-6">
                          <FormField
                            control={commentForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    placeholder="Add to the discussion..."
                                    rows={3}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-between items-center">
                            <FormField
                              control={commentForm.control}
                              name="isPublic"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="leading-none">
                                    <FormLabel className="text-sm">
                                      Make this comment public
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                            
                            <Button 
                              type="submit"
                              size="sm"
                              disabled={addCommentMutation.isPending}
                            >
                              {addCommentMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="mr-2 h-4 w-4" />
                                  Post
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                      
                      <Separator className="my-4" />
                      
                      {comments.length > 0 ? (
                        <div className="space-y-6">
                          {comments.map((comment) => (
                            <div key={comment.id} className="border-b pb-4 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage src={comment.user?.profileImage} />
                                    <AvatarFallback>{comment.user?.name.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{comment.user?.name || "Anonymous"}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(comment.createdAt).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                {!comment.isPublic && (
                                  <Badge variant="outline" className="text-xs">Private</Badge>
                                )}
                              </div>
                              
                              <p className="text-sm">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground">
                            No comments yet. Start the discussion!
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Challenge Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Challenge Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Created by</h3>
                    {challenge.creator ? (
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={challenge.creator.profileImage} />
                          <AvatarFallback>{challenge.creator.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{challenge.creator.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Started</h3>
                    <span>{new Date(challenge.startDate).toLocaleDateString()}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Ends</h3>
                    <span>{new Date(challenge.endDate).toLocaleDateString()}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Participants</h3>
                    <span>{participants.length} {challenge.maxParticipants ? `/ ${challenge.maxParticipants}` : ''}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Status</h3>
                    {challenge.isActive && !isEnded ? (
                      <Badge>Active</Badge>
                    ) : isEnded ? (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Ended
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Top Participants */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  {participants.filter(p => p.status === "completed").length > 0 ? (
                    <div className="space-y-4">
                      {participants
                        .filter(p => p.status === "completed")
                        .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
                        .slice(0, 5)
                        .map((participant, index) => (
                          <div key={participant.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-6 text-sm font-medium text-muted-foreground">
                                #{index + 1}
                              </div>
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={participant.user?.profileImage} />
                                <AvatarFallback>{participant.user?.name.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{participant.user?.name || "Anonymous"}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(participant.completedAt!).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">
                        No one has completed this challenge yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Share Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Share Challenge</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Share this challenge with friends and colleagues
                    </p>
                    
                    <div className="flex justify-between">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => shareToSocialMedia('facebook')}
                            >
                              <Facebook className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Share on Facebook</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => shareToSocialMedia('twitter')}
                            >
                              <Twitter className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Share on Twitter</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => shareToSocialMedia('linkedin')}
                            >
                              <Linkedin className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Share on LinkedIn</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={copyShareLink}
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy link</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Submit Solution Dialog */}
      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Your Solution</DialogTitle>
            <DialogDescription>
              Share your achievement and complete the challenge
            </DialogDescription>
          </DialogHeader>
          
          <Form {...submissionForm}>
            <form onSubmit={submissionForm.handleSubmit(onSubmitSubmission)} className="space-y-6">
              <FormField
                control={submissionForm.control}
                name="submissionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solution Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe how you solved the challenge..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Explain your approach and what you learned
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={submissionForm.control}
                name="submissionUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project URL (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                          <LinkIcon className="h-4 w-4" />
                        </span>
                        <Input 
                          placeholder="https://github.com/yourusername/project" 
                          className="rounded-l-none"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Link to your project, repository, or demo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={submissionForm.control}
                name="publiclyShared"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Make my solution publicly visible
                      </FormLabel>
                      <FormDescription>
                        Allow others to see your solution approach and submission
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsSubmissionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={submitChallengeMutation.isPending}
                >
                  {submitChallengeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : "Complete Challenge"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Challenge</DialogTitle>
            <DialogDescription>
              Share this challenge with your network
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <div className="rounded-md border p-2 text-sm">
                {shareUrl}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-auto self-end"
                onClick={copyShareLink}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Share on social media</h4>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => shareToSocialMedia('facebook')}
                >
                  <Facebook className="mr-2 h-4 w-4" />
                  Facebook
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => shareToSocialMedia('twitter')}
                >
                  <Twitter className="mr-2 h-4 w-4" />
                  Twitter
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => shareToSocialMedia('linkedin')}
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  LinkedIn
                </Button>
              </div>
            </div>
            
            {hasCompleted && userParticipation?.publiclyShared && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Share your achievement</h4>
                  <p className="text-sm text-muted-foreground">
                    You've completed this challenge! Share your achievement with your social network.
                  </p>
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      className="flex-1"
                      onClick={() => shareToSocialMedia('twitter')}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Achievement
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsShareDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}