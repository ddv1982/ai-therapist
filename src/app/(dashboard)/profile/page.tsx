'use client';

import { UserProfile } from '@clerk/nextjs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Manage your account information, security settings, and connected devices.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="rounded-lg border bg-card p-6">
        <UserProfile />
      </div>
    </div>
  );
}
