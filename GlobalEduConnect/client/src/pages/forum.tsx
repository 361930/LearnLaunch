import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ForumPost } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus,
  MessageCircle,
  Search,
  Filter,
  Clock,
  Eye,
  ThumbsUp,
  Reply,
  Flag,
  Loader2,
  MessagesSquare,
  Users,
  PanelLeftClose
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

// Form schema for creating a post
const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  forumType: z.enum(["student", "teacher"]),
});

// Form schema for creating a reply
const replySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty"),
});

type PostFormValues = z.infer<typeof postSchema>;
type ReplyFormValues = z.infer<typeof replySchema>;

export default function ForumPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("student");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  
  // Get posts for the active forum type
  const { data: posts = [], isLoading: isPostsLoading } = useQuery<ForumPost[]>({
    queryKey: [`/api/forum/${activeTab}`],
    enabled: !!activeTab,
  });

  // Get post details if a post is selected
  const { data: postDetails, isLoading: isPostDetailsLoading } = useQuery<ForumPost>({
    queryKey: [`/api/forum/posts/${selectedPost?.id}`],
    enabled: !!selectedPost,
  });

  // Create post form
  const postForm = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      forumType: activeTab as "student" | "teacher",
    },
  });

  // Update form value when tab changes
  useState(() => {
    postForm.setValue("forumType", activeTab as "student" | "teacher");
  });

  // Reply form
  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: "",
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormValues) => {
      const res = await apiRequest("POST", "/api/forum/posts", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forum/${activeTab}`] });
      toast({
        title: "Success",
        description: "Your post has been created",
      });
      setIsCreatePostDialogOpen(false);
      postForm.reset({
        title: "",
        content: "",
        forumType: activeTab as "student" | "teacher",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async (data: { content: string; parentId: number }) => {
      const res = await apiRequest("POST", "/api/forum/replies", data);
      return await res.json();
    },
    onSuccess: () => {
      if (selectedPost) {
        queryClient.invalidateQueries({ queryKey: [`/api/forum/posts/${selectedPost.id}`] });
      }
      toast({
        title: "Success",
        description: "Your reply has been posted",
      });
      setIsReplyDialogOpen(false);
      replyForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "destructive",
      });
    },
  });

  const onSubmitPost = (data: PostFormValues) => {
    createPostMutation.mutate(data);
  };

  const onSubmitReply = (data: ReplyFormValues) => {
    if (!selectedPost) return;
    
    createReplyMutation.mutate({
      content: data.content,
      parentId: selectedPost.id,
    });
  };

  const openPostDetails = (post: ForumPost) => {
    setSelectedPost(post);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Add search functionality here
    toast({
      title: "Search",
      description: `Searching for "${searchQuery}"`,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const ForumPostCard = ({ post }: { post: ForumPost }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.profileImage} />
              <AvatarFallback>{post.author?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 
                className="font-medium text-lg hover:text-primary transition-colors cursor-pointer"
                onClick={() => openPostDetails(post)}
              >
                {post.title}
              </h3>
              <div className="flex flex-wrap items-center text-xs text-muted-foreground mt-1 gap-2">
                <span>{post.author?.name || "Anonymous"}</span>
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
                {post.author?.role && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {post.author.role.charAt(0).toUpperCase() + post.author.role.slice(1)}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
            <div className="flex items-center">
              <MessagesSquare className="h-4 w-4 mr-1" />
              <span>{post.replies?.length || 0}</span>
            </div>
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span>{Math.floor(Math.random() * 100)}</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm line-clamp-2">
          {post.content}
        </p>
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="text-xs h-8 px-2">
              <ThumbsUp className="h-4 w-4 mr-1" />
              Like
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-8 px-2"
              onClick={() => {
                openPostDetails(post);
                setIsReplyDialogOpen(true);
              }}
            >
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8 px-2"
            onClick={() => openPostDetails(post)}
          >
            Read More
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container max-w-7xl">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Post List Section */}
            <div className={`w-full ${selectedPost ? "hidden md:block md:w-2/5" : "md:w-3/4"}`}>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Community Forum</h1>
                <Button onClick={() => setIsCreatePostDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </div>
              
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => {
                  setActiveTab(value);
                  postForm.setValue("forumType", value as "student" | "teacher");
                }} 
                className="mb-6"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="student">Student Forum</TabsTrigger>
                  <TabsTrigger value="teacher">Teacher Forum</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="mb-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search posts..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </form>
              </div>
              
              {isPostsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : posts.length > 0 ? (
                <div>
                  {posts.map((post) => (
                    <ForumPostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/40">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Be the first to start a discussion in the {activeTab} forum
                    </p>
                    <Button onClick={() => setIsCreatePostDialogOpen(true)}>
                      Create First Post
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Post Detail Section */}
            {selectedPost && (
              <div className={`w-full ${selectedPost ? "md:w-3/5" : "hidden"}`}>
                <div className="sticky top-20">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Discussion Thread</h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedPost(null)}
                      className="md:hidden"
                    >
                      <PanelLeftClose className="h-4 w-4 mr-2" />
                      Back to List
                    </Button>
                  </div>
                  
                  {isPostDetailsLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : postDetails ? (
                    <div className="space-y-6">
                      {/* Original post */}
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={postDetails.author?.profileImage} />
                                <AvatarFallback>{postDetails.author?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{postDetails.author?.name || "Anonymous"}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(postDetails.createdAt)}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {postDetails.forumType === "student" ? "Student Forum" : "Teacher Forum"}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl mt-2">{postDetails.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose dark:prose-invert max-w-none">
                            <p>{postDetails.content}</p>
                          </div>
                        </CardContent>
                        <CardFooter className="border-t pt-4 flex justify-between">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Like
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setIsReplyDialogOpen(true)}
                            >
                              <Reply className="h-4 w-4 mr-1" />
                              Reply
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Flag className="h-4 w-4 mr-1" />
                            Report
                          </Button>
                        </CardFooter>
                      </Card>
                      
                      {/* Replies */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="font-medium">Replies</div>
                          <Badge className="ml-2">{postDetails.replies?.length || 0}</Badge>
                        </div>
                        
                        {postDetails.replies && postDetails.replies.length > 0 ? (
                          postDetails.replies.map((reply) => (
                            <Card key={reply.id} className="ml-6">
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={reply.author?.profileImage} />
                                      <AvatarFallback>{reply.author?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{reply.author?.name || "Anonymous"}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {formatDate(reply.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <p>{reply.content}</p>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                  <Button variant="ghost" size="sm">
                                    <ThumbsUp className="h-4 w-4 mr-1" />
                                    Like
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Flag className="h-4 w-4 mr-1" />
                                    Report
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 bg-muted/40 rounded-lg">
                            <p className="text-muted-foreground">No replies yet. Be the first to reply!</p>
                          </div>
                        )}
                        
                        <div className="pt-4">
                          <Button 
                            className="w-full" 
                            onClick={() => setIsReplyDialogOpen(true)}
                          >
                            <Reply className="mr-2 h-4 w-4" />
                            Write a Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Post not found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Create Post Dialog */}
      <Dialog open={isCreatePostDialogOpen} onOpenChange={setIsCreatePostDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a New Post</DialogTitle>
            <DialogDescription>
              Share your thoughts, questions, or insights with the community
            </DialogDescription>
          </DialogHeader>
          
          <Form {...postForm}>
            <form onSubmit={postForm.handleSubmit(onSubmitPost)} className="space-y-6">
              <FormField
                control={postForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Give your post a title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={postForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your thoughts, questions, or insights"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={postForm.control}
                name="forumType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forum</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select forum" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student Forum</SelectItem>
                        <SelectItem value="teacher">Teacher Forum</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which forum to post in
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreatePostDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : "Post"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Discussion</DialogTitle>
            <DialogDescription>
              Add your thoughts to this conversation
            </DialogDescription>
          </DialogHeader>
          
          <Form {...replyForm}>
            <form onSubmit={replyForm.handleSubmit(onSubmitReply)} className="space-y-6">
              <FormField
                control={replyForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Reply</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your reply here..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsReplyDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createReplyMutation.isPending}
                >
                  {createReplyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting Reply...
                    </>
                  ) : "Post Reply"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}