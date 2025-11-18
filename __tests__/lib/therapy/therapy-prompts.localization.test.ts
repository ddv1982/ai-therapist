import { buildTherapySystemPrompt, type MemoryContext } from '@/lib/therapy/therapy-prompts';
import { getReportPrompt, getTherapySystemPrompt } from '@/lib/therapy/prompts';

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

    expect(prompt).toContain('Je bent een warme, professionele AI-therapeut');
    expect(prompt).not.toContain('You are a compassionate, professional AI therapist');
  });

  it('includes Dutch memory guidance when memory context is provided', () => {
    const prompt = buildTherapySystemPrompt('nl', { memory: sampleMemory });

    expect(prompt).toContain('THERAPEUTISCH GEHEUGEN (SAMENVATTINGEN VAN EERDERE SESSIES):');
    expect(prompt).not.toContain('THERAPEUTIC MEMORY CONTEXT');
  });

  it('appends Dutch web search instructions when enabled', () => {
    const prompt = buildTherapySystemPrompt('nl', { webSearch: true });

    expect(prompt).toContain('**WEBZOEKFUNCTIE ACTIEF:**');
    expect(prompt).not.toContain('**WEB SEARCH CAPABILITIES ACTIVE:**');
  });

  it('delegates to buildTherapySystemPrompt when using getTherapySystemPrompt', () => {
    const prompt = getTherapySystemPrompt('en', { memory: sampleMemory, webSearch: true });

    expect(prompt).toContain('THERAPEUTIC MEMORY CONTEXT');
    expect(prompt).toContain('**WEB SEARCH CAPABILITIES ACTIVE:**');
  });

  it('returns localized report prompts for each supported locale', () => {
    expect(getReportPrompt('nl')).toContain('CLIËNT‑GERICHT');
    expect(getReportPrompt('en')).toContain('CLIENT-CENTERED APPROACH');
  });
});
