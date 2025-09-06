import { useState } from 'react';
import React from 'react';
import { router, Link } from '@inertiajs/react';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CollectionsSidebar from '@/components/CollectionsSidebar';
import HistorySidebar from '@/components/HistorySidebar';
import EnvironmentSelector from '@/components/EnvironmentSelector';
import SettingsModal from '@/components/SettingsModal';
import { setLoggingOut } from '@/lib/api';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
    User as UserIcon, 
    Settings, 
    LogOut, 
    History,
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen
} from 'lucide-react';

interface PostmanLayoutProps {
    user: User;
    collections?: any[];
    environments?: Environment[];
    children: React.ReactNode;
}

interface ApiRequest {
    id: number;
    name: string;
    method: string;
    url: string;
    description?: string;
    position: number;
    headers?: Array<{key: string; value: string; isActive: boolean}>;
    params?: Array<{key: string; value: string; isActive: boolean}>;
    body?: {
        type: string;
        content: string;
    };
}

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

interface Environment {
    id: number;
    name: string;
    is_active: boolean;
    variables?: any[];
    created_at: string;
    updated_at: string;
}

export default function PostmanLayout({ user, collections = [], environments = [], children }: PostmanLayoutProps) {
    const [showCollectionsSidebar, setShowCollectionsSidebar] = useState(true);
    const [showHistorySidebar, setShowHistorySidebar] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ApiRequest | null>(null);
    const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(null);

    const handleLogout = () => {
        // Set global flag to prevent API calls during logout
        setLoggingOut(true);
        
        router.post('/logout', {}, {
            forceFormData: true,
            onSuccess: () => {
                // Redirect will be handled by the server
            },
            onError: (errors) => {
                console.error('Logout error:', errors);
                // Reset the flag if logout fails
                setLoggingOut(false);
            },
            onFinish: () => {
                // Reset the flag when logout process is complete (success or failure)
                setLoggingOut(false);
            }
        });
    };

    const handleRequestSelect = async (request: ApiRequest) => {
        try {
            // Fetch full request details including headers, params, and body
            const response = await fetch(`/api/requests/${request.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const fullRequest = await response.json();
                
                // Transform the API response to match our interface
                const requestWithDetails: ApiRequest = {
                    ...request,
                    headers: fullRequest.headers?.map((header: any) => ({
                        key: header.key,
                        value: header.value,
                        isActive: true
                    })) || [],
                    params: fullRequest.params?.map((param: any) => ({
                        key: param.key,
                        value: param.value,
                        isActive: true
                    })) || [],
                    body: fullRequest.body ? {
                        type: fullRequest.body.type || 'JSON',
                        content: fullRequest.body.content || ''
                    } : undefined
                };
                
                setSelectedRequest(requestWithDetails);
            } else {
                // Fallback to basic request data if fetch fails
                setSelectedRequest(request);
            }
        } catch (error) {
            console.error('Failed to fetch full request details:', error);
            // Fallback to basic request data
            setSelectedRequest(request);
        }
    };

    const handleRequestReplay = (history: RequestHistory) => {
        // Convert history item back to a request and load it in the request builder
        try {
            const requestData = JSON.parse(history.request_data);
            setSelectedRequest({
                id: 0, // Temporary ID for history items
                name: `${history.method} ${history.url}`,
                method: history.method,
                url: history.url,
                description: `Replayed from history - ${history.created_at}`,
                position: 0
            });
            
            // Close history sidebar after replay
            setShowHistorySidebar(false);
        } catch (error) {
            console.error('Failed to replay request:', error);
        }
    };

    const handleRequestSave = (history: RequestHistory) => {
        // Open a dialog to save history item to a collection
        // This would need to be implemented with a save dialog
        console.log('Save request to collection:', history);
    };

    const handleEnvironmentChange = (environment: Environment | null) => {
        setActiveEnvironment(environment);
        // You can use this to update variable interpolation in the request builder
    };

    return (
        <div className="min-h-screen flex w-full bg-background">
            {/* Left Sidebar - Collections */}
            {showCollectionsSidebar && (
                <CollectionsSidebar 
                    collections={collections}
                    onRequestSelect={handleRequestSelect}
                    selectedRequestId={selectedRequest?.id}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="border-b bg-background">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            {/* Sidebar toggles */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCollectionsSidebar(!showCollectionsSidebar)}
                                    className="p-2"
                                >
                                    {showCollectionsSidebar ? (
                                        <PanelLeftClose className="h-4 w-4" />
                                    ) : (
                                        <PanelLeftOpen className="h-4 w-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                                    className="p-2"
                                >
                                    {showHistorySidebar ? (
                                        <PanelRightClose className="h-4 w-4" />
                                    ) : (
                                        <PanelRightOpen className="h-4 w-4" />
                                    )}
                                    <History className="h-4 w-4 ml-1" />
                                </Button>
                            </div>

                            <h1 className="text-lg font-semibold">API Tester</h1>
                            
                            {/* Active Request Indicator */}
                            {selectedRequest && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
                                    <Badge 
                                        variant={
                                            selectedRequest.method === 'GET' ? 'default' :
                                            selectedRequest.method === 'POST' ? 'secondary' :
                                            selectedRequest.method === 'DELETE' ? 'destructive' : 'outline'
                                        }
                                        className="text-xs"
                                    >
                                        {selectedRequest.method}
                                    </Badge>
                                    <span className="text-sm font-medium truncate max-w-xs">
                                        {selectedRequest.name}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Environment Selector */}
                            <EnvironmentSelector 
                                environments={environments}
                                onEnvironmentChange={handleEnvironmentChange} 
                            />

                            {/* Active Environment Display */}
                            {activeEnvironment && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {activeEnvironment.name}
                                </Badge>
                            )}

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4" />
                                        <span className="text-sm">{user?.name || 'User'}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        {user?.email || ''}
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard" className="cursor-pointer">
                                            <UserIcon className="h-4 w-4 mr-2" />
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onClick={() => setShowSettingsModal(true)}
                                        className="cursor-pointer"
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        onClick={handleLogout}
                                        className="cursor-pointer text-red-600"
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden">
                    {React.isValidElement(children) ? 
                        React.cloneElement(children, { selectedRequest } as any) : 
                        children
                    }
                </main>
            </div>

            {/* Right Sidebar - History */}
            {showHistorySidebar && (
                <HistorySidebar 
                    isOpen={showHistorySidebar}
                    onRequestReplay={handleRequestReplay}
                    onRequestSave={handleRequestSave}
                />
            )}

            {/* Settings Modal */}
            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                user={user}
                mustVerifyEmail={false} // You might want to make this dynamic based on user model
            />
        </div>
    );
}
