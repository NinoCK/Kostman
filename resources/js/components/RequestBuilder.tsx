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

export default function RequestBuilder({ initialRequest }: RequestBuilderProps) {
    const [method, setMethod] = useState(initialRequest?.method || 'GET');
    const [url, setUrl] = useState(initialRequest?.url || '');
    const [requestName, setRequestName] = useState(initialRequest?.name || '');
    const [headers, setHeaders] = useState<Header[]>([
        { id: '1', key: '', value: '', isActive: true }
    ]);
    const [params, setParams] = useState<Param[]>([
        { id: '1', key: '', value: '', isActive: true }
    ]);
    const [bodyType, setBodyType] = useState('JSON');
    const [bodyContent, setBodyContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);

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

    const executeRequest = async () => {
        setIsLoading(true);
        try {
            const requestData = {
                method,
                url,
                headers: headers.filter(h => h.key && h.value),
                params: params.filter(p => p.key && p.value),
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
        } catch (error) {
            console.error('Request failed:', error);
            setResponse({ error: 'Request failed' });
        } finally {
            setIsLoading(false);
        }
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
                                    <Button variant="outline" size="sm" onClick={addHeader}>
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
                                            {response.response.time}ms
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
