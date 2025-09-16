'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Save, 
  AlertCircle,
  List,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ObsessionData, 
  CompulsionData, 
  ObsessionsCompulsionsData 
} from '@/types/therapy';
import { v4 as uuidv4 } from 'uuid';

interface ObsessionsCompulsionsFlowProps {
  onComplete: (data: ObsessionsCompulsionsData) => void;
  initialData?: ObsessionsCompulsionsData;
  className?: string;
}

type FlowStep = 'start' | 'obsession' | 'compulsion' | 'review';

export function ObsessionsCompulsionsFlow({
  onComplete,
  initialData,
  className
}: ObsessionsCompulsionsFlowProps) {
  const t = useTranslations('obsessions');
  
  const [data, setData] = useState<ObsessionsCompulsionsData>(
    initialData || {
      obsessions: [],
      compulsions: [],
      lastModified: new Date().toISOString()
    }
  );
  
  const [currentStep, setCurrentStep] = useState<FlowStep>('start');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form states for current obsession
  const [obsessionForm, setObsessionForm] = useState({
    obsession: '',
    intensity: 5,
    triggers: ''
  });
  
  // Form states for current compulsion
  const [compulsionForm, setCompulsionForm] = useState({
    compulsion: '',
    frequency: 5,
    duration: 10,
    reliefLevel: 5
  });

  // Validation
  const validateObsession = useCallback((form: typeof obsessionForm) => {
    const newErrors: Record<string, string> = {};
    
    if (!form.obsession.trim()) {
      newErrors.obsession = t('validation.obsessionRequired');
    }
    if (form.intensity < 1 || form.intensity > 10) {
      newErrors.intensity = t('validation.intensityRequired');
    }
    
    return newErrors;
  }, [t]);

  const validateCompulsion = useCallback((form: typeof compulsionForm) => {
    const newErrors: Record<string, string> = {};
    
    if (!form.compulsion.trim()) {
      newErrors.compulsion = t('validation.compulsionRequired');
    }
    if (form.frequency < 1 || form.frequency > 10) {
      newErrors.frequency = t('validation.frequencyRequired');
    }
    if (form.duration < 1) {
      newErrors.duration = t('validation.durationMin');
    }
    if (form.duration > 999) {
      newErrors.duration = t('validation.durationMax');
    }
    if (form.reliefLevel < 1 || form.reliefLevel > 10) {
      newErrors.reliefLevel = t('validation.reliefRequired');
    }
    
    return newErrors;
  }, [t]);

  // Flow handlers
  const handleStart = useCallback(() => {
    setCurrentStep('obsession');
    setErrors({});
  }, []);

  const handleSaveObsession = useCallback(() => {
    const validationErrors = validateObsession(obsessionForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create new obsession
    const newObsession: ObsessionData = {
      id: uuidv4(),
      obsession: obsessionForm.obsession.trim(),
      intensity: obsessionForm.intensity,
      triggers: obsessionForm.triggers.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString()
    };

    // Add to data and move to compulsion step
    setData(prev => ({
      ...prev,
      obsessions: [...prev.obsessions, newObsession],
      lastModified: new Date().toISOString()
    }));

    setCurrentStep('compulsion');
    setErrors({});
  }, [obsessionForm, validateObsession]);

  const handleSaveCompulsion = useCallback(() => {
    const validationErrors = validateCompulsion(compulsionForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create new compulsion
    const newCompulsion: CompulsionData = {
      id: uuidv4(),
      compulsion: compulsionForm.compulsion.trim(),
      frequency: compulsionForm.frequency,
      duration: compulsionForm.duration,
      reliefLevel: compulsionForm.reliefLevel,
      createdAt: new Date().toISOString()
    };

    // Add to data and move to review
    setData(prev => ({
      ...prev,
      compulsions: [...prev.compulsions, newCompulsion],
      lastModified: new Date().toISOString()
    }));

    setCurrentStep('review');
    setErrors({});
  }, [compulsionForm, validateCompulsion]);

  const handleAddAnother = useCallback(() => {
    // Reset forms and go back to obsession step
    setObsessionForm({ obsession: '', intensity: 5, triggers: '' });
    setCompulsionForm({ compulsion: '', frequency: 5, duration: 10, reliefLevel: 5 });
    setCurrentStep('obsession');
    setErrors({});
  }, []);

  const handleComplete = useCallback(async () => {
    setIsSaving(true);
    try {
      await onComplete(data);
    } finally {
      setIsSaving(false);
    }
  }, [data, onComplete]);

  // Render start state
  const renderStartState = () => (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <List className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">{t('title')}</h1>
                  {isSaving && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="p-8 text-center">
        <div className="w-12 h-12 mx-auto bg-muted rounded-lg flex items-center justify-center mb-4">
          <List className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{t('emptyState.title')}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t('emptyState.subtitle')}</p>
        <Button onClick={handleStart} size="sm" className="flex items-center gap-2 h-8 px-3">
          <span>{t('start')}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // Render obsession form
  const renderObsessionForm = () => (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <List className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">{t('step1Title')}</h1>
                  {isSaving && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{t('step1Subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 sm:p-6 space-y-6">
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="space-y-4">
            <div>
              <Textarea
                value={obsessionForm.obsession}
                onChange={(e) => setObsessionForm(prev => ({ ...prev, obsession: e.target.value }))}
                placeholder={t('obsessionPlaceholder')}
                className={cn("min-h-[100px]", errors.obsession && "border-destructive")}
              />
              {errors.obsession && (
                <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.obsession}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">
                  Intensity: {obsessionForm.intensity}/10
                </Label>
                <Slider
                  value={[obsessionForm.intensity]}
                  onValueChange={([value]) => setObsessionForm(prev => ({ ...prev, intensity: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full mt-1"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={obsessionForm.triggers}
                  onChange={(e) => setObsessionForm(prev => ({ ...prev, triggers: e.target.value }))}
                  placeholder={t('triggersPlaceholder')}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSaveObsession}
            disabled={isSaving}
            size="sm"
            className="flex items-center gap-2 h-8 px-3"
          >
            <span>Continue to Compulsion</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Render compulsion form
  const renderCompulsionForm = () => (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <List className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">{t('step2Title')}</h1>
                  {isSaving && (
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{t('step2Subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 sm:p-6 space-y-6">
        <Card className="p-4 border-orange-500/20 bg-orange-500/5">
          <div className="space-y-4">
            <div>
              <Textarea
                value={compulsionForm.compulsion}
                onChange={(e) => setCompulsionForm(prev => ({ ...prev, compulsion: e.target.value }))}
                placeholder={t('compulsionPlaceholder')}
                className={cn("min-h-[100px]", errors.compulsion && "border-destructive")}
              />
              {errors.compulsion && (
                <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.compulsion}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Frequency: {compulsionForm.frequency}/10
                </Label>
                <Slider
                  value={[compulsionForm.frequency]}
                  onValueChange={([value]) => setCompulsionForm(prev => ({ ...prev, frequency: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Duration (min)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="999"
                  value={compulsionForm.duration}
                  onChange={(e) => setCompulsionForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                  className={cn("text-sm mt-1", errors.duration && "border-destructive")}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Relief: {compulsionForm.reliefLevel}/10
                </Label>
                <Slider
                  value={[compulsionForm.reliefLevel]}
                  onValueChange={([value]) => setCompulsionForm(prev => ({ ...prev, reliefLevel: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full mt-1"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-between gap-2">
          <Button
            onClick={() => setCurrentStep('obsession')}
            disabled={isSaving}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 h-8 px-3"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>{t('back')}</span>
          </Button>
          <Button
            onClick={handleSaveCompulsion}
            disabled={isSaving}
            size="sm"
            className="flex items-center gap-2 h-8 px-3"
          >
            <span>{t('savePair')}</span>
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Render review state
  const renderReviewState = () => (
    <div className={cn("max-w-4xl mx-auto", className)}>
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <List className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">{t('title')}</h1>
                  {isSaving && (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddAnother}
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Another Pair
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isSaving}
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Complete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {data.obsessions.map((obsession, index) => {
          const compulsion = data.compulsions[index];
          return (
            <Card key={obsession.id} className="p-4 border border-muted space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {t('pair')} {index + 1}
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-md bg-primary/5">
                  <h4 className="font-medium flex items-center gap-2">
                    🧠 {t('obsessionLabel')}
                  </h4>
                  <p className="text-sm">{obsession.obsession}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('intensityLabel')}: {obsession.intensity}/10
                  </p>
                  {obsession.triggers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {obsession.triggers.map((trigger, i) => (
                        <Badge key={i} variant="outline" className="text-xs px-1.5 py-0.5">
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('recorded')}: {new Date(obsession.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {compulsion && (
                  <div className="p-3 rounded-md bg-orange-500/5">
                    <h4 className="font-medium flex items-center gap-2">
                      🔁 {t('compulsionLabel')}
                    </h4>
                    <p className="text-sm">{compulsion.compulsion}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-1">
                      <span>{t('frequencyLabel')}: {compulsion.frequency}/10</span>
                      <span>{t('durationLabel')}: {compulsion.duration} {t('minutes')}</span>
                      <span>{t('reliefLabel')}: {compulsion.reliefLevel}/10</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('recorded')}: {new Date(compulsion.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Render based on current step
  switch (currentStep) {
    case 'start':
      return renderStartState();
    case 'obsession':
      return renderObsessionForm();
    case 'compulsion':
      return renderCompulsionForm();
    case 'review':
      return renderReviewState();
    default:
      return renderStartState();
  }
}
