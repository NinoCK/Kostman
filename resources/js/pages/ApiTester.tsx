import { Head } from '@inertiajs/react';
import PostmanLayout from '@/layouts/postman-layout';
import RequestBuilder from '@/components/RequestBuilder';
import { User } from '@/types';

interface ApiTesterProps {
    user: User;
    collections?: any[];
    environments?: any[];
}

export default function ApiTester({ user, collections = [], environments = [] }: ApiTesterProps) {
    return (
        <PostmanLayout 
            user={user}
            collections={collections}
            environments={environments}
        >
            <Head title="API Tester" />
            <RequestBuilder />
        </PostmanLayout>
    );
}
