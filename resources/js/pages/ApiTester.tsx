import { Head } from '@inertiajs/react';
import PostmanLayout from '@/layouts/postman-layout';
import RequestBuilder from '@/components/RequestBuilder';
import { User } from '@/types';

interface ApiTesterProps {
    user: User;
}

export default function ApiTester({ user }: ApiTesterProps) {
    return (
        <PostmanLayout user={user}>
            <Head title="API Tester" />
            <RequestBuilder />
        </PostmanLayout>
    );
}
