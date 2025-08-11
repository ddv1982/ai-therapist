import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import Link from 'next/link';
import { FileText, Calendar, ArrowRight } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-therapy-xl mb-2">Session Reports</h1>
          <p className="text-therapy-base text-muted-foreground">
            Review insights and progress from your therapeutic sessions
          </p>
        </div>

        {/* Coming Soon Notice */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-therapy-lg">Reports Coming Soon</CardTitle>
            <CardDescription className="text-therapy-base">
              Complete a therapy session first to generate your personalized insights and progress reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-therapy-base text-muted-foreground">
              Your session reports will include:
            </p>
            <ul className="text-therapy-sm text-muted-foreground space-y-2 max-w-md mx-auto">
              <li>• Key discussion points and themes</li>
              <li>• Therapeutic insights and observations</li>
              <li>• Identified patterns and behaviors</li>
              <li>• Recommended focus areas</li>
              <li>• Progress indicators over time</li>
            </ul>
            <div className="pt-4">
              <Link href="/chat">
                <Button size="lg" className="flex items-center space-x-2">
                  <span>Start Your First Session</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Example Report Preview */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-therapy-lg mb-6 text-center">Example Session Report</h2>
          <Card className="opacity-75">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-therapy-base">Session - March 15, 2024</CardTitle>
                <div className="flex items-center text-therapy-sm text-muted-foreground">
                  <Calendar size={16} className="mr-1" />
                  45 minutes
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-therapy-base font-semibold mb-2">Key Discussion Points</h4>
                <ul className="text-therapy-sm text-muted-foreground space-y-1">
                  <li>• Work-related stress and boundary setting</li>
                  <li>• Family relationship dynamics</li>
                  <li>• Coping strategies for anxiety</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-therapy-base font-semibold mb-2">Therapeutic Insights</h4>
                <ul className="text-therapy-sm text-muted-foreground space-y-1">
                  <li>• Strong self-awareness and emotional intelligence</li>
                  <li>• Tendency to prioritize others&apos; needs over own wellbeing</li>
                  <li>• Good progress in identifying triggers</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-therapy-base font-semibold mb-2">Action Items</h4>
                <ul className="text-therapy-sm text-muted-foreground space-y-1">
                  <li>• Practice daily mindfulness exercises</li>
                  <li>• Set specific work boundaries this week</li>
                  <li>• Journal about family interaction patterns</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}