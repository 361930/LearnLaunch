import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { User, Class, Report, Announcement } from "@/lib/types";
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
  Bell,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  BookOpen,
  Flag,
  CheckCircle,
  XCircle,
  MessageCircle,
  Settings,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash,
  Clock,
  Loader2,
  LucideIcon,
  CalendarClock,
  CheckSquare
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

// Form schema for announcement creation
const announcementSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  targetRole: z.enum(["all", "student", "teacher"]),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState("pending");
  const [reportAdminNotes, setReportAdminNotes] = useState("");

  // Fetch stats
  const { data: stats, isLoading: isStatsLoading } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch users
  const { data: users = [], isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch pending approvals
  const { data: pendingUsers = [], isLoading: isPendingUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users/pending"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch reports
  const { data: reports = [], isLoading: isReportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch classes
  const { data: classes = [], isLoading: isClassesLoading } = useQuery<Class[]>({
    queryKey: ["/api/admin/classes"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch announcements
  const { data: announcements = [], isLoading: isAnnouncementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    enabled: !!user && user.role === "admin",
  });

  // Create announcement form
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      targetRole: "all",
      isPinned: false,
    },
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormValues) => {
      await apiRequest("POST", "/api/admin/announcements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({
        title: "Success",
        description: "Announcement has been created",
      });
      setIsAnnouncementDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/pending"] });
      toast({
        title: "Success",
        description: "User status has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  // Update report status mutation
  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ reportId, status, adminNotes }: { reportId: number; status: string; adminNotes?: string }) => {
      await apiRequest("PATCH", `/api/admin/reports/${reportId}`, { status, adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: "Success",
        description: "Report status has been updated",
      });
      setIsReportDialogOpen(false);
      setSelectedReport(null);
      setReportStatus("pending");
      setReportAdminNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update report status",
        variant: "destructive",
      });
    },
  });

  const onSubmitAnnouncement = (data: AnnouncementFormValues) => {
    createAnnouncementMutation.mutate(data);
  };

  const approveUser = (userId: number) => {
    updateUserStatusMutation.mutate({ userId, status: "active" });
  };

  const rejectUser = (userId: number) => {
    updateUserStatusMutation.mutate({ userId, status: "blocked" });
  };

  const openReportDialog = (report: Report) => {
    setSelectedReport(report);
    setReportStatus(report.status);
    setReportAdminNotes(report.adminNotes || "");
    setIsReportDialogOpen(true);
  };

  const updateReportStatus = () => {
    if (!selectedReport) return;
    
    updateReportStatusMutation.mutate({
      reportId: selectedReport.id,
      status: reportStatus,
      adminNotes: reportAdminNotes
    });
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="mb-6">You need to be logged in as an admin to access this page.</p>
            <Button asChild>
              <Link href="/auth">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = isStatsLoading || isUsersLoading || isPendingUsersLoading || isReportsLoading || isClassesLoading || isAnnouncementsLoading;

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

  // Calculate stats if not provided by API
  const totalUsers = users.length;
  const totalClasses = classes.length;
  const totalReports = reports.length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const pendingReports = reports.filter(r => r.status === "pending").length;

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description 
  }: { 
    title: string; 
    value: number | string; 
    icon: LucideIcon; 
    description?: string 
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between space-x-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
            {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage users, classes, reports, and platform settings
            </p>
          </div>
          
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard 
              title="Total Users" 
              value={totalUsers} 
              icon={Users} 
              description={`${activeUsers} active users`}
            />
            <StatCard 
              title="Pending Approvals" 
              value={pendingUsers.length} 
              icon={UserCheck} 
            />
            <StatCard 
              title="Total Classes" 
              value={totalClasses} 
              icon={BookOpen} 
              description={`${classes.filter(c => c.isLive).length} live classes`}
            />
            <StatCard 
              title="Active Reports" 
              value={pendingReports} 
              icon={Flag} 
              description={`${totalReports} total reports`}
            />
          </div>
          
          {/* Dashboard Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid grid-cols-2 md:w-auto md:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Pending Approvals Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>
                      Teacher accounts awaiting approval
                    </CardDescription>
                  </div>
                  {pendingUsers.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {pendingUsers.length} pending
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {pendingUsers.length > 0 ? (
                    <div className="space-y-4">
                      {pendingUsers.map((pendingUser) => (
                        <div key={pendingUser.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={pendingUser.profileImage} />
                              <AvatarFallback>{pendingUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{pendingUser.name}</div>
                              <div className="text-sm text-muted-foreground">{pendingUser.email}</div>
                              <div className="flex items-center mt-1">
                                <Badge variant="outline" className="text-xs">{pendingUser.role}</Badge>
                                <span className="text-xs text-muted-foreground ml-2">
                                  Registered on {new Date(pendingUser.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => rejectUser(pendingUser.id)}
                            >
                              <XCircle className="mr-1.5 h-4 w-4" />
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => approveUser(pendingUser.id)}
                            >
                              <CheckCircle className="mr-1.5 h-4 w-4" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p>No pending approvals at this time</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recent Reports Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>
                      Recent user reports that need attention
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="ml-auto"
                  >
                    <Link href="#" onClick={() => setActiveTab("reports")}>
                      View All
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {reports.filter(r => r.status === "pending").length > 0 ? (
                    <div className="space-y-4">
                      {reports
                        .filter(r => r.status === "pending")
                        .slice(0, 3)
                        .map((report) => (
                          <div key={report.id} className="border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium flex items-center">
                                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                                {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1).replace(/-/g, ' ')}
                              </div>
                              <Badge variant="outline">
                                {report.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {report.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-muted-foreground">
                                Reported {new Date(report.createdAt).toLocaleDateString()}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openReportDialog(report)}
                              >
                                Review
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p>No pending reports at this time</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recent Activity Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Recent actions and events on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Activity item 1 */}
                    <div className="flex">
                      <div className="flex-shrink-0 mr-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                          <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Teacher account approved
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          New teacher account for "John Smith" has been approved
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(Date.now() - 3 * 60 * 60 * 1000).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Activity item 2 */}
                    <div className="flex">
                      <div className="flex-shrink-0 mr-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          New class created
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          New class "Advanced Mathematics" has been created
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(Date.now() - 8 * 60 * 60 * 1000).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Activity item 3 */}
                    <div className="flex">
                      <div className="flex-shrink-0 mr-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                          <Flag className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Report resolved
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Report #1082 has been resolved
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage all users on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search users..." className="pl-9" />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="student">Students</SelectItem>
                          <SelectItem value="teacher">Teachers</SelectItem>
                          <SelectItem value="admin">Admins</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="active">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.slice(0, 10).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.profileImage} />
                                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className={`h-2 w-2 rounded-full mr-2 ${
                                  user.status === 'active' ? 'bg-green-500' : 
                                  user.status === 'pending' ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`} />
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <span className="sr-only">Open menu</span>
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                      <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                    </svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/profile/${user.id}`}>
                                      View Profile
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {user.status === "active" ? (
                                    <DropdownMenuItem onClick={() => updateUserStatusMutation.mutate({ userId: user.id, status: "blocked" })}>
                                      Block User
                                    </DropdownMenuItem>
                                  ) : user.status === "blocked" ? (
                                    <DropdownMenuItem onClick={() => updateUserStatusMutation.mutate({ userId: user.id, status: "active" })}>
                                      Unblock User
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => updateUserStatusMutation.mutate({ userId: user.id, status: "active" })}>
                                      Approve User
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="flex justify-end">
                      <Button variant="outline" className="mx-2">Previous</Button>
                      <Button variant="outline">Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reports Management</CardTitle>
                  <CardDescription>
                    Manage and resolve reports submitted by users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search reports..." className="pl-9" />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="abuse">Abuse</SelectItem>
                          <SelectItem value="inappropriate-content">Inappropriate Content</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="pending">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Reported By</TableHead>
                          <TableHead>Reported Entity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.length > 0 ? (
                          reports.map((report) => (
                            <TableRow key={report.id}>
                              <TableCell>#{report.id}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1).replace(/-/g, ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">Reporter #{report.reporterId}</div>
                              </TableCell>
                              <TableCell>
                                {report.reportedUserId ? (
                                  <div>User #{report.reportedUserId}</div>
                                ) : report.reportedClassId ? (
                                  <div>Class #{report.reportedClassId}</div>
                                ) : (
                                  <div>Unknown</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    report.status === "resolved" ? "default" :
                                    report.status === "dismissed" ? "destructive" :
                                    report.status === "reviewed" ? "secondary" :
                                    "outline"
                                  }
                                >
                                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(report.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openReportDialog(report)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6">
                              <p className="text-muted-foreground">No reports found</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    
                    <div className="flex justify-end">
                      <Button variant="outline" className="mx-2">Previous</Button>
                      <Button variant="outline">Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Report Review Dialog */}
              <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Report Review</DialogTitle>
                    <DialogDescription>
                      Review and update the status of this report
                    </DialogDescription>
                  </DialogHeader>
                  
                  {selectedReport && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Report ID</h4>
                          <p className="text-sm">#{selectedReport.id}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Report Type</h4>
                          <Badge variant="outline">
                            {selectedReport.reportType.charAt(0).toUpperCase() + selectedReport.reportType.slice(1).replace(/-/g, ' ')}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Reporter</h4>
                          <p className="text-sm">User #{selectedReport.reporterId}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Reported Entity</h4>
                          <p className="text-sm">
                            {selectedReport.reportedUserId ? (
                              <>User #{selectedReport.reportedUserId}</>
                            ) : selectedReport.reportedClassId ? (
                              <>Class #{selectedReport.reportedClassId}</>
                            ) : (
                              <>Unknown</>
                            )}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Created</h4>
                          <p className="text-sm">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Current Status</h4>
                          <Badge
                            variant={
                              selectedReport.status === "resolved" ? "default" :
                              selectedReport.status === "dismissed" ? "destructive" :
                              selectedReport.status === "reviewed" ? "secondary" :
                              "outline"
                            }
                          >
                            {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm p-3 border rounded-md bg-muted/40">{selectedReport.description}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Update Status</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Button 
                              variant={reportStatus === "pending" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setReportStatus("pending")}
                            >
                              Pending
                            </Button>
                            <Button 
                              variant={reportStatus === "reviewed" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setReportStatus("reviewed")}
                            >
                              Reviewed
                            </Button>
                            <Button 
                              variant={reportStatus === "resolved" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setReportStatus("resolved")}
                            >
                              Resolved
                            </Button>
                            <Button 
                              variant={reportStatus === "dismissed" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setReportStatus("dismissed")}
                            >
                              Dismissed
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Admin Notes</h4>
                          <Textarea 
                            placeholder="Enter your notes about this report and actions taken..."
                            rows={4}
                            value={reportAdminNotes}
                            onChange={(e) => setReportAdminNotes(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsReportDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={updateReportStatus}
                      disabled={updateReportStatusMutation.isPending}
                    >
                      {updateReportStatusMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Report"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            {/* Announcements Tab */}
            <TabsContent value="announcements" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Platform Announcements</h3>
                <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Announcement</DialogTitle>
                      <DialogDescription>
                        Create a new announcement to inform users about important updates or events.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitAnnouncement)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Announcement title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Announcement content"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="targetRole"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Target Audience</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    <SelectItem value="student">Students Only</SelectItem>
                                    <SelectItem value="teacher">Teachers Only</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Who should see this announcement
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="expiresAt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expiry Date (Optional)</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormDescription>
                                  When this announcement should expire
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="isPinned"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Pin Announcement
                                </FormLabel>
                                <FormDescription>
                                  Pinned announcements appear at the top
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAnnouncementDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit"
                            disabled={createAnnouncementMutation.isPending}
                          >
                            {createAnnouncementMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : "Publish Announcement"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {announcements.length > 0 ? (
                      <div className="space-y-6">
                        {/* Pinned Announcements */}
                        {announcements.filter(a => a.isPinned).length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium flex items-center">
                              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2">
                                <path d="M13.5 7.5C13.5 10.7 10.925 13.5 7.5 13.5C4.075 13.5 1.5 10.7 1.5 7.5C1.5 4.3 4.075 1.5 7.5 1.5C10.925 1.5 13.5 4.3 13.5 7.5Z" stroke="currentColor" strokeWidth="1.5"/>
                              </svg>
                              Pinned Announcements
                            </h4>
                            {announcements
                              .filter(a => a.isPinned)
                              .map(announcement => (
                                <div key={announcement.id} className="border-l-4 border-primary pl-4 py-1">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium">{announcement.title}</h3>
                                    <div className="flex items-center">
                                      <Badge variant="outline" className="mr-2">
                                        {announcement.targetRole === "all" ? "All Users" : 
                                         announcement.targetRole === "student" ? "Students" : "Teachers"}
                                      </Badge>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                              <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                            </svg>
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            <Trash className="mr-2 h-4 w-4" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {announcement.content}
                                  </p>
                                  <div className="flex items-center text-xs text-muted-foreground mt-2">
                                    <CalendarClock className="h-3 w-3 mr-1" />
                                    Created on {new Date(announcement.createdAt).toLocaleDateString()}
                                    {announcement.expiresAt && (
                                      <span className="ml-3">
                                        Expires on {new Date(announcement.expiresAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                        
                        {/* Regular Announcements */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Recent Announcements</h4>
                          {announcements
                            .filter(a => !a.isPinned)
                            .map(announcement => (
                              <div key={announcement.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-medium">{announcement.title}</h3>
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="mr-2">
                                      {announcement.targetRole === "all" ? "All Users" : 
                                       announcement.targetRole === "student" ? "Students" : "Teachers"}
                                    </Badge>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                            <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                          </svg>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Trash className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {announcement.content}
                                </p>
                                <div className="flex items-center text-xs text-muted-foreground mt-2">
                                  <CalendarClock className="h-3 w-3 mr-1" />
                                  Created on {new Date(announcement.createdAt).toLocaleDateString()}
                                  {announcement.expiresAt && (
                                    <span className="ml-3">
                                      Expires on {new Date(announcement.expiresAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground mb-4">
                          No announcements have been created yet
                        </p>
                        <Button onClick={() => setIsAnnouncementDialogOpen(true)}>
                          Create First Announcement
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}