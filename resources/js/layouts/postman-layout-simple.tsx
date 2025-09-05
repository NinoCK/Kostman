import { useState } from 'react';
import { User } from '@/types';
import { Button } from '@/components/ui/button';

interface PostmanLayoutProps {
    user: User;
    children: React.ReactNode;
}

export default function PostmanLayout({ user, children }: PostmanLayoutProps) {
    return (
        <div className="min-h-screen flex w-full bg-background">
            {/* Left Sidebar - Collections */}
            <div className="w-64 border-r bg-muted/20">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="font-semibold">Collections</h2>
                        <Button variant="ghost" size="sm">+</Button>
                    </div>

                    {/* Collections Tree */}
                    <div className="flex-1 overflow-auto p-2">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                                <span className="text-sm">📁 My Collection</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Header */}
                <header className="border-b bg-background">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-lg font-semibold">API Tester</h1>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
                            <Button variant="outline" size="sm">Logout</Button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
