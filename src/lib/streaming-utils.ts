/**
 * Simple Streaming Utility
 * Handles streaming responses with proper error handling and content validation
 */

export interface StreamingOptions {
  onProgress: (content: string, modelUsed: string) => void;
  onComplete: (fullContent: string, modelUsed: string) => Promise<void>;
  onError: (error: Error) => void;
}

/**
 * Handle streaming response with robust content capture
 */
export async function handleStreamingResponse(
  response: Response,
  options: StreamingOptions
): Promise<void> {
  const { onProgress, onComplete, onError } = options;

  if (!response.body) {
    onError(new Error('No response body available'));
    return;
  }

  const reader = response.body.getReader();
  let fullContent = '';
  let capturedModel = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content || '';

            // Capture model information from the streaming response
            if (data.model) {
              capturedModel = data.model;
            }

            if (content) {
              fullContent += content;
              onProgress(fullContent, capturedModel);
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }

    // Validate content before completion
    const trimmedContent = fullContent.trim();
    if (!trimmedContent) {
      onError(new Error('No content received from AI response'));
      return;
    }

    // Complete with validated content
    await onComplete(trimmedContent, capturedModel || 'unknown');

  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Reader might already be closed
    }
  }
}