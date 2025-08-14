"use client";

import { useState } from "react";
// Disabled due to CBT integration cleanup
// import { EmotionPicker } from "../therapy/cbt-chat/components/message-types/emotion-picker";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TestClickDragPage() {
  const [lastAction] = useState<string>("None");
  const [selectedEmotions] = useState<Record<string, number>>({});
  const [customEmotion] = useState<{ name: string; intensity: number } | undefined>();

  // const handleEmotionSelect = (emotions: Record<string, number>, custom?: { name: string; intensity: number }) => {
  //   setLastAction(`Emotion selected: ${JSON.stringify(emotions)} ${custom ? `+ custom: ${JSON.stringify(custom)}` : ''}`);
  //   setSelectedEmotions(emotions);
  //   setCustomEmotion(custom);
  // };

  // const handleDraftUpdate = (emotions: Record<string, number>, custom?: { name: string; intensity: number }) => {
  //   setLastAction(`Draft updated: ${JSON.stringify(emotions)} ${custom ? `+ custom: ${JSON.stringify(custom)}` : ''}`);
  // };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold">Click-Drag Conflict Resolution Test</h1>
          <p className="text-lg text-muted-foreground">
            Testing modern pointer events implementation for emotion picker
          </p>
        </div>

        {/* Test Instructions */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <h3 className="font-medium">✅ Expected Behaviors:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Click emotion card</strong> → Should toggle emotion on/off (intensity 5)</li>
                <li><strong>Drag slider</strong> → Should adjust intensity WITHOUT toggling off</li>
                <li><strong>Visual feedback</strong> → Should show &ldquo;adjusting...&rdquo; when dragging slider</li>
                <li><strong>Event separation</strong> → Click and drag should be distinct actions</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">🚫 Problematic Behaviors (should NOT happen):</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Emotion collapses when dragging slider</li>
                <li>Multiple emotions get affected when adjusting one</li>
                <li>Slider disappears during interaction</li>
                <li>Values revert after slider adjustment</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Status Panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Last Action:</h3>
              <p className="text-sm text-muted-foreground font-mono">{lastAction}</p>
            </div>
            <div className="text-right">
              <Badge variant="secondary">
                {Object.keys(selectedEmotions).length} emotions selected
              </Badge>
            </div>
          </div>
        </Card>

        {/* Selected Emotions Display */}
        {Object.keys(selectedEmotions).length > 0 && (
          <Card className="p-4">
            <h3 className="font-medium mb-2">Current Selections:</h3>
            <div className="space-y-2">
              {Object.entries(selectedEmotions).map(([emotion, intensity]) => (
                <div key={emotion} className="flex justify-between items-center">
                  <span className="font-medium">{emotion}</span>
                  <Badge variant="outline">{intensity}/10</Badge>
                </div>
              ))}
              {customEmotion && (
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="font-medium italic">{customEmotion.name}</span>
                  <Badge variant="outline">{customEmotion.intensity}/10</Badge>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* The Emotion Picker Under Test */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Emotion Picker Component</h2>
          {/* EmotionPicker disabled due to CBT integration cleanup */}
          <p className="text-muted-foreground">EmotionPicker test disabled during CBT integration</p>
        </div>

        {/* Development Notes */}
        <Card className="p-4 bg-gray-50 border-gray-200">
          <h3 className="font-medium mb-2">🔧 Technical Implementation:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Pointer Events API</strong> - Modern cross-device event handling</li>
            <li>• <strong>Distance-based drag detection</strong> - 5px threshold to differentiate clicks vs drags</li>
            <li>• <strong>Interaction state management</strong> - Tracks idle/clicking/dragging states</li>
            <li>• <strong>Event propagation control</strong> - Slider interactions don&apos;t bubble to parent</li>
            <li>• <strong>Visual feedback system</strong> - Shows &ldquo;adjusting...&rdquo; during slider interaction</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}