'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Smartphone, Download, Copy } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import { apiClient } from '@/lib/api/client';
import { getApiData } from '@/lib/api/api-response';

interface TrustedDevice {
  id: string;
  deviceId: string;
  name: string;
  lastSeen: Date;
  trustedAt: Date;
  ipAddress: string;
  hasActiveSessions: boolean;
}

interface SecurityData {
  devices: TrustedDevice[];
  backupCodesCount: number;
}

export function SecuritySettings() {
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const resp = await apiClient.listDevices();
      const data = getApiData(resp) as unknown as SecurityData | null;
      if (data) setSecurityData(data);
    } catch (error) {
      logger.securityEvent('Failed to fetch security data', {
        component: 'SecuritySettings',
        operation: 'fetchSecurityData',
        error: (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const revokeDevice = async (deviceId: string) => {
    try {
      const resp = await apiClient.revokeDevice(deviceId);
      if (resp?.success) await fetchSecurityData();
    } catch (error) {
      logger.securityEvent('Failed to revoke device', {
        component: 'SecuritySettings',
        operation: 'revokeDevice',
        deviceId,
        error: (error as Error).message
      });
    }
  };

  const regenerateBackupCodes = async () => {
    // Disabled for security; server instructs to use CLI/server scripts
    setNewBackupCodes(null);
    setShowBackupCodes(false);
  };

  const downloadBackupCodes = () => {
    if (!newBackupCodes) return;
    
    const codes = newBackupCodes.join('\\n');
    const blob = new Blob([codes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-therapist-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBackupCodes = () => {
    if (!newBackupCodes) return;
    
    navigator.clipboard.writeText(newBackupCodes.join('\\n'));
  };

  const logout = async () => {
    try {
      const resp = await apiClient.revokeCurrentSession();
      if (resp?.success) {
        window.location.href = '/auth/verify';
      }
    } catch (error) {
      logger.securityEvent('Failed to logout', {
        component: 'SecuritySettings',
        operation: 'logout',
        error: (error as Error).message
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-semibold">Security Settings</h3>
      </div>

      {/* Backup Codes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l6.879-6.88A6 6 0 0121 9z"></path>
            </svg>
            Backup Codes
          </CardTitle>
          <CardDescription>
            {securityData && securityData.backupCodesCount > 0 
              ? `You have ${securityData.backupCodesCount} unused backup codes remaining`
              : 'No backup codes available'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={regenerateBackupCodes} variant="outline" disabled title="Use server tools to manage backup codes">
            Backup Codes Managed Server-side
          </Button>
        </CardContent>
      </Card>

      {/* Show New Backup Codes */}
      {showBackupCodes && newBackupCodes && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-amber-800">New Backup Codes Generated</CardTitle>
            <CardDescription className="text-amber-700">
              Save these codes securely. They replace your previous backup codes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-white rounded-lg border">
              {newBackupCodes.map((code, index) => (
                <code key={index} className="text-sm font-mono">
                  {code}
                </code>
              ))}
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={downloadBackupCodes}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="outline" onClick={copyBackupCodes}>
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
              <Button size="sm" onClick={() => setShowBackupCodes(false)}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trusted Devices Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Trusted Devices
          </CardTitle>
          <CardDescription>
            Devices that can access your AI Therapist without requiring 2FA each time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {securityData?.devices.map((device) => (
            <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-semibold">{device.name}</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Last seen: {new Date(device.lastSeen).toLocaleString()}</p>
                  <p>IP: {device.ipAddress}</p>
                  {device.hasActiveSessions && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Active
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => revokeDevice(device.deviceId)}
              >
                Revoke
              </Button>
            </div>
          ))}
          {(!securityData?.devices || securityData.devices.length === 0) && (
            <p className="text-muted-foreground text-center py-4">
              No trusted devices found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Manage your current authentication session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={logout} variant="outline">
            Logout from All Devices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecuritySettings;