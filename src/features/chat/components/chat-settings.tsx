'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { ModelConfig, ChatSettings as ChatSettingsType } from '@/types/index';

interface ChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettingsType;
  onSettingsChange: (settings: Partial<ChatSettingsType>) => void;
  availableModels: ModelConfig[];
}

export function ChatSettings({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  availableModels
}: ChatSettingsProps) {
  if (!isOpen) return null;

  const selectedModel = availableModels.find(m => m.id === settings.model);
  const maxTokensForModel = selectedModel?.maxTokens || 32000;

  const handleModelChange = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      onSettingsChange({
        model: modelId,
        maxTokens: Math.min(settings.maxTokens, model.maxTokens)
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl bg-card shadow-xl animate-fade-in mt-8 mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-primary"/>
              <h2 className="text-xl font-semibold text-foreground">Chat Settings</h2>
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

          <div className="space-y-6">
            {/* API Configuration Status */}
            <div className="space-y-3">
              <label className="text-base font-semibold text-foreground">API Configuration</label>
              <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 dark:text-green-300">✓ API Key Configured via Environment</span>
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <label className="text-base font-semibold text-foreground">AI Model</label>
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {availableModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:border-primary",
                      settings.model === model.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-muted/50"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{model.name}</div>
                        <div className="text-sm text-muted-foreground">{model.provider}</div>
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        {(model.maxTokens / 1000).toFixed(0)}K tokens
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">Advanced Settings</h3>
              
              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Temperature</label>
                  <span className="text-sm text-muted-foreground">{settings.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => onSettingsChange({ temperature: parseFloat(e.target.value) })}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Lower values make responses more focused, higher values more creative
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Max Tokens</label>
                  <span className="text-sm text-muted-foreground">{settings.maxTokens.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max={maxTokensForModel}
                  step="256"
                  value={settings.maxTokens}
                  onChange={(e) => onSettingsChange({ maxTokens: parseInt(e.target.value) })}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum tokens for the AI response (model limit: {maxTokensForModel.toLocaleString()})
                </p>
              </div>

              {/* Top P */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Top P</label>
                  <span className="text-sm text-muted-foreground">{settings.topP}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.topP}
                  onChange={(e) => onSettingsChange({ topP: parseFloat(e.target.value) })}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Controls diversity of word selection (0.1 = focused, 1.0 = diverse)
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}