import { useState, useEffect } from 'react';
import { router, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
    Plus, 
    FolderOpen, 
    Folder, 
    FileText, 
    MoreVertical, 
    Edit, 
    Trash, 
    Share2,
    ChevronDown,
    ChevronRight,
    Globe,
    Lock
} from 'lucide-react';
import { api } from '@/lib/api';

interface Collection {
    id: number;
    name: string;
    description?: string;
    is_public: boolean;
    folders?: Folder[];
    root_requests?: ApiRequest[];
    created_at: string;
    updated_at: string;
}

interface Folder {
    id: number;
    name: string;
    description?: string;
    position: number;
    requests?: ApiRequest[];
}

interface ApiRequest {
    id: number;
    name: string;
    method: string;
    url: string;
    description?: string;
    position: number;
}

interface CollectionsSidebarProps {
    collections?: Collection[];
    onRequestSelect?: (request: ApiRequest) => void;
    selectedRequestId?: number;
    // Add these new props for flexibility
    showCreateButton?: boolean;
    showRequestActions?: boolean;
    variant?: 'sidebar' | 'dashboard' | 'collections';
    onCollectionSelect?: (collection: Collection) => void;
}

export default function CollectionsSidebar({ 
    collections: initialCollections = [], 
    onRequestSelect,
    selectedRequestId,
    showCreateButton = true,
    showRequestActions = true,
    variant = 'sidebar',
    onCollectionSelect
}: CollectionsSidebarProps) {
    const [collections, setCollections] = useState<Collection[]>(initialCollections);
    const [expandedCollections, setExpandedCollections] = useState<Set<number>>(new Set());
    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
    const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', description: '', is_public: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update collections when props change
    useEffect(() => {
        setCollections(initialCollections);
        // Auto-expand collections that have root requests to make them more discoverable
        if (initialCollections.length > 0) {
            const collectionsWithRequests = initialCollections
                .filter(collection => collection.root_requests && collection.root_requests.length > 0)
                .map(collection => collection.id);
            
            if (collectionsWithRequests.length > 0) {
                setExpandedCollections(new Set(collectionsWithRequests));
            }
        }
    }, [initialCollections]);

    const createCollection = async () => {
        try {
            setLoading(true);
            setError(null);
            
            router.post('/collections', createForm, {
                onSuccess: () => {
                    setCreateForm({ name: '', description: '', is_public: false });
                    setIsCreateCollectionOpen(false);
                },
                onError: (errors) => {
                    console.error('Failed to create collection:', errors);
                    setError('Failed to create collection. Please try again.');
                },
                onFinish: () => {
                    setLoading(false);
                }
            });
        } catch (error) {
            console.error('Failed to create collection:', error);
            setError('Failed to create collection. Please try again.');
            setLoading(false);
        }
    };

    const deleteCollection = async (collectionId: number) => {
        if (!confirm('Are you sure you want to delete this collection?')) {
            return;
        }
        
        try {
            router.delete(`/collections/${collectionId}`, {
                onSuccess: () => {
                    // Collection list will be refreshed automatically by Inertia
                },
                onError: (errors) => {
                    console.error('Failed to delete collection:', errors);
                }
            });
        } catch (error) {
            console.error('Failed to delete collection:', error);
        }
    };

    const toggleCollection = (collectionId: number) => {
        setExpandedCollections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(collectionId)) {
                newSet.delete(collectionId);
            } else {
                newSet.add(collectionId);
            }
            return newSet;
        });
    };

    const toggleFolder = (folderId: number) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folderId)) {
                newSet.delete(folderId);
            } else {
                newSet.add(folderId);
            }
            return newSet;
        });
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

    const handleRequestClick = (request: ApiRequest) => {
        if (onRequestSelect) {
            onRequestSelect(request);
        }
    };

    const renderCollectionItem = (collection: Collection) => {
        if (variant === 'dashboard') {
            return (
                <Card key={collection.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-medium">{collection.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {collection.root_requests?.length || 0} requests
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {collection.is_public ? (
                                <Globe className="h-4 w-4 text-blue-500" />
                            ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onCollectionSelect?.(collection)}
                            >
                                Open
                            </Button>
                        </div>
                    </div>
                    
                    {/* Show recent requests in dashboard variant */}
                    <div className="space-y-2">
                        {collection.root_requests?.slice(0, 3).map((request) => (
                            <div 
                                key={request.id} 
                                className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                                onClick={() => handleRequestClick(request)}
                            >
                                <Badge variant={getMethodBadgeVariant(request.method)} className="text-xs">
                                    {request.method}
                                </Badge>
                                <span className="flex-1 truncate">{request.name}</span>
                            </div>
                        ))}
                        {collection.folders?.slice(0, 2).map((folder) => (
                            <div key={folder.id} className="ml-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                    <Folder className="h-3 w-3" />
                                    <span>{folder.name}</span>
                                </div>
                                {folder.requests?.slice(0, 2).map((request) => (
                                    <div 
                                        key={request.id}
                                        className="flex items-center gap-2 text-sm p-1 pl-4 rounded-md hover:bg-muted/50 cursor-pointer"
                                        onClick={() => handleRequestClick(request)}
                                    >
                                        <Badge variant={getMethodBadgeVariant(request.method)} className="text-xs">
                                            {request.method}
                                        </Badge>
                                        <span className="flex-1 truncate">{request.name}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </Card>
            );
        }

        // Default sidebar rendering
        return (
            <Collapsible 
                key={collection.id}
                open={expandedCollections.has(collection.id)}
                onOpenChange={() => toggleCollection(collection.id)}
            >
                <div className="group relative">
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 pr-8 rounded-md hover:bg-accent text-left">
                        {expandedCollections.has(collection.id) ? (
                            <ChevronDown className="h-3 w-3" />
                        ) : (
                            <ChevronRight className="h-3 w-3" />
                        )}
                        <FolderOpen className="h-4 w-4" />
                        <span className="flex-1 text-sm font-medium truncate">
                            {collection.name}
                        </span>
                        {collection.is_public ? (
                            <Globe className="h-3 w-3 text-blue-500" />
                        ) : (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                    </CollapsibleTrigger>

                    {showRequestActions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                >
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Share2 className="h-3 w-3 mr-2" />
                                    Share
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                    <Trash className="h-3 w-3 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <CollapsibleContent className="ml-2">
                    <div className="space-y-1">
                        {/* Root-level requests */}
                        {collection.root_requests?.map((request) => (
                            <div
                                key={request.id}
                                className={`flex items-center gap-2 p-1 pl-6 rounded-md hover:bg-accent cursor-pointer ${
                                    selectedRequestId === request.id ? 'bg-accent' : ''
                                }`}
                                onClick={() => handleRequestClick(request)}
                            >
                                <FileText className="h-3 w-3" />
                                <Badge 
                                    variant={getMethodBadgeVariant(request.method)}
                                    className="text-xs px-1 py-0"
                                >
                                    {request.method}
                                </Badge>
                                <span className="flex-1 text-xs truncate">
                                    {request.name}
                                </span>
                            </div>
                        ))}

                        {/* Folders and their requests */}
                        {collection.folders?.map((folder) => (
                            <Collapsible
                                key={folder.id}
                                open={expandedFolders.has(folder.id)}
                                onOpenChange={() => toggleFolder(folder.id)}
                            >
                                <CollapsibleTrigger className="flex items-center gap-2 w-full p-1 pl-4 rounded-md hover:bg-accent text-left">
                                    {expandedFolders.has(folder.id) ? (
                                        <ChevronDown className="h-3 w-3" />
                                    ) : (
                                        <ChevronRight className="h-3 w-3" />
                                    )}
                                    <Folder className="h-3 w-3" />
                                    <span className="flex-1 text-xs font-medium truncate">
                                        {folder.name}
                                    </span>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="ml-4">
                                    {folder.requests?.map((request) => (
                                        <div
                                            key={request.id}
                                            className={`flex items-center gap-2 p-1 pl-4 rounded-md hover:bg-accent cursor-pointer ${
                                                selectedRequestId === request.id ? 'bg-accent' : ''
                                            }`}
                                            onClick={() => handleRequestClick(request)}
                                        >
                                            <FileText className="h-3 w-3" />
                                            <Badge 
                                                variant={getMethodBadgeVariant(request.method)}
                                                className="text-xs px-1 py-0"
                                            >
                                                {request.method}
                                            </Badge>
                                            <span className="flex-1 text-xs truncate">
                                                {request.name}
                                            </span>
                                        </div>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        );
    };

    if (loading && collections.length === 0) {
        return (
            <div className="w-80 border-r bg-muted/20 p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    // Dashboard variant returns a different layout
    if (variant === 'dashboard') {
        return (
            <div className="space-y-4">
                {collections.length > 0 ? (
                    collections.map(renderCollectionItem)
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No collections yet</p>
                        <p className="text-sm">Create your first collection to organize your API requests</p>
                        {showCreateButton && (
                            <Button className="mt-4" asChild>
                                <Link href="/collections">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Collection
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-80 border-r bg-muted/20">
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-semibold">Collections</h2>
                    <Dialog open={isCreateCollectionOpen} onOpenChange={setIsCreateCollectionOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Collection</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Collection Name</Label>
                                    <Input
                                        id="name"
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="My API Collection"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Collection description..."
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="is_public"
                                        checked={createForm.is_public}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, is_public: e.target.checked }))}
                                    />
                                    <Label htmlFor="is_public">Make collection public</Label>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => setIsCreateCollectionOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={createCollection} disabled={!createForm.name}>
                                        Create Collection
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Error message */}
                {error && (
                    <div className="p-4 border-b bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {/* Collections Tree */}
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-1">
                        {collections.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No collections yet</p>
                                <p className="text-xs">Create your first collection to get started</p>
                            </div>
                        ) : (
                            collections.map((collection) => (
                                <Collapsible 
                                    key={collection.id}
                                    open={expandedCollections.has(collection.id)}
                                    onOpenChange={() => toggleCollection(collection.id)}
                                >
                                    <div className="group relative">
                                        <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 pr-8 rounded-md hover:bg-accent text-left">
                                            {expandedCollections.has(collection.id) ? (
                                                <ChevronDown className="h-3 w-3" />
                                            ) : (
                                                <ChevronRight className="h-3 w-3" />
                                            )}
                                            <FolderOpen className="h-4 w-4" />
                                            <span className="flex-1 text-sm font-medium truncate">
                                                {collection.name}
                                            </span>
                                            {collection.is_public ? (
                                                <Globe className="h-3 w-3 text-blue-500" />
                                            ) : (
                                                <Lock className="h-3 w-3 text-muted-foreground" />
                                            )}
                                        </CollapsibleTrigger>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Share2 className="h-4 w-4 mr-2" />
                                                    Share
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-red-600"
                                                    onClick={() => deleteCollection(collection.id)}
                                                >
                                                    <Trash className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <CollapsibleContent className="ml-4">
                                        <div className="space-y-1">
                                            {/* Root requests (requests not in folders) */}
                                            {collection.root_requests?.map((request) => (
                                                <div
                                                    key={request.id}
                                                    className={`group relative flex items-center gap-2 p-1 pl-4 pr-8 rounded-md hover:bg-accent cursor-pointer ${
                                                        selectedRequestId === request.id ? 'bg-accent' : ''
                                                    }`}
                                                    onClick={() => handleRequestClick(request)}
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    <Badge 
                                                        variant={getMethodBadgeVariant(request.method)}
                                                        className="text-xs px-1 py-0"
                                                    >
                                                        {request.method}
                                                    </Badge>
                                                    <span className="flex-1 text-xs truncate">
                                                        {request.name}
                                                    </span>
                                                    
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="absolute right-1 top-0.5 opacity-0 group-hover:opacity-100 h-5 w-5 p-0"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreVertical className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => handleRequestClick(request)}
                                                            >
                                                                <Edit className="h-3 w-3 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    // TODO: Implement duplicate request
                                                                    console.log('Duplicate request:', request.id);
                                                                }}
                                                            >
                                                                <FileText className="h-3 w-3 mr-2" />
                                                                Duplicate
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    // TODO: Implement delete request
                                                                    console.log('Delete request:', request.id);
                                                                }}
                                                            >
                                                                <Trash className="h-3 w-3 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            ))}
                                            
                                            {/* Show empty state if no requests */}
                                            {(!collection.root_requests || collection.root_requests.length === 0) && (
                                                <div className="pl-4 py-2 text-xs text-muted-foreground italic">
                                                    No requests in this collection
                                                </div>
                                            )}

                                            {/* Folders */}
                                            {collection.folders?.map((folder) => (
                                                <Collapsible
                                                    key={folder.id}
                                                    open={expandedFolders.has(folder.id)}
                                                    onOpenChange={() => toggleFolder(folder.id)}
                                                >
                                                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-1 pl-2 rounded-md hover:bg-accent text-left">
                                                        {expandedFolders.has(folder.id) ? (
                                                            <ChevronDown className="h-3 w-3" />
                                                        ) : (
                                                            <ChevronRight className="h-3 w-3" />
                                                        )}
                                                        <Folder className="h-3 w-3" />
                                                        <span className="flex-1 text-xs font-medium truncate">
                                                            {folder.name}
                                                        </span>
                                                    </CollapsibleTrigger>

                                                    <CollapsibleContent className="ml-4">
                                                        {folder.requests?.map((request) => (
                                                            <div
                                                                key={request.id}
                                                                className={`flex items-center gap-2 p-1 pl-4 rounded-md hover:bg-accent cursor-pointer ${
                                                                    selectedRequestId === request.id ? 'bg-accent' : ''
                                                                }`}
                                                                onClick={() => handleRequestClick(request)}
                                                            >
                                                                <FileText className="h-3 w-3" />
                                                                <Badge 
                                                                    variant={getMethodBadgeVariant(request.method)}
                                                                    className="text-xs px-1 py-0"
                                                                >
                                                                    {request.method}
                                                                </Badge>
                                                                <span className="flex-1 text-xs truncate">
                                                                    {request.name}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
