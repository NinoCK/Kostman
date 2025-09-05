import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Eye, EyeOff, MoreVertical, Edit, Trash, Globe } from 'lucide-react';
import { api } from '@/lib/api';

interface Environment {
    id: number;
    name: string;
    is_active: boolean;
    variables?: EnvironmentVariable[];
    created_at: string;
    updated_at: string;
}

interface EnvironmentVariable {
    id: number;
    key: string;
    initial_value: string;
    current_value: string;
    is_secret: boolean;
}

interface EnvironmentSelectorProps {
    environments?: Environment[];
    onEnvironmentChange?: (environment: Environment | null) => void;
}

export default function EnvironmentSelector({ environments: initialEnvironments = [], onEnvironmentChange }: EnvironmentSelectorProps) {
    const [environments, setEnvironments] = useState<Environment[]>(initialEnvironments);
    const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '' });
    const [showSecrets, setShowSecrets] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setEnvironments(initialEnvironments);
        
        // Set active environment
        const active = initialEnvironments.find((env: Environment) => env.is_active);
        if (active) {
            setActiveEnvironment(active);
            onEnvironmentChange?.(active);
        }
    }, [initialEnvironments, onEnvironmentChange]);

    const createEnvironment = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.post('/api/environments', createForm);
            setEnvironments(prev => [...prev, data.environment]);
            setCreateForm({ name: '' });
            setIsCreateOpen(false);
        } catch (error) {
            console.error('Failed to create environment:', error);
            setError('Failed to create environment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const activateEnvironment = async (environmentId: number) => {
        try {
            await api.post(`/api/environments/${environmentId}/activate`);
            
            // Update environments list
            setEnvironments(prev => prev.map(env => ({
                ...env,
                is_active: env.id === environmentId
            })));
            
            // Set as active
            const newActiveEnv = environments.find(env => env.id === environmentId);
            if (newActiveEnv) {
                const updatedEnv = { ...newActiveEnv, is_active: true };
                setActiveEnvironment(updatedEnv);
                onEnvironmentChange?.(updatedEnv);
            }
        } catch (error) {
            console.error('Failed to activate environment:', error);
        }
    };

    const deleteEnvironment = async (environmentId: number) => {
        try {
            await api.delete(`/api/environments/${environmentId}`);
            setEnvironments(prev => prev.filter(env => env.id !== environmentId));
            if (activeEnvironment?.id === environmentId) {
                setActiveEnvironment(null);
                onEnvironmentChange?.(null);
            }
        } catch (error) {
            console.error('Failed to delete environment:', error);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Select
                value={activeEnvironment?.id.toString() || 'none'}
                onValueChange={(value) => {
                    if (value && value !== 'none') {
                        activateEnvironment(parseInt(value));
                    } else {
                        setActiveEnvironment(null);
                        onEnvironmentChange?.(null);
                    }
                }}
            >
                <SelectTrigger className="w-[200px]">
                    <Globe className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="No Environment" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">No Environment</SelectItem>
                    {environments.map((environment) => (
                        <SelectItem key={environment.id} value={environment.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                                <span>{environment.name}</span>
                                {environment.is_active && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                        Active
                                    </Badge>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Environment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsManageOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Environments
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Create Environment Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Environment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Environment Name</Label>
                            <Input
                                id="name"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ name: e.target.value })}
                                placeholder="Development, Production, etc."
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={createEnvironment} disabled={!createForm.name.trim()}>
                                Create
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Manage Environments Dialog */}
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Manage Environments</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        {environments.map((environment) => (
                            <div key={environment.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium">{environment.name}</h3>
                                        {environment.is_active && (
                                            <Badge variant="secondary">Active</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={showSecrets ? "secondary" : "outline"}
                                            size="sm"
                                            onClick={() => setShowSecrets(!showSecrets)}
                                        >
                                            {showSecrets ? (
                                                <>
                                                    <EyeOff className="h-4 w-4 mr-2" />
                                                    Hide Values
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Show Values
                                                </>
                                            )}
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => deleteEnvironment(environment.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {environment.variables && environment.variables.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Variable</TableHead>
                                                <TableHead>Initial Value</TableHead>
                                                <TableHead>Current Value</TableHead>
                                                <TableHead className="w-[100px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {environment.variables.map((variable) => (
                                                <TableRow key={variable.id}>
                                                    <TableCell className="font-mono">{variable.key}</TableCell>
                                                    <TableCell className="font-mono">
                                                        {variable.is_secret && !showSecrets
                                                            ? '••••••••'
                                                            : variable.initial_value || '—'
                                                        }
                                                    </TableCell>
                                                    <TableCell className="font-mono">
                                                        {variable.is_secret && !showSecrets
                                                            ? '••••••••'
                                                            : variable.current_value || '—'
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600">
                                                                    <Trash className="h-4 w-4 mr-2" />
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
                                    <div className="text-center py-8 text-gray-500">
                                        No variables defined for this environment
                                    </div>
                                )}
                            </div>
                        ))}

                        {environments.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No environments found
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
