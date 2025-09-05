import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
    History,
    Clock,
    MoreVertical,
    Play,
    Save,
    Trash,
    RefreshCw
} from 'lucide-react';

interface RequestHistory {
    id: number;
    method: string;
    url: string;
    request_data: any;
    response_data: any;
    response_time: number;
    response_status: number;
    created_at: string;
}

interface HistorySidebarProps {
    isOpen: boolean;
    onRequestReplay?: (history: RequestHistory) => void;
    onRequestSave?: (history: RequestHistory) => void;
}

export default function HistorySidebar({ 
    isOpen, 
    onRequestReplay,
    onRequestSave 
}: HistorySidebarProps) {
    const [history, setHistory] = useState<RequestHistory[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/history', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = async () => {
        try {
            const response = await fetch('/api/history', {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                setHistory([]);
            }
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };

    const deleteHistoryItem = async (historyId: number) => {
        try {
            const response = await fetch(`/api/history/${historyId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                setHistory(prev => prev.filter(h => h.id !== historyId));
            }
        } catch (error) {
            console.error('Failed to delete history item:', error);
        }
    };

    const getStatusBadgeVariant = (status: number) => {
        if (status >= 200 && status < 300) return 'default';
        if (status >= 300 && status < 400) return 'secondary';
        if (status >= 400) return 'destructive';
        return 'outline';
    };

    const getMethodBadgeVariant = (method: string) => {
        switch (method.toUpperCase()) {
            case 'GET': return 'default';
            case 'POST': return 'secondary';
            case 'PUT': return 'outline';
            case 'PATCH': return 'outline';
            case 'DELETE': return 'destructive';
            default: return 'outline';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const truncateUrl = (url: string, maxLength: number = 40) => {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    };

    if (!isOpen) return null;

    return (
        <div className="w-80 border-l bg-muted/20">
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        <h2 className="font-semibold">History</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={fetchHistory}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={clearHistory}
                                >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Clear All History
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* History List */}
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-2">
                        {loading && history.length === 0 ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-20 bg-muted rounded-md"></div>
                                    </div>
                                ))}
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No history yet</p>
                                <p className="text-xs">Your API requests will appear here</p>
                            </div>
                        ) : (
                            history.map((item) => (
                                <Card key={item.id} className="group relative">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge 
                                                    variant={getMethodBadgeVariant(item.method)}
                                                    className="text-xs px-1 py-0"
                                                >
                                                    {item.method}
                                                </Badge>
                                                <Badge 
                                                    variant={getStatusBadgeVariant(item.response_status)}
                                                    className="text-xs px-1 py-0"
                                                >
                                                    {item.response_status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {item.response_time}ms
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent className="pt-0 pb-3">
                                        <div className="space-y-2">
                                            <div className="text-sm font-mono truncate" title={item.url}>
                                                {truncateUrl(item.url)}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTimeAgo(item.created_at)}
                                                </span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => onRequestReplay?.(item)}
                                                    >
                                                        <Play className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => onRequestSave?.(item)}
                                                    >
                                                        <Save className="h-3 w-3" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <MoreVertical className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => onRequestReplay?.(item)}
                                                            >
                                                                <Play className="h-4 w-4 mr-2" />
                                                                Replay Request
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => onRequestSave?.(item)}
                                                            >
                                                                <Save className="h-4 w-4 mr-2" />
                                                                Save to Collection
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => deleteHistoryItem(item.id)}
                                                            >
                                                                <Trash className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
