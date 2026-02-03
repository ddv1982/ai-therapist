export type SupportedLocale = 'en' | 'nl';
export type SchemaModeLabelStyle = 'report' | 'ui';

type SchemaModeLabel = {
  en: string;
  nl: string;
  nlUi: string;
  descriptionEn: string;
  descriptionNl: string;
};

const SCHEMA_MODE_LABELS: Record<string, SchemaModeLabel> = {
  'vulnerable-child': {
    en: 'The Vulnerable Child',
    nl: 'kwetsbare kind-modus',
    nlUi: 'Het Kwetsbare Kind',
    descriptionEn: 'scared, helpless, needy',
    descriptionNl: 'bang, hulpeloos, behoeftig',
  },
  'angry-child': {
    en: 'The Angry Child',
    nl: 'boze kind-modus',
    nlUi: 'Het Boze Kind',
    descriptionEn: 'frustrated, defiant, rebellious',
    descriptionNl: 'gefrustreerd, uitdagend, opstandig',
  },
  'punishing-parent': {
    en: 'The Punishing Parent',
    nl: 'straffende ouder-modus',
    nlUi: 'De Straffende Ouder',
    descriptionEn: 'critical, harsh, demanding',
    descriptionNl: 'kritisch, streng, veeleisend',
  },
  'punitive-parent': {
    en: 'The Punishing Parent',
    nl: 'straffende ouder-modus',
    nlUi: 'De Straffende Ouder',
    descriptionEn: 'critical, harsh, demanding',
    descriptionNl: 'kritisch, streng, veeleisend',
  },
  'demanding-parent': {
    en: 'The Demanding Parent',
    nl: 'eisende ouder-modus',
    nlUi: 'De Eisende Ouder',
    descriptionEn: 'controlling, entitled, impatient',
    descriptionNl: 'controlerend, veeleisend, ongeduldig',
  },
  'detached-self-soother': {
    en: 'The Detached Self-Soother',
    nl: 'afstandelijke zelftrooster-modus',
    nlUi: 'De Afstandelijke Zelftrooster',
    descriptionEn: 'withdrawn, disconnected, avoiding',
    descriptionNl: 'teruggetrokken, afgesloten, vermijdend',
  },
  'detached-protector': {
    en: 'Detached Protector',
    nl: 'afstandelijke zelftrooster-modus',
    nlUi: 'De Afstandelijke Zelftrooster',
    descriptionEn: 'withdrawn, disconnected, avoiding',
    descriptionNl: 'teruggetrokken, afgesloten, vermijdend',
  },
  'healthy-adult': {
    en: 'The Healthy Adult',
    nl: 'gezonde volwassene-modus',
    nlUi: 'De Gezonde Volwassene',
    descriptionEn: 'balanced, rational, caring',
    descriptionNl: 'in balans, rationeel, zorgzaam',
  },
};

const SCHEMA_MODE_TEXT_REPLACEMENTS_NL: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b(The )?Vulnerable Child( Mode)?\b/gi, replacement: 'kwetsbare kind-modus' },
  { pattern: /\b(The )?Angry Child( Mode)?\b/gi, replacement: 'boze kind-modus' },
  { pattern: /\b(The )?Punishing Parent( Mode)?\b/gi, replacement: 'straffende ouder-modus' },
  { pattern: /\b(The )?Punitive Parent( Mode)?\b/gi, replacement: 'straffende ouder-modus' },
  { pattern: /\b(The )?Demanding Parent( Mode)?\b/gi, replacement: 'eisende ouder-modus' },
  {
    pattern: /\b(The )?Detached Self-Soother( Mode)?\b/gi,
    replacement: 'afstandelijke zelftrooster-modus',
  },
  {
    pattern: /\b(The )?Detached Protector( Mode)?\b/gi,
    replacement: 'afstandelijke zelftrooster-modus',
  },
  { pattern: /\b(The )?Healthy Adult( Mode)?\b/gi, replacement: 'gezonde volwassene-modus' },
];

function normalizeSchemaModeKey(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-mode$/, '')
    .replace(/^the-/, '');
  return normalized;
}

function getSchemaModeLabel(
  modeId: string,
  locale: SupportedLocale,
  style: SchemaModeLabelStyle = 'report'
): string | undefined {
  const key = normalizeSchemaModeKey(modeId);
  const entry = SCHEMA_MODE_LABELS[key];
  if (!entry) return undefined;
  if (locale === 'en') return entry.en;
  return style === 'ui' ? entry.nlUi : entry.nl;
}

function getSchemaModeDescription(
  modeId: string,
  locale: SupportedLocale
): string | undefined {
  const key = normalizeSchemaModeKey(modeId);
  const entry = SCHEMA_MODE_LABELS[key];
  if (!entry) return undefined;
  return locale === 'en' ? entry.descriptionEn : entry.descriptionNl;
}

export function localizeSchemaMode(
  mode: { id?: string; name?: string; description?: string },
  locale: SupportedLocale,
  style: SchemaModeLabelStyle = 'report'
): { name?: string; description?: string } {
  if (locale === 'en') {
    return { name: mode.name, description: mode.description };
  }
  if (mode.id) {
    const name = getSchemaModeLabel(mode.id, locale, style) ?? mode.name;
    const description = getSchemaModeDescription(mode.id, locale) ?? mode.description;
    return { name, description };
  }
  return {
    name: mode.name ? replaceSchemaModeNamesInText(mode.name, locale) : mode.name,
    description: mode.description
      ? replaceSchemaModeNamesInText(mode.description, locale)
      : mode.description,
  };
}

export function replaceSchemaModeNamesInText(content: string, locale: SupportedLocale): string {
  if (locale !== 'nl') return content;
  return SCHEMA_MODE_TEXT_REPLACEMENTS_NL.reduce(
    (acc, { pattern, replacement }) => acc.replace(pattern, replacement),
    content
  );
}
