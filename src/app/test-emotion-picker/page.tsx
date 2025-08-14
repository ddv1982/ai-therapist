"use client";

// Disabled due to CBT integration cleanup
// import { EmotionPicker } from "../therapy/cbt-chat/components/message-types/emotion-picker";

export default function TestEmotionPickerPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Emotion Picker Test Page</h1>
        <p className="text-muted-foreground mb-8">
          This is a standalone test page to reproduce the slider disappearing issue.
          Click on an emotion and then adjust the slider - observe if the slider value disappears.
        </p>
        
        {/* EmotionPicker disabled due to CBT integration cleanup */}
        <p className="text-muted-foreground">EmotionPicker test disabled during CBT integration</p>
      </div>
    </div>
  );
}