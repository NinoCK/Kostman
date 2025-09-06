import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, Play, Save, Copy, Clock, Database, BookOpen } from 'lucide-react';

interface RequestBuilderProps {
    initialRequest?: {
        method?: string;
        url?: string;
        name?: string;
        headers?: Array<{key: string; value: string; isActive: boolean}>;
        params?: Array<{key: string; value: string; isActive: boolean}>;
        body?: {
            type: string;
            content: string;
        };
    };
    collections?: Collection[];
}

interface Header {
    id: string;
    key: string;
    value: string;
    isActive: boolean;
}

interface Param {
    id: string;
    key: string;
    value: string;
    isActive: boolean;
}

interface Collection {
    id: number;
    name: string;
    description?: string;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const BODY_TYPES = ['JSON', 'Form Data', 'Raw', 'Binary'];

// HTTP method color mapping
const getMethodColor = (method: string): string => {
    switch (method) {
        case 'GET': return 'text-green-600 bg-green-50 border-green-200';
        case 'POST': return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'PUT': return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'PATCH': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'DELETE': return 'text-red-600 bg-red-50 border-red-200';
        case 'HEAD': return 'text-purple-600 bg-purple-50 border-purple-200';
        case 'OPTIONS': return 'text-gray-600 bg-gray-50 border-gray-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
};

// Default headers for common API requests
const DEFAULT_HEADERS: Header[] = [
    { id: 'default-1', key: 'Content-Type', value: 'application/json', isActive: true },
    { id: 'default-2', key: 'Accept', value: 'application/json', isActive: true },
    { id: 'default-3', key: 'User-Agent', value: 'Kostman-API-Tester/1.0', isActive: true },
    { id: 'empty-1', key: '', value: '', isActive: true }
];

export default function RequestBuilder({ initialRequest, collections = [] }: RequestBuilderProps) {
    const [method, setMethod] = useState(initialRequest?.method || 'GET');
    const [url, setUrl] = useState(initialRequest?.url || '');
    const [requestName, setRequestName] = useState(initialRequest?.name || '');
    const [headers, setHeaders] = useState<Header[]>(DEFAULT_HEADERS);
    const [params, setParams] = useState<Param[]>([
        { id: '1', key: '', value: '', isActive: true }
    ]);
    const [bodyType, setBodyType] = useState('JSON');
    const [bodyContent, setBodyContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [errorDetails, setErrorDetails] = useState<any>(null);
    
    // Save to Collection state
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize CSRF cookie on component mount
    useEffect(() => {
        const initializeCSRF = async () => {
            try {
                await fetch('/sanctum/csrf-cookie', {
                    credentials: 'include',
                });
            } catch (error) {
                console.warn('Failed to initialize CSRF cookie:', error);
            }
        };
        
        initializeCSRF();
    }, []);

    // Auto-fill from initialRequest when it changes
    useEffect(() => {
        if (initialRequest) {
            if (initialRequest.method) setMethod(initialRequest.method);
            if (initialRequest.url) setUrl(initialRequest.url);
            if (initialRequest.name) setRequestName(initialRequest.name);
            
            // Auto-fill headers
            if (initialRequest.headers && initialRequest.headers.length > 0) {
                const filledHeaders = [
                    ...initialRequest.headers.map((header, index) => ({
                        id: `filled-${index}`,
                        key: header.key,
                        value: header.value,
                        isActive: header.isActive
                    })),
                    { id: 'empty-after-fill', key: '', value: '', isActive: true }
                ];
                setHeaders(filledHeaders);
            }
            
            // Auto-fill params
            if (initialRequest.params && initialRequest.params.length > 0) {
                const filledParams = [
                    ...initialRequest.params.map((param, index) => ({
                        id: `filled-param-${index}`,
                        key: param.key,
                        value: param.value,
                        isActive: param.isActive
                    })),
                    { id: 'empty-param-after-fill', key: '', value: '', isActive: true }
                ];
                setParams(filledParams);
            }
            
            // Auto-fill body
            if (initialRequest.body) {
                setBodyType(initialRequest.body.type.toUpperCase());
                setBodyContent(initialRequest.body.content);
            }
        }
    }, [initialRequest]);

    // Initialize collection selection when collections prop is available
    useEffect(() => {
        if (collections.length > 0 && !selectedCollectionId) {
            setSelectedCollectionId(collections[0].id.toString());
        }
    }, [collections, selectedCollectionId]);

    const saveToCollection = async () => {
        if (!selectedCollectionId || !requestName.trim() || !url.trim()) {
            return;
        }

        setIsSaving(true);
        try {
            const activeHeaders = headers.filter(h => h.key.trim() && h.isActive);
            const activeParams = params.filter(p => p.key.trim() && p.isActive);

            const requestData = {
                collection_id: parseInt(selectedCollectionId),
                name: requestName.trim(),
                method,
                url,
                description: `Saved from API Tester at ${new Date().toLocaleString()}`,
                headers: activeHeaders.map(h => ({
                    key: h.key,
                    value: h.value,
                    is_active: h.isActive
                })),
                params: activeParams.map(p => ({
                    key: p.key,
                    value: p.value,
                    is_active: p.isActive
                })),
                body: bodyContent.trim() || null
            };

            const response = await fetch('/api/requests', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                setSaveDialogOpen(false);
                // You could add a success notification here
                console.log('Request saved successfully');
            } else {
                const errorData = await response.json();
                console.error('Failed to save request:', errorData);
            }
        } catch (error) {
            console.error('Error saving request:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const addHeader = () => {
        const newHeader: Header = {
            id: Date.now().toString(),
            key: '',
            value: '',
            isActive: true
        };
        setHeaders([...headers, newHeader]);
    };

    const removeHeader = (id: string) => {
        setHeaders(headers.filter(h => h.id !== id));
    };

    const updateHeader = (id: string, field: keyof Header, value: string | boolean) => {
        setHeaders(headers.map(h => 
            h.id === id ? { ...h, [field]: value } : h
        ));
    };

    const addParam = () => {
        const newParam: Param = {
            id: Date.now().toString(),
            key: '',
            value: '',
            isActive: true
        };
        setParams([...params, newParam]);
    };

    const removeParam = (id: string) => {
        setParams(params.filter(p => p.id !== id));
    };

    const updateParam = (id: string, field: keyof Param, value: string | boolean) => {
        setParams(params.map(p => 
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    // Reset headers to defaults
    const resetToDefaultHeaders = () => {
        setHeaders([...DEFAULT_HEADERS]);
    };

    // Add preset header combinations
    const addPresetHeaders = (preset: string) => {
        const newHeaders = [...headers.filter(h => h.key && h.value)];
        
        switch (preset) {
            case 'json-api':
                newHeaders.push(
                    { id: Date.now().toString(), key: 'Content-Type', value: 'application/json', isActive: true },
                    { id: (Date.now() + 1).toString(), key: 'Accept', value: 'application/json', isActive: true }
                );
                break;
            case 'form-data':
                newHeaders.push(
                    { id: Date.now().toString(), key: 'Content-Type', value: 'application/x-www-form-urlencoded', isActive: true }
                );
                break;
            case 'cors':
                newHeaders.push(
                    { id: Date.now().toString(), key: 'Access-Control-Allow-Origin', value: '*', isActive: true },
                    { id: (Date.now() + 1).toString(), key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS', isActive: true }
                );
                break;
        }
        
        newHeaders.push({ id: (Date.now() + 10).toString(), key: '', value: '', isActive: true });
        setHeaders(newHeaders);
    };

    const executeRequest = async () => {
        setIsLoading(true);
        setErrorDetails(null);
        try {
            const requestData = {
                method,
                url,
                headers: headers.filter(h => h.key && h.value && h.isActive),
                params: params.filter(p => p.key && p.value && p.isActive),
                body: bodyContent ? {
                    type: bodyType.toLowerCase().replace(' ', '-'),
                    content: bodyContent
                } : null
            };

            const response = await fetch('/api/requests/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            setResponse(result);
            
            if (!result.success && result.error) {
                setErrorDetails({
                    message: result.error,
                    type: getErrorType(result.error),
                    suggestions: getErrorSuggestions(result.error)
                });
            }
        } catch (error: any) {
            console.error('Request failed:', error);
            const errorMessage = error.message || 'Network request failed';
            setResponse({ 
                success: false, 
                error: errorMessage,
                time: 0
            });
            setErrorDetails({
                message: errorMessage,
                type: getErrorType(errorMessage),
                suggestions: getErrorSuggestions(errorMessage)
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to categorize error types
    const getErrorType = (errorMessage: string): string => {
        if (errorMessage.includes('cURL error 60') || errorMessage.includes('SSL') || errorMessage.includes('certificate')) {
            return 'ssl';
        } else if (errorMessage.includes('cURL error 6') || errorMessage.includes('Could not resolve host')) {
            return 'dns';
        } else if (errorMessage.includes('cURL error 7') || errorMessage.includes('Failed to connect')) {
            return 'connection';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('cURL error 28')) {
            return 'timeout';
        } else if (errorMessage.includes('cURL error')) {
            return 'curl';
        }
        return 'general';
    };

    // Helper function to provide error-specific suggestions
    const getErrorSuggestions = (errorMessage: string): string[] => {
        const suggestions: string[] = [];
        
        if (errorMessage.includes('cURL error 60') || errorMessage.includes('SSL') || errorMessage.includes('certificate')) {
            suggestions.push('SSL certificate verification failed. This is common with self-signed certificates or local development APIs.');
            suggestions.push('For HTTPS APIs, ensure the server has a valid SSL certificate.');
            suggestions.push('For testing purposes, you may need to configure SSL verification settings.');
        } else if (errorMessage.includes('cURL error 6') || errorMessage.includes('Could not resolve host')) {
            suggestions.push('Domain name could not be resolved. Check if the URL is correct.');
            suggestions.push('Verify your internet connection and DNS settings.');
        } else if (errorMessage.includes('cURL error 7') || errorMessage.includes('Failed to connect')) {
            suggestions.push('Connection to the server failed. Check if the server is running.');
            suggestions.push('Verify the port number and protocol (HTTP/HTTPS) are correct.');
        } else if (errorMessage.includes('timeout')) {
            suggestions.push('Request timed out. The server may be slow or unresponsive.');
            suggestions.push('Try increasing the timeout value or check server status.');
        }
        
        if (suggestions.length === 0) {
            suggestions.push('Check the URL format and ensure the API endpoint is accessible.');
            suggestions.push('Verify network connectivity and try again.');
        }
        
        return suggestions;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto p-6">
                <div className="space-y-6">
                    {/* Request Name */}
                    <div>
                        <Label htmlFor="requestName">Request Name</Label>
                        <Input
                            id="requestName"
                            value={requestName}
                            onChange={(e) => setRequestName(e.target.value)}
                            placeholder="My Request"
                            className="mt-1"
                        />
                    </div>

                    {/* URL and Method */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Play className="h-4 w-4" />
                                Request
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger className="w-32">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getMethodColor(method)}`}>
                                            {method}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HTTP_METHODS.map((m) => (
                                            <SelectItem key={m} value={m}>
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getMethodColor(m)}`}>
                                                    {m}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://api.example.com/users"
                                    className="flex-1"
                                />
                                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="px-6" disabled={!url.trim()}>
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            Save
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Save Request to Collection</DialogTitle>
                                            <DialogDescription>
                                                Save this request to a collection for future use.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="request-name" className="text-right">
                                                    Name
                                                </Label>
                                                <Input
                                                    id="request-name"
                                                    value={requestName}
                                                    onChange={(e) => setRequestName(e.target.value)}
                                                    placeholder="My API Request"
                                                    className="col-span-3"
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="collection-select" className="text-right">
                                                    Collection
                                                </Label>
                                                <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                                                    <SelectTrigger className="col-span-3">
                                                        <SelectValue placeholder="Select a collection" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {collections.map((collection) => (
                                                            <SelectItem key={collection.id} value={collection.id.toString()}>
                                                                {collection.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button 
                                                onClick={saveToCollection} 
                                                disabled={!requestName.trim() || !selectedCollectionId || isSaving}
                                            >
                                                {isSaving ? 'Saving...' : 'Save Request'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Button 
                                    onClick={executeRequest} 
                                    disabled={!url || isLoading}
                                    className="px-8"
                                >
                                    {isLoading ? 'Sending...' : 'Send'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Request Configuration Tabs */}
                    <Tabs defaultValue="params" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="params">Params</TabsTrigger>
                            <TabsTrigger value="headers">Headers</TabsTrigger>
                            <TabsTrigger value="body">Body</TabsTrigger>
                            <TabsTrigger value="auth">Auth</TabsTrigger>
                        </TabsList>

                        <TabsContent value="params" className="space-y-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Query Parameters</CardTitle>
                                    <Button variant="outline" size="sm" onClick={addParam}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12"></TableHead>
                                                <TableHead>Key</TableHead>
                                                <TableHead>Value</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {params.map((param) => (
                                                <TableRow key={param.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={param.isActive}
                                                            onCheckedChange={(checked) => 
                                                                updateParam(param.id, 'isActive', !!checked)
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={param.key}
                                                            onChange={(e) => updateParam(param.id, 'key', e.target.value)}
                                                            placeholder="Key"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={param.value}
                                                            onChange={(e) => updateParam(param.id, 'value', e.target.value)}
                                                            placeholder="Value"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeParam(param.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="headers" className="space-y-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Headers</CardTitle>
                                    <div className="flex gap-2">
                                        <Select onValueChange={addPresetHeaders}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue placeholder="Add Preset" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="json-api">JSON API</SelectItem>
                                                <SelectItem value="form-data">Form Data</SelectItem>
                                                <SelectItem value="cors">CORS Headers</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="sm" onClick={resetToDefaultHeaders}>
                                            Reset to Default
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={addHeader}>
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12"></TableHead>
                                                <TableHead>Key</TableHead>
                                                <TableHead>Value</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {headers.map((header) => (
                                                <TableRow key={header.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={header.isActive}
                                                            onCheckedChange={(checked) => 
                                                                updateHeader(header.id, 'isActive', !!checked)
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={header.key}
                                                            onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                                                            placeholder="Content-Type"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={header.value}
                                                            onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                                                            placeholder="application/json"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeHeader(header.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="body" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Request Body</CardTitle>
                                        <Select value={bodyType} onValueChange={setBodyType}>
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BODY_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={bodyContent}
                                        onChange={(e) => setBodyContent(e.target.value)}
                                        placeholder={bodyType === 'JSON' ? '{\n  "key": "value"\n}' : 'Request body content'}
                                        className="min-h-[200px] font-mono"
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="auth" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Authentication</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">Authentication settings coming soon...</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Response Section */}
            {response && (
                <div className="border-t bg-muted/20 p-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    Response
                                </CardTitle>
                                {response.response && (
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {response.response.time || response.time}ms
                                        </div>
                                        <Badge variant={
                                            response.response.status < 300 ? 'default' :
                                            response.response.status < 400 ? 'secondary' :
                                            'destructive'
                                        }>
                                            {response.response.status}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!response.success && errorDetails && (
                                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className="mt-0.5">
                                            <svg className="h-4 w-4 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-destructive mb-1">Request Failed</h4>
                                            <p className="text-sm text-destructive/80 mb-3">{errorDetails.message}</p>
                                            {errorDetails.suggestions && errorDetails.suggestions.length > 0 && (
                                                <div>
                                                    <h5 className="font-medium text-sm mb-2">Suggestions:</h5>
                                                    <ul className="text-sm space-y-1">
                                                        {errorDetails.suggestions.map((suggestion: string, index: number) => (
                                                            <li key={index} className="flex items-start gap-2">
                                                                <span className="text-destructive/60">•</span>
                                                                <span>{suggestion}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <Tabs defaultValue="body" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="body">Body</TabsTrigger>
                                    <TabsTrigger value="headers">Headers</TabsTrigger>
                                </TabsList>
                                <TabsContent value="body">
                                    <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                                        {response.success ? 
                                            JSON.stringify(JSON.parse(response.response.body || '{}'), null, 2) : 
                                            response.error
                                        }
                                    </pre>
                                </TabsContent>
                                <TabsContent value="headers">
                                    {response.response?.headers && (
                                        <div className="space-y-2">
                                            {Object.entries(response.response.headers).map(([key, value]) => (
                                                <div key={key} className="flex text-sm">
                                                    <span className="font-medium w-1/3">{key}:</span>
                                                    <span className="text-muted-foreground">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
