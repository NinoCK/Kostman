import { Head } from '@inertiajs/react';
import PostmanLayout from '@/layouts/postman-layout';
import RequestBuilder from '@/components/RequestBuilder';
import { User } from '@/types';

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

interface ApiTesterProps {
    user: User;
    collections?: any[];
    environments?: any[];
    selectedRequest?: ApiRequest; // This will be injected by PostmanLayout
}

export default function ApiTester({ user, collections = [], environments = [], selectedRequest }: ApiTesterProps) {
    return (
        <PostmanLayout 
            user={user}
            collections={collections}
            environments={environments}
        >
            <Head title="API Tester" />
            <RequestBuilder 
                collections={collections}
                initialRequest={selectedRequest ? {
                    method: selectedRequest.method,
                    url: selectedRequest.url,
                    name: selectedRequest.name,
                    headers: selectedRequest.headers,
                    params: selectedRequest.params,
                    body: selectedRequest.body
                } : undefined} 
            />
        </PostmanLayout>
    );
}
