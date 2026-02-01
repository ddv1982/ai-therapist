import {
  buildTherapySystemPrompt,
  type MemoryContext,
} from '@/features/therapy/lib/therapy-prompts';
import { getReportPrompt, getTherapySystemPrompt } from '@/features/therapy/lib/therapy-prompts';

describe('buildTherapySystemPrompt localization', () => {
  const sampleMemory: MemoryContext[] = [
    {
      sessionTitle: 'Stress management',
      sessionDate: '2024-10-01',
      reportDate: '2024-10-02',
      summary: 'Cliënt oefent met ademhaling en grenzen aangeven.',
      content: 'Sensitive report content is omitted in prompts.',
    },
  ];

  it('returns a fully localized Dutch prompt without English remnants', () => {
    const prompt = buildTherapySystemPrompt('nl');

    expect(prompt).toContain('Je bent een empathische, professionele AI-therapie-assistent');
    expect(prompt).not.toContain('You are a compassionate, professional AI therapy assistant');
  });

  it('includes Dutch memory guidance when memory context is provided', () => {
    const prompt = buildTherapySystemPrompt('nl', { memory: sampleMemory });

    expect(prompt).toContain('### Therapeutisch Geheugen');
    expect(prompt).not.toContain('### Therapeutic Memory Context');
  });

  it('appends Dutch web search instructions when enabled', () => {
    const prompt = buildTherapySystemPrompt('nl', { webSearch: true });

    expect(prompt).toContain('**WEBZOEKEN ACTIEF:**');
    expect(prompt).not.toContain('**WEB SEARCH ENABLED:**');
  });

  it('delegates to buildTherapySystemPrompt when using getTherapySystemPrompt', () => {
    const prompt = getTherapySystemPrompt('en', { memory: sampleMemory, webSearch: true });

    expect(prompt).toContain('### Therapeutic Memory Context');
    expect(prompt).toContain('**WEB SEARCH ENABLED:**');
  });

  it('returns localized report prompts for each supported locale', () => {
    const nlPrompt = getReportPrompt('nl');
    const enPrompt = getReportPrompt('en');

    expect(nlPrompt).toContain('# Sessierapport Genereren');
    expect(nlPrompt).toContain('Gebruik uitsluitend Nederlands');
    expect(nlPrompt).toContain('kwetsbare kind-modus');
    expect(enPrompt).toContain('# Session Report Generation');
  });
});
