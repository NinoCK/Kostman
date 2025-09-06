import { useState } from 'react';
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
import { Plus, X, Play, Save, Copy, Clock, Database } from 'lucide-react';

interface RequestBuilderProps {
    initialRequest?: {
        method?: string;
        url?: string;
        name?: string;
    };
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

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const BODY_TYPES = ['JSON', 'Form Data', 'Raw', 'Binary'];

// Default headers for common API requests
const DEFAULT_HEADERS: Header[] = [
    { id: 'default-1', key: 'Content-Type', value: 'application/json', isActive: true },
    { id: 'default-2', key: 'Accept', value: 'application/json', isActive: true },
    { id: 'default-3', key: 'User-Agent', value: 'Kostman-API-Tester/1.0', isActive: true },
    { id: 'empty-1', key: '', value: '', isActive: true }
];

export default function RequestBuilder({ initialRequest }: RequestBuilderProps) {
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
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HTTP_METHODS.map((m) => (
                                            <SelectItem key={m} value={m}>
                                                <Badge variant={
                                                    m === 'GET' ? 'secondary' :
                                                    m === 'POST' ? 'default' :
                                                    m === 'PUT' ? 'outline' :
                                                    m === 'DELETE' ? 'destructive' : 'outline'
                                                }>
                                                    {m}
                                                </Badge>
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
                                    <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">
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
