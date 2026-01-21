import { useState, useCallback } from 'react';

/**
 * Hook for single prompt selection (e.g., core belief)
 * Manages selection state for a single text value that may match a prompt
 */
export function usePromptSelection(prompts: string[], initialText: string | undefined) {
  const matchPrompt = useCallback(
    (text: string) => (prompts.includes(text) ? text : ''),
    [prompts]
  );

  const [selected, setSelected] = useState(() => matchPrompt(initialText ?? ''));

  return { selected, setSelected, matchPrompt };
}

/**
 * Hook for array of prompt selections (e.g., thoughts, rational thoughts)
 * Manages selection state for multiple items that may match prompts
 */
export function usePromptSelections<T>(
  prompts: string[],
  initialItems: T[] | undefined,
  getText: (item: T) => string
) {
  const matchPrompt = useCallback(
    (text: string) => (prompts.includes(text) ? text : ''),
    [prompts]
  );

  const computeSelections = useCallback(
    (items: T[]) => items.map((item) => matchPrompt(getText(item))),
    [matchPrompt, getText]
  );

  const [selected, setSelected] = useState(() => computeSelections(initialItems ?? []));

  return { selected, setSelected, computeSelections };
}
