import { Head, useForm } from '@inertiajs/react';
import PostmanLayout from '@/layouts/postman-layout';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    Globe,
    Plus,
    Search,
    Settings,
    Eye,
    EyeOff,
    Edit,
    Trash2,
    MoreVertical,
    Power,
    PowerOff,
    Key
} from 'lucide-react';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface Environment {
    id: number;
    name: string;
    is_active: boolean;
    variable_count: number;
    created_at: string;
    updated_at: string;
    variables?: EnvironmentVariable[];
}

interface EnvironmentVariable {
    id: number;
    key: string;
    initial_value: string;
    current_value: string;
    is_secret: boolean;
}

interface EnvironmentsProps {
    user: User;
    environments: Environment[];
}

export default function Environments({ user, environments }: EnvironmentsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
    const [showVariables, setShowVariables] = useState<{ [key: string]: boolean }>({});
    
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
    });

    const filteredEnvironments = environments.filter(env =>
        env.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateEnvironment = (e: React.FormEvent) => {
        e.preventDefault();
        post('/api/environments', {
            onSuccess: () => {
                setShowCreateDialog(false);
                reset();
            },
        });
    };

    const handleActivateEnvironment = (id: number) => {
        fetch(`/api/environments/${id}/activate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            credentials: 'include',
        }).then(() => {
            // Refresh page or update state
            window.location.reload();
        });
    };

    const handleDeleteEnvironment = (id: number) => {
        if (confirm('Are you sure you want to delete this environment?')) {
            fetch(`/api/environments/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'include',
            }).then(() => {
                window.location.reload();
            });
        }
    };

    const toggleVariableVisibility = (envId: number) => {
        setShowVariables(prev => ({ ...prev, [envId]: !prev[envId] }));
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
            <Head title="Environments" />
            
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Environments</h1>
                        <p className="text-muted-foreground">
                            Manage environment variables for different deployment stages
                        </p>
                    </div>

                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Environment
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleCreateEnvironment}>
                                <DialogHeader>
                                    <DialogTitle>Create New Environment</DialogTitle>
                                    <DialogDescription>
                                        Create a new environment to manage variables for different stages.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Environment Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g., Development, Staging, Production"
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-500">{errors.name}</p>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Environment'}
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
                        placeholder="Search environments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Environments List */}
                {filteredEnvironments.length > 0 ? (
                    <div className="space-y-4">
                        {filteredEnvironments.map((environment) => (
                            <Card key={environment.id} className="group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Globe className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg">{environment.name}</CardTitle>
                                                    {environment.is_active && (
                                                        <Badge className="bg-green-100 text-green-800">
                                                            <Power className="h-3 w-3 mr-1" />
                                                            Active
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardDescription>
                                                    {environment.variable_count} variables • Last updated {formatDate(environment.updated_at)}
                                                </CardDescription>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!environment.is_active && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleActivateEnvironment(environment.id)}
                                                >
                                                    <Power className="h-4 w-4 mr-1" />
                                                    Activate
                                                </Button>
                                            )}
                                            
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleVariableVisibility(environment.id)}
                                            >
                                                {showVariables[environment.id] ? (
                                                    <>
                                                        <EyeOff className="h-4 w-4 mr-1" />
                                                        Hide Variables
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Show Variables
                                                    </>
                                                )}
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit Environment
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Key className="h-4 w-4 mr-2" />
                                                        Manage Variables
                                                    </DropdownMenuItem>
                                                    {environment.is_active ? (
                                                        <DropdownMenuItem>
                                                            <PowerOff className="h-4 w-4 mr-2" />
                                                            Deactivate
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleActivateEnvironment(environment.id)}>
                                                            <Power className="h-4 w-4 mr-2" />
                                                            Activate
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => handleDeleteEnvironment(environment.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardHeader>
                                
                                {showVariables[environment.id] && environment.variables && (
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium">Environment Variables</h4>
                                                <Button size="sm" variant="outline">
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add Variable
                                                </Button>
                                            </div>
                                            
                                            {environment.variables.length > 0 ? (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Variable</TableHead>
                                                            <TableHead>Initial Value</TableHead>
                                                            <TableHead>Current Value</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead className="w-[100px]">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {environment.variables.map((variable) => (
                                                            <TableRow key={variable.id}>
                                                                <TableCell className="font-mono font-medium">
                                                                    {variable.key}
                                                                </TableCell>
                                                                <TableCell className="font-mono text-muted-foreground">
                                                                    {variable.is_secret ? '•••••••••' : variable.initial_value}
                                                                </TableCell>
                                                                <TableCell className="font-mono">
                                                                    {variable.is_secret ? '•••••••••' : variable.current_value}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={variable.is_secret ? 'secondary' : 'outline'} className="text-xs">
                                                                        {variable.is_secret ? 'Secret' : 'Text'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="sm">
                                                                                <MoreVertical className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem>
                                                                                <Edit className="h-4 w-4 mr-2" />
                                                                                Edit
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem className="text-red-600">
                                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            ) : (
                                                <div className="text-center py-8 border rounded-lg">
                                                    <Key className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                                                    <p className="text-muted-foreground">No variables defined</p>
                                                    <Button size="sm" className="mt-2">
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Add First Variable
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        {searchQuery ? (
                            <>
                                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No environments found</h3>
                                <p className="text-muted-foreground mb-4">
                                    No environments match your search for "{searchQuery}"
                                </p>
                                <Button variant="outline" onClick={() => setSearchQuery('')}>
                                    Clear Search
                                </Button>
                            </>
                        ) : (
                            <>
                                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No environments yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first environment to manage variables for different deployment stages
                                </p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Environment
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </PostmanLayout>
    );
}
