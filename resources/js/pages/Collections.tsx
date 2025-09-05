import { Head, Link, useForm } from '@inertiajs/react';
import PostmanLayout from '@/layouts/postman-layout';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Folder,
    Plus,
    Search,
    Globe2,
    Lock,
    Calendar,
    MoreVertical,
    Edit,
    Trash2,
    Share2,
    Copy,
    Play
} from 'lucide-react';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface Collection {
    id: number;
    name: string;
    description?: string;
    is_public: boolean;
    request_count: number;
    created_at: string;
    updated_at: string;
}

interface CollectionsProps {
    user: User;
    collections: Collection[];
}

export default function Collections({ user, collections }: CollectionsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        is_public: false,
    });

    const filteredCollections = collections.filter(collection =>
        collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateCollection = (e: React.FormEvent) => {
        e.preventDefault();
        post('/api/collections', {
            onSuccess: () => {
                setShowCreateDialog(false);
                reset();
            },
        });
    };

    const handleDeleteCollection = (id: number) => {
        if (confirm('Are you sure you want to delete this collection?')) {
            // This would be handled by an Inertia delete request
            console.log('Delete collection:', id);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <PostmanLayout user={user}>
            <Head title="Collections" />
            
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
                        <p className="text-muted-foreground">
                            Organize your API requests into collections
                        </p>
                    </div>

                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Collection
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleCreateCollection}>
                                <DialogHeader>
                                    <DialogTitle>Create New Collection</DialogTitle>
                                    <DialogDescription>
                                        Create a new collection to organize your API requests.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="My Collection"
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-500">{errors.name}</p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description (Optional)</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Describe what this collection is for..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="visibility">Visibility</Label>
                                        <Select value={data.is_public ? 'public' : 'private'} onValueChange={(value) => setData('is_public', value === 'public')}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="private">
                                                    <div className="flex items-center gap-2">
                                                        <Lock className="h-4 w-4" />
                                                        Private - Only you can access
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="public">
                                                    <div className="flex items-center gap-2">
                                                        <Globe2 className="h-4 w-4" />
                                                        Public - Anyone with link can access
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Collection'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search collections..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Collections Grid */}
                {filteredCollections.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCollections.map((collection) => (
                            <Card key={collection.id} className="group hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                <Folder className="h-4 w-4" />
                                                {collection.name}
                                                {collection.is_public ? (
                                                    <Globe2 className="h-3 w-3 text-muted-foreground" />
                                                ) : (
                                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                                )}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2">
                                                {collection.description || 'No description provided'}
                                            </CardDescription>
                                        </div>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/collections/${collection.id}`}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Share2 className="h-4 w-4 mr-2" />
                                                    Share
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => handleDeleteCollection(collection.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <Badge variant="secondary" className="text-xs">
                                                {collection.request_count} {collection.request_count === 1 ? 'request' : 'requests'}
                                            </Badge>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(collection.updated_at)}
                                            </div>
                                        </div>
                                        
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/collections/${collection.id}`}>
                                                <Play className="h-3 w-3 mr-1" />
                                                Open
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        {searchQuery ? (
                            <>
                                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No collections found</h3>
                                <p className="text-muted-foreground mb-4">
                                    No collections match your search for "{searchQuery}"
                                </p>
                                <Button variant="outline" onClick={() => setSearchQuery('')}>
                                    Clear Search
                                </Button>
                            </>
                        ) : (
                            <>
                                <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first collection to organize your API requests
                                </p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Collection
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </PostmanLayout>
    );
}
