import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';
import { 
    User as UserIcon,
    Mail,
    Trash2,
    CheckCircle
} from 'lucide-react';
import { edit } from '@/routes/profile';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

interface ProfileProps {
    user: User;
    mustVerifyEmail: boolean;
    status?: string;
}

export default function Profile({ user, mustVerifyEmail, status }: ProfileProps) {
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const { post: sendVerification, processing: sendingVerification } = useForm({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch('/settings/profile', {
            preserveScroll: true,
        });
    };

    const handleSendVerification = () => {
        sendVerification('/email/verification-notification');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile Settings" />
            
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profile Information" description="Update your name and email address" />

                    {/* Profile Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Profile Information
                            </CardTitle>
                            <CardDescription>
                                Update your name and email address
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                        placeholder="Your full name"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={errors.email ? 'border-red-500' : ''}
                                        placeholder="your.email@example.com"
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-500">{errors.email}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    
                                    {recentlySuccessful && (
                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                            <CheckCircle className="h-4 w-4" />
                                            Changes saved successfully
                                        </div>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Email Verification */}
                    {mustVerifyEmail && user.email_verified_at === null && (
                        <Alert>
                            <Mail className="h-4 w-4" />
                            <AlertDescription className="flex items-center justify-between">
                                <div>
                                    Your email address is unverified. Please verify your email to access all features.
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleSendVerification}
                                    disabled={sendingVerification}
                                >
                                    {sendingVerification ? 'Sending...' : 'Resend Verification Email'}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {status === 'verification-link-sent' && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                A new verification link has been sent to your email address.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Danger Zone */}
                    <Card className="border-red-200 dark:border-red-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <Trash2 className="h-4 w-4" />
                                Danger Zone
                            </CardTitle>
                            <CardDescription>
                                Irreversible actions for your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20">
                                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Delete Account</h4>
                                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                                        Once you delete your account, all of your collections, requests, environments, and data will be permanently deleted. 
                                        This action cannot be undone.
                                    </p>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
