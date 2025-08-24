'use client';

import { useEffect, useRef } from 'react';
import type { CBTFormInput } from '../cbt-form-schema';

const STORAGE_KEY = 'cbt-draft';

export function useCBTDraftPersistence(data: CBTFormInput, isEnabled: boolean = true, debounceMs: number = 800) {
  const lastSavedRef = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isEnabled) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      lastSavedRef.current = raw;
    } catch {}
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;
    const next = JSON.stringify(data);
    if (next === lastSavedRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, next);
        lastSavedRef.current = next;
      } catch {}
    }, debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, isEnabled, debounceMs]);
}

export function loadCBTDraft(): CBTFormInput | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CBTFormInput;
  } catch {
    return null;
  }
}

export function clearCBTDraft() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}


