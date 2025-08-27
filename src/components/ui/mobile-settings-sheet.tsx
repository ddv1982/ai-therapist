'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateSettings } from '@/store/slices/chatSlice';
import { Settings, Zap, Brain, Gauge, Target } from 'lucide-react';
import {useTranslations} from 'next-intl';

interface MobileSettingsSheetProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileSettingsSheet({ 
  children, 
  isOpen, 
  onOpenChange 
}: MobileSettingsSheetProps) {
  const t = useTranslations('ui');
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.chat.settings);

  const handleModelChange = (model: string) => {
    dispatch(updateSettings({ model }));
  };

  const handleTemperatureChange = (values: number[]) => {
    dispatch(updateSettings({ temperature: values[0] }));
  };

  const handleMaxTokensChange = (values: number[]) => {
    dispatch(updateSettings({ maxTokens: values[0] }));
  };

  const handleTopPChange = (values: number[]) => {
    dispatch(updateSettings({ topP: values[0] }));
  };

  const modelOptions = [
    { value: 'openai/gpt-oss-20b', label: 'GPT OSS 20B (Fast)', icon: <Zap className="h-4 w-4" /> },
    { value: 'openai/gpt-oss-120b', label: 'GPT OSS 120B (Analytical)', icon: <Brain className="h-4 w-4" /> },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <SheetTitle>{t('settings.title')}</SheetTitle>
          </div>
          <SheetDescription>
            {t('settings.subtitle')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          {/* Model Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">{t('settings.model')}</Label>
            <Select value={settings.model} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('settings.modelPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {settings.model === 'openai/gpt-oss-20b' 
                ? t('settings.modelFast')
                : t('settings.modelAnalytical')
              }
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <Label className="text-base font-medium">{t('settings.creativity')}</Label>
              <span className="ml-auto text-sm text-muted-foreground">
                {settings.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[settings.temperature]}
              onValueChange={handleTemperatureChange}
              max={2}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="grid grid-cols-3 text-xs text-muted-foreground">
              <span>{t('settings.creativityLow')}</span>
              <span className="text-center">{t('settings.creativityMid')}</span>
              <span className="text-right">{t('settings.creativityHigh')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {settings.temperature < 0.5 
                ? t('settings.creativityLowDesc')
                : settings.temperature < 1.0
                ? t('settings.creativityMidDesc')
                : t('settings.creativityHighDesc')
              }
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <Label className="text-base font-medium">{t('settings.length')}</Label>
              <span className="ml-auto text-sm text-muted-foreground">
                {settings.maxTokens.toLocaleString()}
              </span>
            </div>
            <Slider
              value={[settings.maxTokens]}
              onValueChange={handleMaxTokensChange}
              max={8192}
              min={256}
              step={256}
              className="w-full"
            />
            <div className="grid grid-cols-3 text-xs text-muted-foreground">
              <span>{t('settings.lengthBrief')}</span>
              <span className="text-center">{t('settings.lengthStandard')}</span>
              <span className="text-right">{t('settings.lengthDetailed')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('settings.lengthHelp')}
            </p>
          </div>

          {/* Top P */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <Label className="text-base font-medium">{t('settings.focus')}</Label>
              <span className="ml-auto text-sm text-muted-foreground">
                {settings.topP.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[settings.topP]}
              onValueChange={handleTopPChange}
              max={1}
              min={0.1}
              step={0.1}
              className="w-full"
            />
            <div className="grid grid-cols-3 text-xs text-muted-foreground">
              <span>{t('settings.focusNarrow')}</span>
              <span className="text-center">{t('settings.focusBalanced')}</span>
              <span className="text-right">{t('settings.focusBroad')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('settings.focusHelp')}
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-3">
            <Label className="text-base font-medium">{t('settings.presets')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(updateSettings({
                  temperature: 0.3,
                  maxTokens: 2048,
                  topP: 0.8
                }))}
                className="text-xs"
              >
                {t('settings.presetClinical')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(updateSettings({
                  temperature: 0.7,
                  maxTokens: 4096,
                  topP: 0.9
                }))}
                className="text-xs"
              >
                {t('settings.presetBalanced')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(updateSettings({
                  temperature: 0.9,
                  maxTokens: 6144,
                  topP: 0.95
                }))}
                className="text-xs"
              >
                {t('settings.presetCreative')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(updateSettings({
                  temperature: 0.5,
                  maxTokens: 1024,
                  topP: 0.85
                }))}
                className="text-xs"
              >
                {t('settings.presetQuick')}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}