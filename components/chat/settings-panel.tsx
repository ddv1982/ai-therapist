'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import type { ModelConfig } from '@/types/index';
import { SettingsPanelProps } from '@/types/component-props';

// Using centralized SettingsPanelProps interface
// Includes all configuration props for therapeutic AI settings
  topP: number;
  setTopP: (topP: number) => void;
  getModelMaxTokens: (modelName: string) => number;
}

export function SettingsPanel({
  showSettings,
  setShowSettings,
  hasEnvApiKey,
  apiKey,
  setApiKey,
  model,
  setModel,
  availableModels,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  topP,
  setTopP,
  getModelMaxTokens
}: SettingsPanelProps) {
  return (
    <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent dark:from-muted/10">
      <Button
        variant="ghost"
        onClick={() => setShowSettings(!showSettings)}
        className="w-full justify-start gap-2 text-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/30 transition-all"
      >
        <Settings className="w-4 h-4" />
        <span className="font-medium">Settings</span>
      </Button>
      
      {showSettings && (
        <div className="mt-4 space-y-4">
          {hasEnvApiKey ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="text-sm font-medium text-green-800 mb-1">
                ✓ API Key Configured
              </div>
              <div className="text-xs text-green-700">
                Using GROQ_API_KEY from environment variable
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium block mb-1">
                Groq API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Groq API key"
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
              />
              {!apiKey && (
                <div className="text-xs text-orange-600 mt-1">
                  ⚠ API key required for chat functionality
                </div>
              )}
              {apiKey && (
                <div className="text-xs text-green-600 mt-1">
                  ✓ API key provided
                </div>
              )}
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium block mb-1">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
            >
              {availableModels.length === 0 ? (
                <option disabled>Loading models...</option>
              ) : (
                availableModels.map((modelOption) => (
                  <option key={modelOption.id} value={modelOption.id}>
                    {modelOption.id} {modelOption.maxTokens ? `(${(modelOption.maxTokens / 1000).toFixed(0)}K tokens)` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-1">
              Temperature: {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Controls randomness (0 = focused, 2 = creative)
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-1">
              Max Tokens: {maxTokens.toLocaleString()} / {getModelMaxTokens(model).toLocaleString()}
            </label>
            <input
              type="range"
              min="256"
              max={getModelMaxTokens(model)}
              step="512"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Maximum response length for {model.split('/').pop()}: {getModelMaxTokens(model).toLocaleString()} tokens
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-1">
              Top P: {topP}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Nucleus sampling threshold
            </div>
          </div>
        </div>
      )}
    </div>
  );
}