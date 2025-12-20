'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Phone,
  ExternalLink,
  Heart,
  Shield,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CrisisDetectionResult,
  requiresImmediateIntervention,
  generateCrisisAlert,
} from '@/features/therapy/lib/validators';

interface CrisisAlertProps {
  crisisResult: CrisisDetectionResult;
  onDismiss?: () => void;
  onAcknowledge?: () => void;
  className?: string;
}

export const CrisisAlert: React.FC<CrisisAlertProps> = ({
  crisisResult,
  onDismiss,
  onAcknowledge,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(requiresImmediateIntervention(crisisResult));
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  if (!crisisResult.isHighRisk) {
    return null;
  }

  const alertMessage = generateCrisisAlert(crisisResult);
  const isImmediate = requiresImmediateIntervention(crisisResult);

  const handleAcknowledge = () => {
    setIsAcknowledged(true);
    onAcknowledge?.();
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'crisis':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'suicide':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'self_harm':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'severe_depression':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'substance_abuse':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'trauma':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'psychosis':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card
      className={cn(
        'border-2 shadow-lg transition-all duration-300',
        getRiskLevelColor(crisisResult.riskLevel),
        isImmediate && 'animate-pulse',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-full p-2',
                crisisResult.riskLevel === 'crisis'
                  ? 'bg-red-500'
                  : crisisResult.riskLevel === 'high'
                    ? 'bg-orange-500'
                    : 'bg-yellow-500'
              )}
            >
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                Crisis Support Resources
                <Badge
                  variant="outline"
                  className={cn(
                    'text-sm font-semibold',
                    crisisResult.riskLevel === 'crisis'
                      ? 'border-red-300 text-red-700'
                      : crisisResult.riskLevel === 'high'
                        ? 'border-orange-300 text-orange-700'
                        : 'border-yellow-300 text-yellow-700'
                  )}
                >
                  {crisisResult.riskLevel.toUpperCase()}
                </Badge>
              </CardTitle>
              <p className="mt-1 text-sm opacity-90">{alertMessage}</p>
            </div>
          </div>

          {onDismiss && !isImmediate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Immediate Actions - Always visible for crisis level */}
        {isImmediate && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-red-800">
              <Shield className="h-4 w-4" />
              Immediate Safety Actions
            </h4>
            <div className="space-y-2 text-sm text-red-700">
              <p>• Contact emergency services (911) if in immediate danger</p>
              <p>
                • Call the National Suicide Prevention Lifeline: <strong>988</strong>
              </p>
              <p>• Reach out to a trusted person immediately</p>
              <p>• Remove any means of harm from your environment</p>
            </div>
          </div>
        )}

        {/* Emergency Resources */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 font-semibold">
            <Phone className="h-4 w-4" />
            Emergency Resources
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {crisisResult.emergencyResources
              .slice(0, isExpanded ? undefined : 2)
              .map((resource, index) => (
                <div key={index} className="rounded-lg border bg-white p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold">{resource.name}</h5>
                      <p className="text-muted-foreground mt-1 text-sm">{resource.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-sm"
                          onClick={() => window.open(`tel:${resource.phone}`, '_self')}
                        >
                          <Phone className="mr-1 h-3 w-3" />
                          {resource.phone}
                        </Button>
                        {resource.website && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-sm"
                            onClick={() => window.open(resource.website, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {resource.available24x7 && (
                      <Badge variant="outline" className="text-sm">
                        <Clock className="mr-1 h-3 w-3" />
                        24/7
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Expand/Collapse for additional information */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-center"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Show More Resources & Actions
              </>
            )}
          </Button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <>
            <Separator />

            {/* Detected Categories */}
            {crisisResult.detectedCategories.length > 0 && (
              <div>
                <h4 className="mb-3 font-semibold">Areas of Concern</h4>
                <div className="flex flex-wrap gap-2">
                  {crisisResult.detectedCategories.map((category, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={cn('text-sm', getCategoryColor(category.category))}
                    >
                      {category.category.replace('_', ' ')} ({category.severity})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {crisisResult.recommendedActions.length > 0 && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <Heart className="h-4 w-4" />
                  Recommended Actions
                </h4>
                <ul className="space-y-2 text-sm">
                  {crisisResult.recommendedActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 font-semibold">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Resources */}
            {crisisResult.emergencyResources.length > 2 && (
              <div>
                <h4 className="mb-3 font-semibold">Additional Resources</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {crisisResult.emergencyResources.slice(2).map((resource, index) => (
                    <div key={index} className="rounded-lg border bg-white p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold">{resource.name}</h5>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {resource.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-sm"
                              onClick={() => window.open(`tel:${resource.phone}`, '_self')}
                            >
                              <Phone className="mr-1 h-3 w-3" />
                              {resource.phone}
                            </Button>
                            {resource.website && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-sm"
                                onClick={() => window.open(resource.website, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {resource.available24x7 && (
                          <Badge variant="outline" className="text-sm">
                            <Clock className="mr-1 h-3 w-3" />
                            24/7
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Acknowledgment */}
        {isImmediate && !isAcknowledged && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-3 text-sm text-blue-800">
              Please acknowledge that you have seen these crisis resources and understand the
              importance of seeking help.
            </p>
            <Button
              onClick={handleAcknowledge}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              I Acknowledge These Resources
            </Button>
          </div>
        )}

        {/* Support Message */}
        <div className="text-muted-foreground bg-muted/30 rounded-lg p-3 text-center text-sm">
          <p className="mb-1 font-semibold">🤝 You are not alone</p>
          <p>
            Reaching out for help is a sign of strength. These resources are here to support you
            through difficult times.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CrisisAlert;
