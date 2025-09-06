import { Head, Link } from '@inertiajs/react';
import PostmanLayout from '@/layouts/postman-layout';
import CollectionsSidebar from '@/components/CollectionsSidebar';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Activity,
    Folder,
    Globe,
    Clock,
    TrendingUp,
    Plus,
    Play,
    BookOpen
} from 'lucide-react';

interface DashboardProps {
    user: User;
    collections?: any[];
    environments?: any[];
    stats?: {
        total_collections: number;
        total_requests: number;
        total_environments: number;
        requests_this_week: number;
        recent_collections: Array<{
            id: number;
            name: string;
            request_count: number;
            updated_at: string;
        }>;
        recent_history: Array<{
            id: number;
            method: string;
            url: string;
            response_status: number;
            response_time: number;
            created_at: string;
        }>;
    };
}

export default function Dashboard({ user, collections = [], environments = [], stats }: DashboardProps) {
    // Default stats if not provided
    const defaultStats = {
        total_collections: 0,
        total_requests: 0,
        total_environments: 1,
        requests_this_week: 0,
        recent_collections: [],
        recent_history: []
    };
    
    const currentStats = stats || defaultStats;

    const getMethodColor = (method: string) => {
        switch (method.toUpperCase()) {
            case 'GET': return 'bg-green-100 text-green-800';
            case 'POST': return 'bg-blue-100 text-blue-800';
            case 'PUT': return 'bg-yellow-100 text-yellow-800';
            case 'PATCH': return 'bg-orange-100 text-orange-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-green-600';
        if (status >= 300 && status < 400) return 'text-yellow-600';
        if (status >= 400) return 'text-red-600';
        return 'text-gray-600';
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        
        if (diffInHours < 1) return 'Less than an hour ago';
        if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return '1 day ago';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <PostmanLayout 
            user={user}
            collections={collections}
            environments={environments}
        >
            <Head title="Dashboard" />
            
            <div className="p-6 space-y-6">
                {/* Welcome Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome back, {user.name}!
                    </h1>
                    <p className="text-muted-foreground">
                        Here's an overview of your API testing activity.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Collections
                            </CardTitle>
                            <Folder className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currentStats.total_collections}</div>
                            <p className="text-xs text-muted-foreground">
                                Organized request groups
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Requests
                            </CardTitle>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currentStats.total_requests}</div>
                            <p className="text-xs text-muted-foreground">
                                Saved API endpoints
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Environments
                            </CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currentStats.total_environments}</div>
                            <p className="text-xs text-muted-foreground">
                                Variable configurations
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                This Week
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currentStats.requests_this_week}</div>
                            <p className="text-xs text-muted-foreground">
                                Requests executed
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Get started with common tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <Button asChild>
                                <Link href="/api-tester">
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Testing APIs
                                </Link>
                            </Button>
                            <Button variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Collection
                            </Button>
                            <Button variant="outline">
                                <Activity className="h-4 w-4 mr-2" />
                                Manage Environments
                            </Button>
                            <Button variant="outline">
                                <BookOpen className="h-4 w-4 mr-2" />
                                View Documentation
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Collections */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Collections</CardTitle>
                                <CardDescription>
                                    Your recently updated collections and requests
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/collections">View All</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <CollectionsSidebar
                                collections={(collections || []).slice(0, 5)}
                                variant="dashboard"
                                showCreateButton={(collections || []).length === 0}
                                showRequestActions={false}
                                onCollectionSelect={(collection) => {
                                    // Navigate to collection detail or API tester
                                    window.location.href = `/api-tester?collection=${collection.id}`;
                                }}
                                onRequestSelect={(request) => {
                                    // Navigate to API tester with specific request
                                    window.location.href = `/api-tester?request=${request.id}`;
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>
                                    Your latest API requests
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/api-tester">View All</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {currentStats.recent_history.length > 0 ? (
                                    currentStats.recent_history.map((request) => (
                                        <div key={request.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge 
                                                        className={`text-xs ${getMethodColor(request.method)}`}
                                                        variant="secondary"
                                                    >
                                                        {request.method}
                                                    </Badge>
                                                    <span 
                                                        className={`text-sm font-medium ${getStatusColor(request.response_status)}`}
                                                    >
                                                        {request.response_status}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {request.response_time}ms
                                                    </span>
                                                </div>
                                                <p className="text-sm font-mono text-muted-foreground truncate">
                                                    {request.url}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTimeAgo(request.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No recent activity</p>
                                        <p className="text-sm">Start making API requests to see your activity here</p>
                                        <Button className="mt-4" asChild>
                                            <Link href="/api-tester">
                                                <Play className="h-4 w-4 mr-2" />
                                                Start Testing
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PostmanLayout>
    );
}
