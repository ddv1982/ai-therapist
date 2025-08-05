'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  messages: Message[];
  model: string;
}

interface EmailConfig {
  service: string;
  smtpHost: string;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
}

export function EmailReportModal({
  isOpen,
  onClose,
  sessionId,
  messages,
  model
}: EmailReportModalProps) {
  const { showToast } = useToast();
  const [emailAddress, setEmailAddress] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [emailService, setEmailService] = useState('smtp');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [fromEmail, setFromEmail] = useState('AI Therapist <noreply@therapist.ai>');
  const [saveEmailSettings, setSaveEmailSettings] = useState(false);

  // Load saved email settings
  useEffect(() => {
    const savedEmailSettings = localStorage.getItem('emailSettings');
    if (savedEmailSettings) {
      try {
        const settings = JSON.parse(savedEmailSettings);
        setEmailService(settings.emailService || 'smtp');
        setSmtpHost(settings.smtpHost || 'smtp.gmail.com');
        setSmtpUser(settings.smtpUser || '');
        setSmtpPass(settings.smtpPass || '');
        setFromEmail(settings.fromEmail || 'AI Therapist <noreply@therapist.ai>');
        // Load saved email address and checkbox state
        if (settings.emailAddress) {
          setEmailAddress(settings.emailAddress);
        }
        if (settings.saveEmailSettings !== undefined) {
          setSaveEmailSettings(settings.saveEmailSettings);
        }
      } catch (error) {
        console.error('Failed to load email settings:', error);
      }
    }
  }, []);

  const handleGenerateReport = async () => {
    if (!sessionId || !messages.length) {
      showToast({
        type: 'warning',
        title: 'No Session Data',
        message: 'No session data available to generate report.'
      });
      return;
    }

    if (!emailAddress.trim()) {
      showToast({
        type: 'warning',
        title: 'Email Required',
        message: 'Please enter an email address.'
      });
      return;
    }

    // Validate email configuration if not using console logging
    if (emailService === 'smtp') {
      if (!smtpHost.trim() || !smtpUser.trim() || !smtpPass.trim() || !fromEmail.trim()) {
        showToast({
          type: 'warning',
          title: 'SMTP Configuration Required',
          message: 'Please fill in all SMTP configuration fields or use console logging for testing.'
        });
        return;
      }
    }

    // Save email settings if requested
    if (saveEmailSettings) {
      const emailSettingsToSave = {
        emailService,
        smtpHost,
        smtpUser,
        smtpPass,
        fromEmail,
        emailAddress: emailAddress.trim(),
        saveEmailSettings: true
      };
      localStorage.setItem('emailSettings', JSON.stringify(emailSettingsToSave));
    }

    setIsGeneratingReport(true);
    try {
      const response = await fetch('/api/reports/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          messages: messages,
          emailAddress: emailAddress.trim(),
          model: model,
          emailConfig: {
            service: emailService,
            smtpHost: smtpHost.trim(),
            smtpUser: smtpUser.trim(),
            smtpPass: smtpPass.trim(),
            fromEmail: fromEmail.trim()
          }
        }),
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Report Sent',
          message: 'Report generated and sent successfully!'
        });
        onClose();
        setEmailAddress('');
      } else {
        const error = await response.json();
        let errorMessage = `Failed to send report: ${error.error || 'Unknown error'}`;
        if (error.details) {
          errorMessage += ` Details: ${error.details}`;
        }
        showToast({
          type: 'error',
          title: 'Email Failed',
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('Error sending report:', error);
      showToast({
        type: 'error',
        title: 'Report Failed',
        message: 'Failed to send report. Please try again.'
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-lg w-full border border-border/50 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-6 h-6 text-primary"/>
              <h2 className="text-xl font-semibold text-foreground">Email Session Report</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a professional therapeutic session report and send it to your email address.
            </p>

            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Email Service Configuration */}
            <div className="space-y-3 border-t border-border pt-4">
              <label className="text-sm font-medium text-foreground">Email Configuration</label>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Service</label>
                <select
                  value={emailService}
                  onChange={(e) => setEmailService(e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground text-sm"
                >
                  <option value="console">Console Only (Testing)</option>
                  <option value="smtp">SMTP (Gmail, Outlook, etc.)</option>
                </select>
              </div>

              {emailService === 'smtp' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">SMTP Host</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full p-2 border border-border rounded bg-background text-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">From Email</label>
                      <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full p-2 border border-border rounded bg-background text-foreground text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Username</label>
                      <input
                        type="email"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="your@gmail.com"
                        className="w-full p-2 border border-border rounded bg-background text-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Password/App Password</label>
                      <input
                        type="password"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full p-2 border border-border rounded bg-background text-foreground text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                    <strong>For Gmail:</strong> Use an App Password instead of your regular password. 
                    Go to Google Account → Security → 2-Step Verification → App passwords.
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveSettings"
                  checked={saveEmailSettings}
                  onChange={(e) => setSaveEmailSettings(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="saveSettings" className="text-xs text-muted-foreground">
                  Save email settings for next time
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isGeneratingReport}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={!emailAddress.trim() || isGeneratingReport}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}