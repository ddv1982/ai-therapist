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
            <SheetTitle>AI Settings</SheetTitle>
          </div>
          <SheetDescription>
            Configure your AI therapist&apos;s behavior and response style.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          {/* Model Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">AI Model</Label>
            <Select value={settings.model} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select AI model" />
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
                ? 'Optimized for quick responses and general conversation'
                : 'Best for complex therapeutic analysis and deep insights'
              }
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <Label className="text-base font-medium">Creativity</Label>
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
              <span>Focused</span>
              <span className="text-center">Balanced</span>
              <span className="text-right">Creative</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {settings.temperature < 0.5 
                ? 'More focused and consistent responses'
                : settings.temperature < 1.0
                ? 'Balanced creativity and consistency'
                : 'More creative and varied responses'
              }
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <Label className="text-base font-medium">Response Length</Label>
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
              <span>Brief</span>
              <span className="text-center">Standard</span>
              <span className="text-right">Detailed</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Controls the maximum length of AI responses
            </p>
          </div>

          {/* Top P */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <Label className="text-base font-medium">Focus</Label>
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
              <span>Narrow</span>
              <span className="text-center">Balanced</span>
              <span className="text-right">Broad</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Controls how focused the AI&apos;s word choices are
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Quick Presets</Label>
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
                Clinical Focus
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
                Balanced Care
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
                Creative Support
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
                Quick Responses
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}