import { useForm } from '@inertiajs/react';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppearanceTabs from '@/components/appearance-tabs';
import { 
    User as UserIcon,
    Mail,
    Trash2,
    CheckCircle,
    Settings,
    Lock,
    Palette
} from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    mustVerifyEmail?: boolean;
    status?: string;
}

export default function SettingsModal({ 
    isOpen, 
    onClose, 
    user, 
    mustVerifyEmail = false, 
    status 
}: SettingsModalProps) {
    // Profile form
    const { data: profileData, setData: setProfileData, patch: patchProfile, processing: profileProcessing, errors: profileErrors, recentlySuccessful: profileSuccess } = useForm({
        name: user.name,
        email: user.email,
    });

    // Password form
    const { data: passwordData, setData: setPasswordData, put: putPassword, processing: passwordProcessing, errors: passwordErrors, recentlySuccessful: passwordSuccess, reset: resetPassword } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const { post: sendVerification, processing: sendingVerification } = useForm({});

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patchProfile('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => {
                // Keep modal open to show success message
            },
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        putPassword('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                resetPassword();
            },
        });
    };

    const handleSendVerification = () => {
        sendVerification('/email/verification-notification');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage your account settings and preferences
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="password" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Password
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Appearance
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        {/* Profile Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>
                                    Update your name and email address
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData('name', e.target.value)}
                                            className={profileErrors.name ? 'border-red-500' : ''}
                                            placeholder="Your full name"
                                        />
                                        {profileErrors.name && (
                                            <p className="text-sm text-red-500">{profileErrors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData('email', e.target.value)}
                                            className={profileErrors.email ? 'border-red-500' : ''}
                                            placeholder="your.email@example.com"
                                        />
                                        {profileErrors.email && (
                                            <p className="text-sm text-red-500">{profileErrors.email}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button type="submit" disabled={profileProcessing}>
                                            {profileProcessing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        
                                        {profileSuccess && (
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
                    </TabsContent>

                    {/* Password Tab */}
                    <TabsContent value="password" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Update Password</CardTitle>
                                <CardDescription>
                                    Ensure your account is using a long, random password to stay secure
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current_password">Current Password</Label>
                                        <Input
                                            id="current_password"
                                            type="password"
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData('current_password', e.target.value)}
                                            className={passwordErrors.current_password ? 'border-red-500' : ''}
                                            placeholder="Enter your current password"
                                        />
                                        {passwordErrors.current_password && (
                                            <p className="text-sm text-red-500">{passwordErrors.current_password}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={passwordData.password}
                                            onChange={(e) => setPasswordData('password', e.target.value)}
                                            className={passwordErrors.password ? 'border-red-500' : ''}
                                            placeholder="Enter a new password"
                                        />
                                        {passwordErrors.password && (
                                            <p className="text-sm text-red-500">{passwordErrors.password}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation">Confirm Password</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={passwordData.password_confirmation}
                                            onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                            className={passwordErrors.password_confirmation ? 'border-red-500' : ''}
                                            placeholder="Confirm your new password"
                                        />
                                        {passwordErrors.password_confirmation && (
                                            <p className="text-sm text-red-500">{passwordErrors.password_confirmation}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button type="submit" disabled={passwordProcessing}>
                                            {passwordProcessing ? 'Updating...' : 'Update Password'}
                                        </Button>
                                        
                                        {passwordSuccess && (
                                            <div className="flex items-center gap-2 text-sm text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                Password updated successfully
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Appearance Tab */}
                    <TabsContent value="appearance" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance Settings</CardTitle>
                                <CardDescription>
                                    Customize the look and feel of your application
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AppearanceTabs />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
