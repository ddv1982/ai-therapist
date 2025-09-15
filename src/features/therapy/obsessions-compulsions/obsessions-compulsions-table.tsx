'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
// Removed unused table imports
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  AlertCircle,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ObsessionData, 
  CompulsionData, 
  ObsessionsCompulsionsData 
} from '@/types/therapy';
import { v4 as uuidv4 } from 'uuid';

interface ObsessionsCompulsionsTableProps {
  onComplete: (data: ObsessionsCompulsionsData) => void;
  initialData?: ObsessionsCompulsionsData;
  className?: string;
}

interface EditingState {
  type: 'obsession' | 'compulsion' | null;
  id: string | null;
}

export function ObsessionsCompulsionsTable({
  onComplete,
  initialData,
  className
}: ObsessionsCompulsionsTableProps) {
  const t = useTranslations('obsessions');
  
  const [data, setData] = useState<ObsessionsCompulsionsData>(
    initialData || {
      obsessions: [],
      compulsions: [],
      lastModified: new Date().toISOString()
    }
  );
  
  const [editing, setEditing] = useState<EditingState>({ type: null, id: null });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form states for editing
  const [obsessionForm, setObsessionForm] = useState({
    obsession: '',
    intensity: 5,
    triggers: ''
  });
  
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

  // Handlers
  const handleAddObsession = useCallback(() => {
    setEditing({ type: 'obsession', id: null });
    setObsessionForm({ obsession: '', intensity: 5, triggers: '' });
    setErrors({});
  }, []);

  const handleAddCompulsion = useCallback(() => {
    setEditing({ type: 'compulsion', id: null });
    setCompulsionForm({ compulsion: '', frequency: 5, duration: 10, reliefLevel: 5 });
    setErrors({});
  }, []);

  const handleEditObsession = useCallback((obsession: ObsessionData) => {
    setEditing({ type: 'obsession', id: obsession.id });
    setObsessionForm({
      obsession: obsession.obsession,
      intensity: obsession.intensity,
      triggers: obsession.triggers.join(', ')
    });
    setErrors({});
  }, []);

  const handleEditCompulsion = useCallback((compulsion: CompulsionData) => {
    setEditing({ type: 'compulsion', id: compulsion.id });
    setCompulsionForm({
      compulsion: compulsion.compulsion,
      frequency: compulsion.frequency,
      duration: compulsion.duration,
      reliefLevel: compulsion.reliefLevel
    });
    setErrors({});
  }, []);

  const handleSaveObsession = useCallback(() => {
    const validationErrors = validateObsession(obsessionForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newObsession: ObsessionData = {
      id: editing.id || uuidv4(),
      obsession: obsessionForm.obsession.trim(),
      intensity: obsessionForm.intensity,
      triggers: obsessionForm.triggers.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: editing.id ? data.obsessions.find(o => o.id === editing.id)?.createdAt || new Date().toISOString() : new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      obsessions: editing.id 
        ? prev.obsessions.map(o => o.id === editing.id ? newObsession : o)
        : [...prev.obsessions, newObsession],
      lastModified: new Date().toISOString()
    }));

    setEditing({ type: null, id: null });
    setObsessionForm({ obsession: '', intensity: 5, triggers: '' });
    setErrors({});
  }, [obsessionForm, editing, data.obsessions, validateObsession]);

  const handleSaveCompulsion = useCallback(() => {
    const validationErrors = validateCompulsion(compulsionForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newCompulsion: CompulsionData = {
      id: editing.id || uuidv4(),
      compulsion: compulsionForm.compulsion.trim(),
      frequency: compulsionForm.frequency,
      duration: compulsionForm.duration,
      reliefLevel: compulsionForm.reliefLevel,
      createdAt: editing.id ? data.compulsions.find(c => c.id === editing.id)?.createdAt || new Date().toISOString() : new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      compulsions: editing.id 
        ? prev.compulsions.map(c => c.id === editing.id ? newCompulsion : c)
        : [...prev.compulsions, newCompulsion],
      lastModified: new Date().toISOString()
    }));

    setEditing({ type: null, id: null });
    setCompulsionForm({ compulsion: '', frequency: 5, duration: 10, reliefLevel: 5 });
    setErrors({});
  }, [compulsionForm, editing, data.compulsions, validateCompulsion]);

  const handleDeleteObsession = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      obsessions: prev.obsessions.filter(o => o.id !== id),
      lastModified: new Date().toISOString()
    }));
  }, []);

  const handleDeleteCompulsion = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      compulsions: prev.compulsions.filter(c => c.id !== id),
      lastModified: new Date().toISOString()
    }));
  }, []);

  const handleCancel = useCallback(() => {
    setEditing({ type: null, id: null });
    setObsessionForm({ obsession: '', intensity: 5, triggers: '' });
    setCompulsionForm({ compulsion: '', frequency: 5, duration: 10, reliefLevel: 5 });
    setErrors({});
  }, []);

  // Auto-save when data changes
  const autoSave = useCallback(async () => {
    if (data.obsessions.length > 0 || data.compulsions.length > 0) {
      setIsSaving(true);
      try {
        await onComplete(data);
      } finally {
        setIsSaving(false);
      }
    }
  }, [data, onComplete]);

  // Auto-save when data changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      autoSave();
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [autoSave]);

  // Removed unused scale helpers for minimal design

  // Render minimal form for editing
  const renderObsessionForm = () => (
    <Card className="p-4 mb-4 border-primary/20 bg-primary/5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {editing.id ? t('editObsession') : t('addObsession')}
          </h3>
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={handleSaveObsession}
              disabled={isSaving}
              className="h-8 px-3"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {t('actions.save')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-8 px-3"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              {t('actions.cancel')}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Textarea
              value={obsessionForm.obsession}
              onChange={(e) => setObsessionForm(prev => ({ ...prev, obsession: e.target.value }))}
              placeholder={t('obsessionPlaceholder')}
              className={cn("min-h-[60px]", errors.obsession && "border-destructive")}
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
      </div>
    </Card>
  );

  const renderCompulsionForm = () => (
    <Card className="p-4 mb-4 border-primary/20 bg-primary/5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {editing.id ? t('editCompulsion') : t('addCompulsion')}
          </h3>
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={handleSaveCompulsion}
              disabled={isSaving}
              className="h-8 px-3"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {t('actions.save')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-8 px-3"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              {t('actions.cancel')}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Textarea
              value={compulsionForm.compulsion}
              onChange={(e) => setCompulsionForm(prev => ({ ...prev, compulsion: e.target.value }))}
              placeholder={t('compulsionPlaceholder')}
              className={cn("min-h-[60px]", errors.compulsion && "border-destructive")}
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
      </div>
    </Card>
  );

  // Empty state
  if (data.obsessions.length === 0 && data.compulsions.length === 0 && !editing.type) {
    return (
      <div className={cn("max-w-4xl mx-auto", className)}>
        {/* Minimal Header */}
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
              <div className="flex gap-2">
                <Button
                  onClick={handleAddObsession}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {t('addObsession')}
                </Button>
                <Button
                  onClick={handleAddCompulsion}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {t('addCompulsion')}
                </Button>
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
          <p className="text-sm text-muted-foreground">{t('emptyState.subtitle')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      {/* Minimal Header */}
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
            <div className="flex gap-2">
              <Button
                onClick={handleAddObsession}
                disabled={editing.type !== null}
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                {t('addObsession')}
              </Button>
              <Button
                onClick={handleAddCompulsion}
                disabled={editing.type !== null}
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                {t('addCompulsion')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-6">

      {/* Forms */}
      {editing.type === 'obsession' && renderObsessionForm()}
      {editing.type === 'compulsion' && renderCompulsionForm()}

      {/* Cards */}
      <div className="space-y-4">
        {/* Obsessions Cards */}
        {data.obsessions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              {t('obsessions')} ({data.obsessions.length})
            </h3>
            <div className="space-y-2">
              {data.obsessions.map((obsession) => (
                <Card key={obsession.id} className="p-4 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-relaxed">{obsession.obsession}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-xs text-muted-foreground">
                            {obsession.intensity}/10
                          </span>
                        </div>
                        {obsession.triggers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {obsession.triggers.slice(0, 2).map((trigger, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                                {trigger}
                              </Badge>
                            ))}
                            {obsession.triggers.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{obsession.triggers.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditObsession(obsession)}
                        disabled={editing.type !== null}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteObsession(obsession.id)}
                        disabled={editing.type !== null}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Compulsions Cards */}
        {data.compulsions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              {t('compulsions')} ({data.compulsions.length})
            </h3>
            <div className="space-y-2">
              {data.compulsions.map((compulsion) => (
                <Card key={compulsion.id} className="p-4 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-relaxed">{compulsion.compulsion}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-xs text-muted-foreground">
                            {compulsion.frequency}/10
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-xs text-muted-foreground">
                            {compulsion.duration}min
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs text-muted-foreground">
                            {compulsion.reliefLevel}/10 relief
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditCompulsion(compulsion)}
                        disabled={editing.type !== null}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCompulsion(compulsion.id)}
                        disabled={editing.type !== null}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
